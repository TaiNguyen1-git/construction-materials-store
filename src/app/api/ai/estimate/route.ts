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
        const { object } = await generateObject({
            model: google(AI_CONFIG.GEMINI.MODEL || 'gemini-2.5-flash'),
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

        const detectedMaterials = object.materials;

        // 2. Match with real products in DB based on AI extraction
        const recommendations = await Promise.all(
            detectedMaterials.map(async (detected) => {
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
