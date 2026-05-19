/**
 * API: AI Project Material Estimator
 * POST /api/ai/estimate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getRateLimitIdentifier, RateLimitConfigs } from '@/lib/rate-limiter';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { AI_CONFIG } from '@/lib/ai-config';

const google = createGoogleGenerativeAI({
    apiKey: AI_CONFIG.GEMINI.API_KEY
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitId = getRateLimitIdentifier(ip, undefined, 'ai_estimate');
        const rateLimitResult = await checkRateLimit(rateLimitId, RateLimitConfigs.AI_API.GUEST);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: { message: 'Bạn đã vượt quá số lần yêu cầu. Vui lòng thử lại sau.' } },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { description, projectType, area } = body;

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        // 1. Dùng Vercel AI SDK và Zod Schema để đảm bảo đầu ra có cấu trúc chuẩn xác
        const models = [
            AI_CONFIG.GEMINI.MODEL || 'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ];

        let object: any = null;
        let lastError: any = null;

        if (AI_CONFIG.GEMINI.API_KEY) {
            for (const modelName of models) {
                try {
                    const result = await generateObject({
                        model: google(modelName),
                        system: 'Bạn là một chuyên gia dự toán vật liệu xây dựng. Hãy phân tích yêu cầu của khách hàng, loại công trình và diện tích để tính toán các vật liệu chính cần thiết. QUAN TRỌNG: Phải luôn tự động bóc tách thêm các "vật tư phụ" (Cross-selling) đi kèm. Ví dụ: xây tường thì phải có xi măng, cát; ốp gạch thì phải có keo chà ron, ke cân bằng; sơn tường phải có rulo, cọ quét, giấy nhám. Trả về kết quả dưới dạng JSON.',
                        prompt: `Phân tích yêu cầu sau:
                        - Yêu cầu: ${description}
                        - Loại công trình: ${projectType || 'Không xác định'}
                        - Diện tích/Quy mô: ${area ? area + ' m2' : 'Không xác định'}`,
                        schema: z.object({
                            summary: z.string().describe('Tóm tắt ngắn gọn về công trình và các hạng mục cần thi công.'),
                            materials: z.array(z.object({
                                genericName: z.string().describe('Tên chung của vật liệu chính hoặc vật tư phụ (ví dụ: "Xi măng PC40", "Gạch ống 8x8x18", "Keo chà ron", "Rulo lăn sơn")'),
                                estimatedQuantity: z.number().describe('Số lượng dự toán dựa trên định mức xây dựng'),
                                unit: z.string().describe('Đơn vị tính (ví dụ: "bao", "viên", "m3", "kg", "cái")'),
                                reason: z.string().describe('Lý do tại sao cần vật liệu này (đặc biệt là vật tư phụ)')
                            }))
                        })
                    });
                    
                    object = result.object;
                    if (object) {
                        console.log(`[EstimateAPI] Success with model: ${modelName}`);
                        break;
                    }
                } catch (err) {
                    console.warn(`[EstimateAPI] Model ${modelName} failed, trying fallback...`, err);
                    lastError = err;
                }
            }
        }

        // Fallback to offline mock estimator if all AI calls failed or no API key
        if (!object) {
            console.log('[EstimateAPI] Using offline smart estimation fallback');
            object = generateOfflineEstimate(description, projectType, area);
        }

        const detectedMaterials = object.materials;

        // 2. Match with real products in DB based on AI extraction
        const recommendations = await Promise.all(
            detectedMaterials.map(async (detected: { genericName: string; estimatedQuantity: number; unit: string; reason: string }) => {
                // Tách từ khóa để tìm kiếm tốt hơn
                const searchKeyword = detected.genericName.split(' ')[0]; // Lấy chữ đầu tiên để tìm rộng hơn (vd: Gạch, Xi)
                
                const products = await prisma.product.findMany({
                    where: {
                        OR: [
                            { name: { contains: detected.genericName, mode: 'insensitive' } },
                            { name: { contains: searchKeyword, mode: 'insensitive' } }
                        ],
                        isActive: true
                    },
                    take: 2,
                    include: {
                        category: true
                    },
                    orderBy: {
                        price: 'asc' // Ưu tiên gợi ý loại rẻ/phổ thông
                    }
                });

                if (products.length > 0) {
                    return products.map(p => ({
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                        unit: p.unit,
                        category: p.category?.name,
                        recommendedQty: Math.ceil(detected.estimatedQuantity),
                        confidence: 0.95,
                        reason: detected.reason,
                        isAvailable: true
                    }));
                }
                
                // Trả về vật tư dưới dạng "Gợi ý tham khảo" nếu không có sẵn trong Cửa hàng
                return [{
                    productId: null,
                    name: detected.genericName,
                    price: 0,
                    unit: detected.unit,
                    category: 'Vật tư phụ',
                    recommendedQty: Math.ceil(detected.estimatedQuantity),
                    confidence: 0.5,
                    reason: detected.reason,
                    isAvailable: false
                }];
            })
        );

        const flattened = recommendations.flat();

        return NextResponse.json({
            success: true,
            data: {
                summary: object.summary,
                recommendations: flattened
            }
        });

    } catch (error) {
        console.error('AI Estimation Error:', error);
        return NextResponse.json(
            { error: { message: 'Lỗi khi xử lý AI' } },
            { status: 500 }
        );
    }
}

/** Offline Estimator fallback engine */
function generateOfflineEstimate(description: string, projectType: string, area: number | undefined) {
    const size = area || 50;
    const type = projectType || 'general';
    
    const baseSummary = `Dự toán sơ bộ ngoại tuyến cho công trình ${type === 'painting' ? 'sơn nước' : type === 'flooring' ? 'lót sàn' : type === 'tiling' ? 'ốp lát' : 'xây dựng chung'} diện tích ~${size}m².`;
    
    const materials: Array<{ genericName: string; estimatedQuantity: number; unit: string; reason: string }> = [];

    if (type === 'painting' || description.toLowerCase().includes('sơn')) {
        materials.push(
            { genericName: 'Sơn Dulux ngoại thất', estimatedQuantity: Math.ceil(size * 0.2), unit: 'thùng', reason: 'Sơn phủ bảo vệ ngoài trời chống thấm' },
            { genericName: 'Bột trét tường Dulux', estimatedQuantity: Math.ceil(size * 0.5), unit: 'bao', reason: 'Làm phẳng bề mặt trước khi sơn' },
            { genericName: 'Cọ sơn & Rulo lăn sơn', estimatedQuantity: 2, unit: 'cái', reason: 'Vật tư phụ chuyên dụng để thi công sơn' }
        );
    } else if (type === 'flooring' || description.toLowerCase().includes('sàn') || description.toLowerCase().includes('gỗ')) {
        materials.push(
            { genericName: 'Sàn gỗ công nghiệp', estimatedQuantity: Math.ceil(size * 1.05), unit: 'm2', reason: 'Vật liệu lót sàn chính (bao gồm 5% hao hụt)' },
            { genericName: 'Form cao su lót sàn', estimatedQuantity: Math.ceil(size * 1.0), unit: 'm2', reason: 'Lớp lót chống ẩm và giảm chấn phía dưới sàn gỗ' }
        );
    } else if (type === 'tiling' || description.toLowerCase().includes('ốp') || description.toLowerCase().includes('gạch')) {
        materials.push(
            { genericName: 'Gạch Prime 60x60', estimatedQuantity: Math.ceil(size / 1.44), unit: 'hộp', reason: 'Gạch ốp lát sàn chính' },
            { genericName: 'Keo dán gạch Weber', estimatedQuantity: Math.ceil(size * 5), unit: 'kg', reason: 'Keo dán chuyên dụng chịu lực tốt' },
            { genericName: 'Keo chà ron Weber', estimatedQuantity: Math.ceil(size * 0.5), unit: 'kg', reason: 'Trám khe hở giữa các viên gạch chống thấm' },
            { genericName: 'Ke cân bằng gạch', estimatedQuantity: Math.ceil(size * 4), unit: 'cái', reason: 'Vật tư phụ canh đều mạch gạch siêu phẳng' }
        );
    } else {
        // General building
        materials.push(
            { genericName: 'Xi măng INSEE đa dụng', estimatedQuantity: Math.ceil(size * 1.5), unit: 'bao', reason: 'Vật liệu kết dính xây tô và đổ bê tông' },
            { genericName: 'Thép Hòa Phát phi 10', estimatedQuantity: Math.ceil(size * 3), unit: 'cây', reason: 'Cốt thép chịu lực dầm sàn cột' },
            { genericName: 'Cát xây tô', estimatedQuantity: Math.ceil(size * 0.1), unit: 'm3', reason: 'Trộn vữa xây tô hoàn thiện' }
        );
    }

    return {
        summary: baseSummary + " Kết quả này được tính toán dựa trên định mức xây dựng tiêu chuẩn ngành.",
        materials
    };
}

