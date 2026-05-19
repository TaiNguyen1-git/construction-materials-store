import { z } from 'zod';
import { prisma } from '../prisma';
import { generateContentWithFallback, extractTextFromSDKResult } from './ai-client';

export const chatbotTools = {
    searchProducts: {
        description: `Tìm kiếm và hiển thị sản phẩm vật liệu xây dựng từ kho hàng. 
GỌI CÔNG CỤ NÀY TRONG CÁC TRƯỜNG HỢP SAU (bắt buộc, không được bỏ qua):
1. Người dùng hỏi về bất kỳ sản phẩm/vật tư cụ thể nào (gạch, xi măng, sơn, thép, keo, cát, đá, v.v.)
2. Người dùng hỏi giá cả, tồn kho hoặc so sánh sản phẩm
3. Sau khi tính toán vật liệu (calculateMaterials) → PHẢI search ngay các sản phẩm đã đề xuất
4. Khi tư vấn cross-sell (gạch → keo chà ron, sơn → bột trét) → search từng loại
5. Người dùng đề cập đến tên thương hiệu: Dulux, Jotun, Prime, Hà Tiên, INSEE, Hòa Phát, Việt Nhật, Sika, Kova, Weber
6. Bất kỳ lúc nào bạn muốn CỤ THỂ HÓA lời tư vấn bằng sản phẩm thực tế có giá
KHÔNG gọi khi: chỉ hỏi thông tin chung về quy trình/kỹ thuật xây dựng không liên quan đến mua hàng.`,
        parameters: z.object({
            query: z.string().describe('Tên sản phẩm, danh mục hoặc từ khóa cần tìm kiếm (VD: "xi măng", "thép", "sơn")'),
            limit: z.number().optional().describe('Số lượng kết quả tối đa (mặc định 5)')
        }),
        execute: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
            console.log('=== [AI TOOL] searchProducts called with query:', query);
            try {
                if (!query) {
                    return { found: false, message: 'Vui lòng cung cấp từ khóa tìm kiếm cụ thể.' };
                }

                // Query more products to allow diversity selection
                let products = await prisma.product.findMany({
                    where: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } }
                        ],
                        isActive: true
                    },
                    include: { inventoryItem: true },
                    take: Math.max(limit * 4, 20)
                });

                let isFallbackList = false;
                if (products.length === 0) {
                    isFallbackList = true;
                    // Try to fetch featured products as a fallback
                    products = await prisma.product.findMany({
                        where: {
                            isActive: true,
                            isFeatured: true
                        },
                        include: { inventoryItem: true },
                        take: Math.max(limit * 4, 20)
                    });

                    // If no featured products, fetch any active products
                    if (products.length === 0) {
                        products = await prisma.product.findMany({
                            where: { isActive: true },
                            include: { inventoryItem: true },
                            take: Math.max(limit * 4, 20)
                        });
                    }
                }

                // Helper to clean/normalize names for similarity check
                const removeAccentsAndSpecial = (str: string) => {
                    return str
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .trim();
                };

                // Group products by categoryId
                const byCategory: Record<string, any[]> = {};
                for (const p of products) {
                    if (!byCategory[p.categoryId]) {
                        byCategory[p.categoryId] = [];
                    }
                    byCategory[p.categoryId].push(p);
                }

                const categoryIds = Object.keys(byCategory);
                const selected: any[] = [];
                const selectedNames = new Set<string>();

                // Round-robin selection across categories
                let added = true;
                const categoryIndices: Record<string, number> = {};
                for (const catId of categoryIds) {
                    categoryIndices[catId] = 0;
                }

                while (selected.length < limit && added) {
                    added = false;
                    for (const catId of categoryIds) {
                        if (selected.length >= limit) break;

                        const list = byCategory[catId];
                        const idx = categoryIndices[catId];

                        let found = false;
                        for (let i = idx; i < list.length; i++) {
                            const candidate = list[i];
                            const cleanName = removeAccentsAndSpecial(candidate.name);

                            // Skip if too similar to already selected products
                            let isTooSimilar = false;
                            for (const existingName of selectedNames) {
                                const words1 = cleanName.split(/\s+/).filter(w => w.length > 1);
                                const words2 = existingName.split(/\s+/).filter(w => w.length > 1);
                                const intersection = words1.filter(w => words2.includes(w));
                                const maxLen = Math.max(words1.length, words2.length);
                                if (maxLen > 0) {
                                    const overlap = intersection.length / maxLen;
                                    if (overlap > 0.75) {
                                        isTooSimilar = true;
                                        break;
                                    }
                                }
                            }

                            if (!isTooSimilar) {
                                selected.push(candidate);
                                selectedNames.add(cleanName);
                                categoryIndices[catId] = i + 1;
                                added = true;
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            categoryIndices[catId] = idx + 1;
                        }
                    }
                }

                // Fallback: fill remaining space if any
                if (selected.length < limit && selected.length < products.length) {
                    for (const p of products) {
                        if (selected.length >= limit) break;
                        if (!selected.some(s => s.id === p.id)) {
                            selected.push(p);
                        }
                    }
                }

                return {
                    found: true,
                    isFallbackList,
                    products: selected.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        wholesalePrice: p.wholesalePrice,
                        minWholesaleQty: p.minWholesaleQty,
                        unit: p.unit,
                        imageUrl: p.images?.[0] || null, // Map specific product image URL
                        inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false,
                        stockQuantity: p.inventoryItem?.availableQuantity || 0
                    }))
                };
            } catch (error) {
                console.error('=== [AI TOOL ERROR] searchProducts failed:', error);
                return { found: false, message: 'Đã xảy ra lỗi khi truy vấn sản phẩm.' };
            }
        }
    },
    
    calculateMaterials: {
        description: `Tính toán sơ bộ số lượng vật tư cần thiết dựa trên định mức xây dựng Việt Nam.
GỌI TOOL NÀY NGAY (không hỏi lại) khi khách đề cập:
- Diện tích/quy mô công trình (100m2, 200m2, nhà 3 tầng...)
- Số lượng vật tư cho thép cuộn/thép cốt thép xây dựng
- Hỏi "cần bao nhiêu" vật tư cho công trình
CÁC TYPE HỖ TRỢ:
- tuong_10: Xây tường gạch 10cm
- tuong_20: Xây tường gạch 20cm  
- san_betong: Đổ sàn bê tông
- thep_cuon: Thép cuộn/cốt thép cho công trình (dầm, cột, móng, sàn)
- nha_cap_4: Dự toán tổng hợp nhà cấp 4 (xi măng + thép + gạch + cát đá)`,
        parameters: z.object({
            area: z.number().describe('Diện tích (m2) hoặc thể tích (m3). Ví dụ: 200 cho 200m2'),
            type: z.enum(['tuong_10', 'tuong_20', 'san_betong', 'thep_cuon', 'nha_cap_4']).describe('Loại hạng mục: thep_cuon cho thép xây dựng, nha_cap_4 cho nhà tổng hợp')
        }),
        execute: async ({ area, type }: { area: number; type: 'tuong_10' | 'tuong_20' | 'san_betong' | 'thep_cuon' | 'nha_cap_4' }) => {
            // Định mức cơ bản (mang tính tham khảo)
            switch (type) {
                case 'tuong_10': // Tường 10cm (1m2)
                    return {
                        materials: [
                            { name: 'Gạch ống 8x8x18', quantity: area * 55, unit: 'viên' },
                            { name: 'Xi măng', quantity: area * 5.4, unit: 'kg' },
                            { name: 'Cát xây', quantity: area * 0.02, unit: 'm3' },
                            { name: 'Bay thợ nề', quantity: 1, unit: 'cái', isAuxiliary: true },
                            { name: 'Thước nivo', quantity: 1, unit: 'cái', isAuxiliary: true }
                        ],
                        note: 'Đây là định mức tham khảo cho tường 10cm. Hệ thống đã tự gài thêm dụng cụ phụ (Bay, Thước nivo) để thi công thuận tiện.'
                    };
                case 'tuong_20': // Tường 20cm (1m2)
                    return {
                        materials: [
                            { name: 'Gạch ống 8x8x18', quantity: area * 110, unit: 'viên' },
                            { name: 'Xi măng', quantity: area * 10.8, unit: 'kg' },
                            { name: 'Cát xây', quantity: area * 0.04, unit: 'm3' },
                            { name: 'Bay thợ nề', quantity: 1, unit: 'cái', isAuxiliary: true },
                            { name: 'Thước dọi', quantity: 1, unit: 'cái', isAuxiliary: true }
                        ],
                        note: 'Đây là định mức tham khảo cho tường 20cm. Đã bao gồm vật tư phụ (Bay, Thước dọi).'
                    };
                case 'san_betong':
                    return {
                        materials: [
                            { name: 'Xi măng PC40', quantity: area * 35, unit: 'kg' },
                            { name: 'Cát vàng', quantity: area * 0.05, unit: 'm3' },
                            { name: 'Đá 1x2', quantity: area * 0.09, unit: 'm3' },
                            { name: 'Bạt ni lông trải sàn', quantity: area * 1.1, unit: 'm2', isAuxiliary: true },
                            { name: 'Thép buộc', quantity: area * 0.5, unit: 'kg', isAuxiliary: true }
                        ],
                        note: 'Định mức đổ sàn 10cm. Đã tự gài thêm bạt ni lông và thép buộc.'
                    };
                case 'thep_cuon': {
                    // Định mức thép cuộn xây dựng tổng hợp (dầm, cột, móng, sàn) cho công trình dân dụng
                    // Trung bình 80-120kg thép/m2 sàn tuỳ kết cấu
                    const thepPhi10 = Math.ceil(area * 45); // thép phi 10 cho đan sàn
                    const thepPhi12 = Math.ceil(area * 30); // thép phi 12 cho dầm phụ
                    const thepPhi16 = Math.ceil(area * 20); // thép phi 16 cho cột dầm chính
                    const thepPhi6  = Math.ceil(area * 10); // thép phi 6 cốt đai
                    const tongThep  = thepPhi10 + thepPhi12 + thepPhi16 + thepPhi6;
                    return {
                        materials: [
                            { name: 'Thép cuộn phi 6 (cốt đai, bẻ móc)', quantity: thepPhi6, unit: 'kg' },
                            { name: 'Thép cây phi 10 (đan sàn)', quantity: thepPhi10, unit: 'kg' },
                            { name: 'Thép cây phi 12 (dầm phụ)', quantity: thepPhi12, unit: 'kg' },
                            { name: 'Thép cây phi 16 (cột, dầm chính)', quantity: thepPhi16, unit: 'kg' },
                            { name: 'Dây buộc thép (kẽm buộc)', quantity: Math.ceil(tongThep * 0.005), unit: 'kg', isAuxiliary: true },
                            { name: 'Miếng kê thép (con kê bê tông)', quantity: Math.ceil(area * 4), unit: 'viên', isAuxiliary: true }
                        ],
                        totalSteel: `~${tongThep}kg (~${(tongThep / 1000).toFixed(1)} tấn)`,
                        note: `Định mức tổng hợp cho công trình ${area}m² (dầm + cột + móng + sàn). Tổng thép ước tính: ~${tongThep}kg (~${(tongThep/1000).toFixed(1)} tấn). Đã bao gồm dây buộc và con kê. Có thể điều chỉnh tuỳ kết cấu thực tế.`
                    };
                }
                case 'nha_cap_4': {
                    // Định mức tổng hợp nhà cấp 4 tiêu chuẩn
                    return {
                        materials: [
                            { name: 'Xi măng đa dụng PC40', quantity: Math.ceil(area * 8), unit: 'bao (50kg)' },
                            { name: 'Cát xây tô', quantity: Math.ceil(area * 0.3), unit: 'm3' },
                            { name: 'Đá 1x2 đổ móng/sàn', quantity: Math.ceil(area * 0.15), unit: 'm3' },
                            { name: 'Gạch ống 8x8x18', quantity: Math.ceil(area * 80), unit: 'viên' },
                            { name: 'Thép cuộn phi 10 (cốt thép tổng hợp)', quantity: Math.ceil(area * 40), unit: 'kg' },
                            { name: 'Thép phi 6 (đai cột, móc bẻ)', quantity: Math.ceil(area * 15), unit: 'kg' }
                        ],
                        note: `Định mức sơ bộ nhà cấp 4 diện tích ${area}m². Đây là ước tính tổng hợp, cần điều chỉnh theo bản vẽ thiết kế thực tế.`
                    };
                }
                default:
                    return { 
                        error: 'Chưa hỗ trợ hạng mục này.',
                        supported: ['tuong_10', 'tuong_20', 'san_betong', 'thep_cuon', 'nha_cap_4']
                    };
            }
        }
    },

    compareProducts: {
        description: `So sánh 2 sản phẩm/vật liệu xây dựng và đưa ra gợi ý phù hợp dựa trên nhiều điều kiện thực tế.
GỌI TOOL NÀY KHI:
- Khách hỏi "X hay Y tốt hơn?", "khác nhau gì?", "nên dùng cái nào?", "cái nào phù hợp?"
- Khách đang phân vân giữa 2 loại vật liệu hoặc 2 thương hiệu
QUAN TRỌNG: Tool có 3 cấp fallback: (1) Knowledge base nội bộ → (2) Database giá thực tế → (3) Gemini AI có guardrail chống hallucination.
Trước khi gọi tool, hãy thu thập thêm context: không gian (trong/ngoài nhà), mục đích sử dụng, ngân sách nếu chưa có.
Sau khi so sánh → gọi searchProducts cho sản phẩm được khuyến nghị.`,
        parameters: z.object({
            productA: z.string().describe('Vật liệu/sản phẩm thứ nhất'),
            productB: z.string().describe('Vật liệu/sản phẩm thứ hai'),
            space: z.enum(['indoor', 'outdoor', 'both', 'unknown']).optional()
                .describe('Không gian sử dụng: indoor=trong nhà, outdoor=ngoài trời, both=cả hai, unknown=chưa rõ'),
            purpose: z.string().optional()
                .describe('Mục đích cụ thể (VD: "chống thấm", "lát nền bếp", "tô tường phòng ngủ", "xây cột chịu lực")'),
            budget: z.enum(['economy', 'standard', 'premium', 'unknown']).optional()
                .describe('Ngân sách: economy=tiết kiệm, standard=phổ thông, premium=cao cấp'),
            buildingType: z.string().optional()
                .describe('Loại công trình (VD: "nhà phố", "nhà xưởng", "nhà vệ sinh")')
        }),
        execute: async ({ productA, productB, space = 'unknown', purpose, budget = 'unknown', buildingType }: {
            productA: string; productB: string;
            space?: 'indoor' | 'outdoor' | 'both' | 'unknown';
            purpose?: string; budget?: 'economy' | 'standard' | 'premium' | 'unknown';
            buildingType?: string;
        }) => {
            console.log(`=== [AI TOOL] compareProducts: "${productA}" vs "${productB}" | space=${space} purpose=${purpose} budget=${budget}`);

            // Built-in expert knowledge base for common comparisons
            const knowledgeBase: Record<string, {
                summary: string;
                itemA: { pros: string[]; cons: string[]; bestFor: string };
                itemB: { pros: string[]; cons: string[]; bestFor: string };
                recommendation: string;
                priceRange: { a: string; b: string };
            }> = {
                'xi_mang_trang_bot_tret': {
                    summary: 'Xi măng trắng và bột trét đều dùng để hoàn thiện bề mặt tường nhưng khác nhau hoàn toàn về công năng.',
                    itemA: {
                        pros: ['Cứng chắc, chống nước tốt hơn', 'Bám dính cao', 'Phù hợp tô trát bề mặt thô', 'Giá rẻ hơn bột trét'],
                        cons: ['Bề mặt sau khi khô không mịn đẹp', 'Khó sơn phủ trực tiếp', 'Dễ nứt nẻ nếu không bảo dưỡng đúng'],
                        bestFor: 'Tô trát tường thô, làm lớp nền trước khi bả bột trét, ốp lát'
                    },
                    itemB: {
                        pros: ['Bề mặt siêu mịn phẳng sau khi bả', 'Dễ thi công, bám tường tốt', 'Tiết kiệm sơn phủ', 'Bề mặt đẹp sau khi sơn'],
                        cons: ['Không chịu nước tốt bằng xi măng', 'Giá cao hơn', 'Không thay thế được lớp tô trát thô'],
                        bestFor: 'Làm phẳng bề mặt tường trước khi sơn, hoàn thiện nội thất'
                    },
                    recommendation: 'Dùng ĐỒng THỜI: xi măng trắng tô trát thô → bột trét bả mịn → sơn phủ. Không thể thay thế lẫn nhau.',
                    priceRange: { a: '~80.000–120.000đ/bao 25kg', b: '~90.000–150.000đ/bao 20kg' }
                },
                'son_noi_that_son_ngoai_that': {
                    summary: 'Sơn nội thất và ngoại thất khác nhau về thành phần chống UV và chống thấm.',
                    itemA: {
                        pros: ['Màu sắc phong phú, đẹp hơn', 'Ít mùi hơn', 'Giá thấp hơn', 'An toàn trong nhà'],
                        cons: ['Không chịu được mưa nắng', 'Phai màu nhanh nếu dùng ngoài trời', 'Không chống thấm'],
                        bestFor: 'Tường trong nhà: phòng ngủ, phòng khách, hành lang nội bộ'
                    },
                    itemB: {
                        pros: ['Chống UV, chống mưa nắng', 'Chống thấm tốt', 'Bền màu 5-10 năm ngoài trời', 'Chống rêu mốc'],
                        cons: ['Màu ít hơn', 'Giá cao hơn 30-50%', 'Mùi nặng hơn khi thi công'],
                        bestFor: 'Tường ngoài nhà, sân thượng, hàng rào, mái hiên'
                    },
                    recommendation: 'Chọn theo VỊ TRÍ: trong nhà → nội thất; ngoài trời/ẩm ướt → ngoại thất. KHÔNG dùng nội thất cho tường ngoài.',
                    priceRange: { a: '~250.000–450.000đ/thùng 5L', b: '~350.000–650.000đ/thùng 5L' }
                },
                'keo_dan_gach_ho_vua': {
                    summary: 'Keo dán gạch và hồ vữa xi măng đều dùng để ốp/lát gạch nhưng keo cho chất lượng vượt trội.',
                    itemA: {
                        pros: ['Bám dính mạnh gấp 3-5 lần hồ thường', 'Chống thấm tốt', 'Độ co ngót thấp, ít nứt', 'Phù hợp gạch lớn 60x60, 80x80'],
                        cons: ['Giá cao hơn hồ vữa', 'Cần trộn đúng tỷ lệ'],
                        bestFor: 'Ốp tường cao, lát gạch lớn, nhà vệ sinh, ban công, ngoài trời'
                    },
                    itemB: {
                        pros: ['Giá rẻ hơn nhiều', 'Dễ trộn tại chỗ', 'Phổ biến, quen thuộc'],
                        cons: ['Bám dính yếu hơn keo', 'Dễ rỗng bọt bên dưới gạch', 'Không phù hợp gạch lớn', 'Dễ thấm nước'],
                        bestFor: 'Lát gạch nhỏ 20x20-30x30 ở nền trong nhà khô ráo'
                    },
                    recommendation: 'Nên dùng KEO DÁN GẠCH cho mọi trường hợp ốp tường và lát gạch lớn. Hồ vữa chỉ dùng cho gạch nhỏ trong nhà khô.',
                    priceRange: { a: '~120.000–200.000đ/bao 25kg', b: '~30.000–50.000đ tự trộn xi+cát/m2' }
                },
                'gach_ceramic_gach_granite': {
                    summary: 'Gạch ceramic (gạch men) và granite khác nhau về độ cứng, độ bóng và ứng dụng.',
                    itemA: {
                        pros: ['Giá rẻ hơn', 'Nhẹ, dễ thi công', 'Nhiều mẫu mã, màu sắc', 'Đủ dùng cho nội thất'],
                        cons: ['Cứng kém hơn granite', 'Dễ trầy xước', 'Độ hút ẩm cao hơn', 'Không phù hợp ngoài trời'],
                        bestFor: 'Phòng ngủ, phòng khách, nhà bếp nội thất nhẹ'
                    },
                    itemB: {
                        pros: ['Cực kỳ cứng và bền', 'Chống trầy, chống mài mòn', 'Chịu nước hoàn toàn', 'Sang trọng, bề mặt bóng cao'],
                        cons: ['Giá cao hơn ceramic 2-5 lần', 'Nặng, khó thi công hơn', 'Cần máy cắt chuyên dụng'],
                        bestFor: 'Sảnh lớn, nơi đi lại nhiều, nhà vệ sinh cao cấp, ngoài trời'
                    },
                    recommendation: 'Tùy ngân sách: bình dân → ceramic; cao cấp/bền lâu → granite. Nhà vệ sinh và ngoài trời nên chọn granite hoặc ceramic chống trơn.',
                    priceRange: { a: '~150.000–400.000đ/m2', b: '~300.000–1.200.000đ/m2' }
                },
                'xi_mang_ha_tien_xi_mang_insee': {
                    summary: 'Hai thương hiệu xi măng hàng đầu Việt Nam, chất lượng tương đương nhưng có sự khác biệt nhỏ.',
                    itemA: {
                        pros: ['Thương hiệu lâu đời, quen thuộc', 'Giá thường rẻ hơn một chút', 'Phổ biến khắp miền Nam'],
                        cons: ['Phân phối không đều bằng INSEE', 'Một số vùng khan hàng'],
                        bestFor: 'Xây tô tường, đổ bê tông dân dụng thông thường'
                    },
                    itemB: {
                        pros: ['Chất lượng đồng đều, ổn định', 'Mác xi măng đa dạng (PC30, PC40, PCB40)', 'Hệ thống phân phối rộng toàn quốc', 'Phù hợp công trình lớn'],
                        cons: ['Giá cao hơn Hà Tiên khoảng 5-10%'],
                        bestFor: 'Mọi công trình từ dân dụng đến công nghiệp, được khuyến nghị cho công trình cần độ đồng đều cao'
                    },
                    recommendation: 'Cả hai đều tốt. Nếu khan hàng một loại → thay thế được hoàn toàn. INSEE được ưa chuộng hơn cho công trình lớn nhờ chất lượng ổn định.',
                    priceRange: { a: '~90.000–110.000đ/bao 50kg', b: '~95.000–115.000đ/bao 50kg' }
                },
                'son_lot_son_phu': {
                    summary: 'Sơn lót và sơn phủ là 2 lớp bắt buộc trong quy trình sơn hoàn chỉnh, không thể thiếu nhau.',
                    itemA: {
                        pros: ['Tạo nền bám dính cho sơn phủ', 'Chống kiềm từ tường', 'Tiết kiệm sơn phủ (giảm 1 lớp)', 'Chống thấm lớp đầu'],
                        cons: ['Không có màu đẹp', 'Không dùng độc lập được'],
                        bestFor: 'Bước đầu tiên BẮT BUỘC trước khi sơn phủ, đặc biệt tường mới'
                    },
                    itemB: {
                        pros: ['Màu sắc đẹp, phong phú', 'Bề mặt mịn, bóng hoặc mờ', 'Chống bẩn, dễ lau chùi', 'Lớp hoàn thiện cuối cùng'],
                        cons: ['Không bám tốt nếu không có sơn lót', 'Tốn nhiều hơn nếu thiếu lót'],
                        bestFor: 'Lớp hoàn thiện sau khi đã sơn lót, tạo màu và bảo vệ'
                    },
                    recommendation: 'PHẢI dùng CẢ HAI: Sơn lót 1 lớp → Sơn phủ 2 lớp. Bỏ qua sơn lót khiến sơn phủ bong tróc nhanh, tốn kém hơn về lâu dài.',
                    priceRange: { a: '~200.000–350.000đ/thùng 5L', b: '~250.000–650.000đ/thùng 5L' }
                },
                'thep_hoa_phat_thep_viet_nhat': {
                    summary: 'Hai thương hiệu thép xây dựng hàng đầu Việt Nam, đều đạt chuẩn TCVN.',
                    itemA: {
                        pros: ['Tập đoàn lớn nhất Việt Nam', 'Giá thường cạnh tranh hơn', 'Chất lượng ổn định, đạt chuẩn', 'Phân phối rộng khắp'],
                        cons: ['Giá biến động theo thị trường thép', 'Cần kiểm tra tem QR chính hãng'],
                        bestFor: 'Mọi công trình dân dụng và dân dụng quy mô vừa'
                    },
                    itemB: {
                        pros: ['Liên doanh Việt-Nhật, công nghệ Nhật Bản', 'Chất lượng cao cấp, bề mặt đẹp', 'Được nhiều kỹ sư tin dùng', 'Ít gỉ sét hơn'],
                        cons: ['Giá thường cao hơn Hòa Phát 3-8%'],
                        bestFor: 'Công trình cao tầng, yêu cầu chất lượng cao, biệt thự'
                    },
                    recommendation: 'Cả hai đều đạt chuẩn TCVN 1651. Ngân sách bình dân → Hòa Phát; công trình cao cấp → Việt Nhật. Kiểm tra tem chống hàng giả!',
                    priceRange: { a: '~14.000–17.000đ/kg (tuỳ phi)', b: '~15.000–18.000đ/kg (tuỳ phi)' }
                },
            };

            // Normalize input to find matching pair
            const normalize = (s: string) => s.toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/xi_măng/g, 'xi_mang')
                .replace(/bột_trét/g, 'bot_tret')
                .replace(/nội_thất/g, 'noi_that')
                .replace(/ngoại_thất/g, 'ngoai_that')
                .replace(/hồ_vữa|vữa_hồ/g, 'ho_vua')
                .replace(/keo_dán_gạch|keo_gạch/g, 'keo_dan_gach')
                .replace(/ceramic|men/g, 'ceramic')
                .replace(/granite|granit/g, 'granite')
                .replace(/hà_tiên/g, 'ha_tien')
                .replace(/insee/g, 'insee')
                .replace(/lót/g, 'lot')
                .replace(/phủ/g, 'phu')
                .replace(/hòa_phát/g, 'hoa_phat')
                .replace(/việt_nhật/g, 'viet_nhat');

            const keyA = normalize(productA);
            const keyB = normalize(productB);

            // Try to find matching entry in both directions
            let matchedComparison = null;
            for (const [key, val] of Object.entries(knowledgeBase)) {
                const [k1, k2] = key.split('_vs_').length > 1
                    ? key.split('_vs_')
                    : key.split('_').length > 2
                        ? [key.split('_').slice(0, Math.floor(key.split('_').length / 2)).join('_'), key.split('_').slice(Math.floor(key.split('_').length / 2)).join('_')]
                        : [key, ''];
                if (
                    (keyA.includes(k1) || k1.includes(keyA)) ||
                    (keyB.includes(k2) || k2.includes(keyB)) ||
                    key.includes(keyA) || key.includes(keyB)
                ) {
                    matchedComparison = { key, ...val };
                    break;
                }
            }

            // Try to get real DB prices for both
            let dbProductA = null;
            let dbProductB = null;
            try {
                const [resA, resB] = await Promise.all([
                    prisma.product.findFirst({
                        where: { name: { contains: productA.split(' ')[0], mode: 'insensitive' }, isActive: true },
                        include: { inventoryItem: true }
                    }),
                    prisma.product.findFirst({
                        where: { name: { contains: productB.split(' ')[0], mode: 'insensitive' }, isActive: true },
                        include: { inventoryItem: true }
                    })
                ]);
                dbProductA = resA;
                dbProductB = resB;
            } catch (_) { /* DB lookup optional */ }

            // Context summary to pass downstream
            const contextSummary = [
                space !== 'unknown' ? `Không gian: ${space === 'indoor' ? 'Trong nhà' : space === 'outdoor' ? 'Ngoài trời' : 'Trong & ngoài nhà'}` : null,
                purpose ? `Mục đích: ${purpose}` : null,
                budget !== 'unknown' ? `Ngân sách: ${budget === 'economy' ? 'Tiết kiệm' : budget === 'standard' ? 'Phổ thông' : 'Cao cấp'}` : null,
                buildingType ? `Loại công trình: ${buildingType}` : null,
            ].filter(Boolean).join(' | ');

            // --- LEVEL 3 FALLBACK: Gemini AI với guardrail chặt chẽ ---
            let aiInsight: string | null = null;
            if (!matchedComparison) {
                try {
                    const guardrailPrompt = `Bạn là chuyên gia vật liệu xây dựng Việt Nam. Hãy so sánh NGẮN GỌN "${productA}" và "${productB}" theo các tiêu chí dưới đây.

ĐIỀU KIỆN SỬ DỤNG:
${contextSummary || 'Chưa xác định điều kiện cụ thể'}

YÊU CẦU TRẢ LỜI (BẮT BUỘC tuân thủ các quy tắc sau):
1. Chỉ so sánh về: công năng, độ bền, khả năng chịu nước/UV, giá tham khảo thị trường VN, phù hợp với điều kiện đã cho.
2. TUYỆT ĐỐI KHÔNG bịa đặt số liệu cụ thể (% hiệu quả, tuổi thọ chính xác) nếu không chắc chắn — thay bằng "khoảng" hoặc "thường".
3. KHÔNG được tư vấn ngoài lĩnh vực vật liệu xây dựng.
4. Nếu đây không phải vật liệu xây dựng, trả về: {"error": "Ngoài phạm vi tư vấn vật liệu xây dựng"}
5. Kết thúc PHẢI có câu khuyến nghị rõ ràng phù hợp với điều kiện đã nêu.
6. Trả lời bằng tiếng Việt, tối đa 150 từ, ngắn gọn như chuyên gia thực địa.
7. Đánh dấu [DỰ ĐOÁN] nếu thông tin không chắc chắn 100%.

Định dạng trả lời:
- **${productA}**: [ưu/nhược điểm chính theo điều kiện]  
- **${productB}**: [ưu/nhược điểm chính theo điều kiện]  
- **Khuyến nghị**: [chọn loại nào và lý do ngắn gọn]`;

                    const result = await generateContentWithFallback({
                        contents: [{ role: 'user', parts: [{ text: guardrailPrompt }] }],
                        generationConfig: { maxOutputTokens: 400, temperature: 0.2 }
                    });
                    const raw = extractTextFromSDKResult(result);
                    if (raw && !raw.includes('"error"')) {
                        aiInsight = raw;
                    }
                } catch (e) {
                    console.warn('[compareProducts] Gemini fallback failed:', e);
                }
            }

            return {
                comparing: { productA, productB },
                context: { space, purpose: purpose || null, budget, buildingType: buildingType || null, summary: contextSummary || 'Chưa có điều kiện cụ thể' },
                expertKnowledge: matchedComparison || null,
                aiInsight: aiInsight || null,
                inStock: {
                    productA: dbProductA ? { name: dbProductA.name, price: dbProductA.price, unit: dbProductA.unit, available: dbProductA.inventoryItem?.availableQuantity ?? 0 } : null,
                    productB: dbProductB ? { name: dbProductB.name, price: dbProductB.price, unit: dbProductB.unit, available: dbProductB.inventoryItem?.availableQuantity ?? 0 } : null
                },
                dataSource: matchedComparison ? 'knowledge_base' : aiInsight ? 'gemini_ai_guardrailed' : 'ai_general',
                renderNote: 'Trình bày kết quả dạng bảng Markdown 2 cột. Nếu dataSource=gemini_ai_guardrailed, thêm dòng chú thích nhỏ: "ℹ️ Thông tin tổng hợp từ AI, mang tính tham khảo." Kết thúc bằng 1 câu khuyến nghị dứt khoát phù hợp với điều kiện của khách.'
            };
        }
    },

    searchKnowledgeBase: {
        description: 'Tra cứu cơ sở dữ liệu kiến thức (Knowledge Base) để trả lời các câu hỏi về kỹ thuật thi công, hướng dẫn sử dụng, bảo quản vật liệu xây dựng (ví dụ: cách chống thấm, cách trộn vữa, quy trình thi công sơn...).',
        parameters: z.object({
            query: z.string().describe('Từ khóa hoặc câu hỏi cần tra cứu (VD: "cách chống thấm tường", "thi công sơn Kova")')
        }),
        execute: async ({ query }: { query: string }) => {
            // Mock Vector DB Search cho Hỗ trợ kỹ thuật
            const mockKnowledgeDB = [
                // 1-5: Waterproofing & Dampness
                {
                    title: 'Xử lý tường thấm ngược từ nhà bên cạnh',
                    content: 'B1: Đục lớp vữa cũ sát gạch đỏ. B2: Quét dung dịch chống thấm tinh thể thẩm thấu (VD: Water Seal DPC hoặc quét hồ dầu Sika Latex). B3: Trát vữa mác 75 có trộn phụ gia Latex chống thấm. B4: Chờ khô ráo hoàn toàn rồi bả matit và sơn lót kháng kiềm.',
                    keywords: ['thấm ngược', 'thấm tường', 'nhà sát bên', 'tường giáp ranh', 'water seal', 'sika latex']
                },
                {
                    title: 'Chống thấm sân thượng lộ thiên',
                    content: 'B1: Mài nhám sàn bê tông, dọn sạch bụi. B2: Trám trét các vết nứt bằng keo polyurethane Sika Flex. B3: Quét 1 lớp lót và 2 lớp phủ chống thấm polyurethane đàn hồi (VD: Sika Raintite hoặc Kova CT-11A). B4: Kiểm tra ngâm nước 24h trước khi nghiệm thu.',
                    keywords: ['thấm sân thượng', 'sân thượng', 'lộ thiên', 'sikaflex', 'sika raintite', 'kova ct11a', 'ngâm nước']
                },
                {
                    title: 'Chống thấm nhà vệ sinh, phòng tắm',
                    content: 'B1: Đục rộng cổ ống xuyên sàn, đổ bù bằng vữa không co ngót SikaGrout 214-11. B2: Bo góc chân tường bằng vữa trộn Sika Latex. B3: Quét 2 lớp màng chống thấm 2 thành phần (VD: Sikatop Seal 107 hoặc Mapelastic). B4: Dán lưới thủy tinh gia cố các góc chân tường.',
                    keywords: ['thấm nhà vệ sinh', 'toilet', 'cổ ống', 'sikagrout', 'sikatop 107', 'chân tường', 'lưới thủy tinh']
                },
                {
                    title: 'Xử lý thấm dột máng xối sênô bê tông',
                    content: 'B1: Làm sạch bề mặt sênô. B2: Trét keo Silicon kháng nước hoặc quét Sika Multiseal dọc các khe tiếp giáp dột. B3: Quét phủ sơn chống thấm Acrylic Sika Raintite dầy 2 lớp dọc sênô.',
                    keywords: ['thấm sênô', 'máng xối', 'dột sênô', 'sika multiseal', 'raintite', 'bê tông nứt']
                },
                {
                    title: 'Chống thấm bể nước ăn, hồ bơi',
                    content: 'Sử dụng các chất chống thấm không độc hại, đạt chứng chỉ an toàn nguồn nước. Khuyên dùng Sikatop Seal 107 quét 2-3 lớp vuông góc nhau lên bề mặt bê tông sạch. Sau đó tô vữa bảo vệ trước khi lát gạch men.',
                    keywords: ['bể nước', 'hồ bơi', 'bể cá', 'nước sinh hoạt', 'an toàn', 'sikatop 107']
                },

                // 6-10: Concrete & Mortar
                {
                    title: 'Tỷ lệ trộn vữa xây tô chuẩn (Mác 75)',
                    content: 'Tỷ lệ tiêu chuẩn cho 1 bao xi măng PC40: Trộn đều với 10-12 thùng cát cát vàng/cát tô (thùng sơn 18L) và khoảng 2 thùng nước sạch. Trộn khô cát và xi măng trước, sau đó đổ nước từ từ tránh vữa bị nhão.',
                    keywords: ['trộn vữa', 'tỷ lệ', 'mác vữa', 'cát', 'nước', 'trộn xi măng', 'mác 75']
                },
                {
                    title: 'Quy trình bảo dưỡng bê tông mới đổ',
                    content: 'Bê tông sau khi đổ cần giữ ẩm liên tục. B1: Phủ bao tải ẩm hoặc nilon ngay sau khi bê tông se mặt. B2: Tưới nước nhẹ nhàng định kỳ 3-4 lần/ngày trong 7 ngày đầu. B3: Không dỡ cốp pha sàn trước 21 ngày.',
                    keywords: ['bảo dưỡng bê tông', 'tưới nước bê tông', 'nứt bê tông', 'cốp pha', 'dỡ cốp pha', 'giữ ẩm']
                },
                {
                    title: 'Xử lý vết nứt chân chim trên bề mặt bê tông',
                    content: 'Nứt chân chim thường do mất nước nhanh khi bê tông khô ráo. Khắc phục: Vệ sinh vết nứt, quét keo epoxy gốc xi măng mỏng dẹt hoặc sử dụng chất kết nối Sika Latex trát miết chặt vào vết nứt.',
                    keywords: ['nứt chân chim', 'nứt bê tông', 'bê tông nứt', 'keo epoxy', 'sika latex']
                },
                {
                    title: 'Cách xử lý xi măng bị vón cục tại công trình',
                    content: 'Nếu xi măng mới vón cục nhẹ (bóp nhẹ ra bột) thì vẫn dùng xây trát được nhưng phải rây bỏ hạt cứng. Nếu cục cứng ngắc như đá thì xi măng đã bị chết (hết hạn sử dụng/ẩm nước), bắt buộc phải loại bỏ, không được dùng đổ bê tông.',
                    keywords: ['xi măng vón cục', 'xi măng chết', 'xi măng đông cứng', 'hạn sử dụng', 'rây xi măng']
                },
                {
                    title: 'Cách đổ bê tông tươi đạt chuẩn Mác 250',
                    content: 'Cấp phối chuẩn cho 1m3 bê tông Mác 250 (dùng xi măng PC40): 340kg Xi măng + 0.45m3 Cát + 0.85m3 Đá 1x2 + 185 Lít Nước sạch. Tránh đổ nước thêm tại công trường làm loãng giảm mác bê tông.',
                    keywords: ['mác 250', 'bê tông tươi', 'cấp phối', 'đá 1x2', 'cát vàng']
                },

                // 11-15: Painting & Plastering
                {
                    title: 'Khắc phục hiện tượng sơn tường bị bong tróc, phồng rộp',
                    content: 'Nguyên nhân do tường ẩm hoặc không sơn lót kháng kiềm. Khắc phục: B1: Sủi sạch lớp sơn bong tróc. B2: Để tường khô hoàn toàn. B3: Sơn lót kháng kiềm cao cấp. B4: Sơn phủ 2 lớp màu.',
                    keywords: ['bong tróc', 'phồng rộp', 'lột sơn', 'sơn lót', 'kháng kiềm', 'sủi sơn']
                },
                {
                    title: 'Chọn sơn bóng, bán bóng hay sơn mịn?',
                    content: 'Sơn bóng dễ lau chùi, phản sáng tốt, phù hợp phòng khách, bếp nhưng dễ lộ khuyết điểm tường trát méo. Sơn mịn giá rẻ, che khuyết điểm tốt nhưng khó lau chùi, hợp cho trần nhà hoặc phòng ngủ ít va chạm.',
                    keywords: ['sơn bóng', 'sơn mịn', 'lau chùi', 'phòng khách', 'phòng ngủ', 'trần nhà']
                },
                {
                    title: 'Tại sao cần phải sơn lót kháng kiềm?',
                    content: 'Xi măng có tính kiềm rất cao. Nếu không sơn lót, chất kiềm sẽ phá hủy màng sơn phủ gây phai màu, ố vàng, loang lổ. Sơn lót kháng kiềm hoạt động như lớp màng bảo vệ cô lập chất kiềm này.',
                    keywords: ['kháng kiềm', 'loang màu', 'ố vàng', 'sơn lót', 'xi măng kiềm']
                },
                {
                    title: 'Quy trình bả matit 2 lớp mượt đẹp',
                    content: 'Lớp 1 bả lên tường phẳng ẩm nhẹ, chờ khô 2h rồi chà nhám sơ. Lớp 2 bả mỏng hơn để sửa các khuyết điểm lõm góc. Chờ khô 24h, dùng máy chà nhám chà thật phẳng, quét sạch bụi trước khi bắt đầu sơn lót.',
                    keywords: ['bả matit', 'bột trét tường', 'chà nhám', 'bột bả', 'mượt tường']
                },
                {
                    title: 'Độ ẩm tường bao nhiêu thì có thể sơn được?',
                    content: 'Tiêu chuẩn sơn tường là độ ẩm phải dưới 16% (đo bằng máy đo ẩm Protimeter) hoặc tường xây xong ít nhất 21-28 ngày trong điều kiện thời tiết khô ráo khô ấm liên tục.',
                    keywords: ['độ ẩm tường', 'bao lâu thì sơn', 'máy đo ẩm', 'tường khô', 'sơn nhà mới']
                },

                // 16-20: Iron & Steel
                {
                    title: 'Bảo quản sắt thép xây dựng không bị rỉ sét',
                    content: 'Sắt thép nhập về công trình phải kê cao cách mặt đất tối thiểu 15-20cm, xếp nghiêng nhẹ để nước mưa chảy thoát thoát nhanh. Nếu để lâu ngày ngoài trời, bắt buộc phải che bạt nilon dày để tránh sương muối và nước mưa trực tiếp.',
                    keywords: ['bảo quản sắt', 'thép rỉ sét', 'kê sắt', 'che bạt', 'rỉ sắt']
                },
                {
                    title: 'Cách làm sạch rỉ sét sắt thép trước khi đổ bê tông',
                    content: 'Nếu sắt bị rỉ vàng nhẹ thì bê tông vẫn bám dính tốt. Nếu rỉ vảy đen/đỏ dày thì phải dùng bàn chải sắt đánh sạch, hoặc phun chất tẩy rỉ sét chuyên dụng (VD: B700 hoặc Rust Converter) trước khi thi công cốt thép dầm sàn.',
                    keywords: ['tẩy rỉ sét', 'đánh rỉ', 'b700', 'rust converter', 'bê tông bám dính']
                },
                {
                    title: 'So sánh mác thép xây dựng CB300 và CB400',
                    content: 'CB300 có giới hạn chảy tối thiểu 300 MPa, thích hợp xây nhà phố thấp tầng, công trình dân dụng nhỏ. CB400 chịu lực kéo cao hơn (400 MPa), khuyên dùng cho nhà cao tầng, móng băng dầm lớn chịu tải trọng cực cao.',
                    keywords: ['cb300', 'cb400', 'mác thép', 'thép chịu lực', 'dầm móng']
                },
                {
                    title: 'Thép phi 10 là gì, nặng bao nhiêu kg/cây?',
                    content: 'Thép phi 10 (D10) là thép có đường kính 10mm. Theo tiêu chuẩn bar thép xây dựng Việt Nam, một cây thép phi 10 dài chuẩn 11.7m có khối lượng tịnh khoảng 7.21 kg (tương đương 0.617 kg/mét).',
                    keywords: ['phi 10', 'd10', 'nặng bao nhiêu', 'khối lượng', '1 cây thép', '11.7m']
                },
                {
                    title: 'Tại sao thép cuộn phi 6, phi 8 hay bị cân thiếu?',
                    content: 'Thép cuộn thường được mua theo cân ký (kg). Hãy kiểm tra barem nhà sản xuất và đối chiếu khối lượng cân thực tế. Một số cửa hàng gian lận bằng cách trộn thép non tuổi hoặc thép không rõ xuất xứ có đường kính nhỏ hơn chuẩn.',
                    keywords: ['cân thiếu', 'thép cuộn', 'phi 6', 'phi 8', 'gian lận', 'cân ký']
                },

                // 21-25: Flooring & Tiles
                {
                    title: 'Cách tính số lượng gạch lát nền và hao hụt',
                    content: 'Diện tích mua gạch = (Dài x Rộng nền sàn) + 5% hao hụt do cắt xén góc. Ví dụ nền 40m2 cần mua 42m2 gạch. Quy đổi gạch 60x60 (1 hộp = 4 viên = 1.44m2) thì bạn cần đặt mua 42 / 1.44 = 29 hoặc 30 hộp gạch.',
                    keywords: ['tính gạch', 'gạch lát nền', 'hộp gạch', 'hao hụt', '60x60', '80x80']
                },
                {
                    title: 'Keo dán gạch và hồ dầu cát: Loại nào tốt hơn?',
                    content: 'Hồ dầu dễ co ngót gây ộp và bong tróc gạch kích thước lớn (trên 60x60). Keo dán gạch chuyên dụng có độ bám dính cực cao, không co ngót, chống trượt tốt, bắt buộc phải dùng cho gạch Porcelain, Granite bóng kiếng.',
                    keywords: ['keo dán gạch', 'hồ dầu', 'ộp gạch', 'porcelain', 'granite', 'bong gạch']
                },
                {
                    title: 'Khoảng cách đường ron gạch men lát nền chuẩn',
                    content: 'Không nên lát gạch khít khao vì gạch sẽ co giãn nhiệt gây phồng nứt. Khoảng cách ron chuẩn: 1.5mm - 2mm đối với gạch lát phẳng. Sử dụng ke cân bằng nhựa chữ thập để có đường ron thẳng tắp mượt đẹp.',
                    keywords: ['đường ron', 'ron gạch', 'ke cân bằng', 'phồng gạch', 'giãn nở', 'chữ thập']
                },
                {
                    title: 'Cách xử lý gạch men lát nền bị trầy xước nhẹ',
                    content: 'Với vết xước mờ nhỏ: Lau sạch nền gạch, bôi kem đánh răng hoặc sáp nến đánh bóng mạnh tay bằng khăn mềm. Với vết xước dầy sâu ở gạch bóng kiếng thì phải dùng máy đánh bóng chuyên dụng hoặc thay viên gạch mới.',
                    keywords: ['gạch trầy', 'xước gạch', 'bóng kiếng', 'đánh bóng gạch', 'sáp nến']
                },
                {
                    title: 'Tại sao gạch ốp tường nhà tắm bị rơi rụng sau vài tháng?',
                    content: 'Do thợ thi công dùng hồ dầu thông thường quét lên mặt sau gạch Porcelain ít hút nước. Giải pháp triệt để: Dùng keo dán gạch quét hai mặt (cả mặt nền tường và mặt sau viên gạch) rồi gõ đều búa cao su.',
                    keywords: ['rụng gạch', 'gạch ốp tường', 'búa cao su', 'rơi gạch', 'nhà tắm', 'porcelain']
                },

                // 26-30: Bricks & Wall Building
                {
                    title: 'Khi nào xây tường 10, khi nào xây tường 20?',
                    content: 'Tường 10cm nhẹ, tiết kiệm diện tích, hợp cho tường ngăn chia phòng ngủ trong nhà. Tường 20cm chịu lực tốt, cách âm cách nhiệt tốt, chống thấm chịu nước tốt hơn, bắt buộc phải dùng cho tường bao quanh ngoài trời và tường mặt tiền.',
                    keywords: ['tường 10', 'tường 20', 'xây tường', 'cách âm', 'cách nhiệt', 'chịu lực']
                },
                {
                    title: 'Ưu nhược điểm gạch block không nung và gạch đỏ đất nung',
                    content: 'Gạch đỏ tuynel cách âm cách nhiệt tốt, dễ thi công khoan treo đồ đạc chắc nịch nhưng đắt hơn. Gạch block không nung kích thước to, xây nhanh, rẻ, thân thiện môi trường nhưng chịu lực va đập kém hơn và dễ nứt nẻ dọc thớ vữa.',
                    keywords: ['gạch block', 'gạch tuynel', 'gạch đỏ', 'không nung', 'gạch đất nung']
                },
                {
                    title: 'Nguyên nhân nứt tường chữ V tại các mép cửa',
                    content: 'Nứt chéo chữ V ở góc cửa thường do lanh tô cửa đổ quá ngắn hoặc chịu lực đè nén từ trên đè xuống mà không đúc dầm lanh tô bê tông gia cố. Khắc phục: Đục rộng vết nứt, lắp lưới thép chống nứt mắt cáo rồi trát lại vữa mác cao.',
                    keywords: ['nứt góc cửa', 'nứt chữ v', 'lanh tô', 'nứt tường', 'lưới mắt cáo']
                },
                {
                    title: 'Tại sao tường xây xong bị nghiêng, không thẳng hàng?',
                    content: 'Do thợ lười giăng dây nhợ căng mốc thẳng hoặc không thả quả dọi kiểm tra độ đứng khi xây từng hàng. Khắc phục: Phải đập đi xây lại ngay khi vữa còn chưa đông cứng hoàn toàn.',
                    keywords: ['tường nghiêng', 'xây lệch', 'quả dọi', 'dây nhợ', 'vữa xây']
                },
                {
                    title: 'Sử dụng gạch đờ-mi, gạch thẻ đập vỡ góc khi xây tường',
                    content: 'Ở các góc tường hoặc chân móng, bắt buộc phải chèn gạch đờ-mi (gạch nửa viên) để so le thớ mạch vữa theo quy tắc mạch dọc không trùng nhau quá 3 hàng gạch liên tiếp, tăng tối đa liên kết khối tường.',
                    keywords: ['gạch đờ mi', 'mạch vữa', 'trùng mạch', 'góc tường', 'xây gạch']
                },

                // 31-35: Roofing & Thermal
                {
                    title: 'Phân biệt tôn lạnh (mạ nhôm kẽm) và tôn thường',
                    content: 'Tôn lạnh được mạ hợp kim Nhôm Kẽm chống ăn mòn cực tốt, phản xạ nhiệt tốt giúp mát nhà. Tôn thường chỉ mạ kẽm thông thường, dễ bị rỉ sét mục nát trong thời tiết ẩm ướt biển và giữ nhiệt nóng hầm hập lâu hơn.',
                    keywords: ['tôn lạnh', 'tôn kẽm', 'mái tôn', 'nhôm kẽm', 'chống rỉ']
                },
                {
                    title: 'Cách chống nóng hiệu quả cao cho mái tôn nhà phố',
                    content: 'Khuyên dùng tôn cách nhiệt 3 lớp tôn-PU-giấy bạc (Tôn mát). Hoặc bắn bổ sung lớp túi khí cát tường cách nhiệt dưới xà gồ. Quét sơn phủ chống nóng mái tôn cũng giúp giảm 3-5 độ C bề mặt tôn.',
                    keywords: ['chống nóng', 'tôn mát', 'tấm cách nhiệt', 'túi khí', 'sơn chống nóng', 'mái tôn']
                },
                {
                    title: 'Xử lý thấm dột nước ở mũ đinh vít mái tôn',
                    content: 'Lâu ngày đệm cao su đinh vít bị lão hóa nứt vỡ rỉ nước dột. Khắc phục: Quét sạch bụi rỉ sét quanh vít dột, bắn keo silicone ngoài trời chuyên dụng chịu nhiệt bao trùm kín đầu vít cũ, hoặc thay đinh vít mũ mới có gioăng cao su.',
                    keywords: ['dột mái tôn', 'đinh vít', 'silicone', 'gioăng cao su', 'dột đinh', 'thấm tôn']
                },
                {
                    title: 'Chọn máng xối tôn hoa sen chịu lực thoát nước mượt',
                    content: 'Nên chọn máng xối kẽm dày tối thiểu 0.45mm trở lên của tôn Hoa Sen hoặc tôn Đông Á để chịu được lưu lượng nước mưa xối xả và không bị trũng võng nứt gãy máng.',
                    keywords: ['máng xối', 'hoa sen', 'đông á', 'thoát nước', 'dày 0.45mm']
                },
                {
                    title: 'Độ dốc mái tôn tiêu chuẩn cho thoát nước mưa nhanh',
                    content: 'Mái lợp tôn cần độ dốc tối thiểu 10% (độ dốc chênh lệch 10cm trên 1 mét dài) để thoát nước mưa xối xả nhanh chóng, ngăn ngừa dột do tràn nước ngược ở múi nối sóng tôn.',
                    keywords: ['độ dốc mái', 'mái tôn', 'thoát nước nhanh', 'độ dốc 10%', 'tràn sóng tôn']
                },

                // 36-40: Electrical & Plumbing
                {
                    title: 'Nên dùng ống nước nóng lạnh PPR hay PVC?',
                    content: 'Ống PVC chỉ chịu được nước lạnh thông thường, dễ vỡ giòn nứt. Ống PPR chịu nhiệt tốt (lên tới 95 độ C), dẻo dai, hàn nhiệt đúc nguyên khối chống rò rỉ rạn nứt vĩnh viễn, bắt buộc dùng cho luồng nước nóng bình năng lượng mặt trời.',
                    keywords: ['ống ppr', 'ống pvc', 'hàn nhiệt', 'rò rỉ ống', 'ống nước nóng']
                },
                {
                    title: 'Tại sao góc tường nơi đặt hộp kỹ thuật hay bị ẩm mốc?',
                    content: 'Do rò rỉ khớp nối ren ống thoát nước bên trong trục kỹ thuật hoặc thấm sàn chân hộp gen. Khắc phục: Dùng camera nội soi tìm điểm vỡ ống nước, thay ống dán keo PVC chuẩn, sau đó trát bịt sika chống thấm xung quanh.',
                    keywords: ['hộp kỹ thuật', 'ẩm mốc', 'hộp gen', 'rò ống nước', 'thấm chân tường']
                },
                {
                    title: 'Cách lựa chọn dây điện Cadivi chính hãng chịu tải ổn',
                    content: 'Tránh mua dây giả nhái mỏng lõi đồng ít sợi. Dây Cadivi thật có chữ in rõ sắc nét trên vỏ nhựa dẻo khó đứt, lõi đồng đỏ sáng rực mềm dẻo. Nên chọn dây 2.5mm cho ổ cắm thông thường, dây 4.0mm - 6.0mm cho bếp từ và điều hòa trục chính.',
                    keywords: ['dây điện', 'cadivi', 'chịu tải', 'bếp từ', 'lõi đồng', 'dây 2.5', 'dây 4.0']
                },
                {
                    title: 'Lắp thiết bị chống giật (ELCB) cho bình nóng lạnh an toàn',
                    content: 'Bắt buộc phải lắp Aptomat chống giật ELCB nhạy bén và nối đất vỏ máy tiếp địa cho bình nóng lạnh nhà tắm để bảo vệ an toàn tính mạng gia đình khỏi rò điện giật nguy hại.',
                    keywords: ['chống giật', 'elcb', 'bình nóng lạnh', 'rò điện', 'tiếp địa', 'nối đất']
                },
                {
                    title: 'Hiện tượng búa nước trong đường ống nước sinh hoạt',
                    content: 'Hiện tượng ống kêu kèn kẹt rầm rầm khi ngắt đột ngột vòi nước. Cách khắc phục: Bắt chặt cố định đai kẹp sắt định vị đường ống vào tường bê tông hoặc lắp thêm van giảm áp/bình giãn nở giảm lực xung kích búa nước.',
                    keywords: ['búa nước', 'ống nước kêu', 'van giảm áp', 'đai kẹp', 'rung ống nước']
                },

                // 41-45: Doors & Windows
                {
                    title: 'Cách chỉnh cửa nhôm Xingfa bị xệ cánh cọ nền',
                    content: 'Cửa xệ do bản lề 3D bị nới lỏng hoặc xệ góc kính cường lực. Khắc phục: Dùng lục giác 4mm cạy nắp nhựa bản lề 3D, vặn ốc lục giác ngược chiều kim đồng hồ để kéo nâng cánh cửa lên cao thoát cọ nền.',
                    keywords: ['chỉnh cửa xệ', 'xingfa', 'bản lề 3d', 'lục giác', 'cọ nền', 'cửa nhôm']
                },
                {
                    title: 'Lựa chọn keo Silicone axit hay keo trung tính?',
                    content: 'Keo axit (VD: Apollo A300) khô cực nhanh, bám dính siêu tốt, hợp dán kính nhưng gây ăn mòn rỉ sắt, nhôm, đá hoa cương. Keo trung tính (VD: Apollo A500) không ăn mòn nhôm kính gỗ, thích hợp trám khe hở ngoài trời bền bỉ.',
                    keywords: ['keo silicone', 'apollo a300', 'apollo a500', 'keo axit', 'trung tính', 'ăn mòn nhôm']
                },
                {
                    title: 'Kính cường lực bị vỡ tự nhiên không rõ nguyên nhân',
                    content: 'Có thể do lẫn tạp chất Niken Sunfua (NiS) giãn nở đột ngột gây vỡ phá tự phát, hoặc nẹp kính quá khít chặt không có khe co giãn khi trời nóng bức. Khuyên dùng film an toàn dán kính chống văng mảnh vỡ bảo vệ.',
                    keywords: ['kính vỡ', 'cường lực', 'vỡ tự phát', 'khe co giãn', 'film an toàn', 'niken sunfua']
                },
                {
                    title: 'Tại sao cửa gỗ tự nhiên bị kẹt cứng vào mùa mưa?',
                    content: 'Gỗ tự nhiên hút ẩm cao mùa mưa ẩm gây trương nở gỗ cọ khít khuôn cửa. Khắc phục tạm thời: Dùng máy bào bào bớt viền gỗ kẹt nhẹ. Về lâu dài cần quét phủ sơn PU bóng chống thấm ẩm kín lõi gỗ.',
                    keywords: ['cửa gỗ kẹt', 'trương nở', 'sơn pu', 'hút ẩm', 'mùa mưa', 'máy bào']
                },
                {
                    title: 'Khóa cửa tay gạt bị kẹt rít khóa khó vặn',
                    content: 'Do khô dầu mỡ hoặc rỉ sét lò xo ổ khóa bên trong. Tránh xịt dầu nhớt xe máy cũ đóng cặn bụi đen. Nên dùng bình xịt chống rỉ RP7 hoặc bôi bột bút chì than mịn vào ổ chìa khóa để trơn tru mượt mà.',
                    keywords: ['khóa cửa kẹt', 'rp7', 'tay gạt', 'bột bút chì', 'rỉ sét ổ khóa']
                },

                // 46-50: Site Management & Safety
                {
                    title: 'Bảo quản cát đá xây dựng sạch không lẫn tạp chất',
                    content: 'Cát đá đổ bê tông cần được che chắn nilon quanh bãi tập kết để ngăn chó mèo thải phân bẩn, lá cây mục rữa hoặc bụi đất bẩn trộn lẫn làm giảm cường độ bám dính của vữa bê tông sụt giảm nghiêm trọng.',
                    keywords: ['bảo quản cát', 'đá bẩn', 'tạp chất', 'rác thải', 'bãi đá', 'cường độ bê tông']
                },
                {
                    title: 'Vệ sinh hút bụi kỹ lưỡng trước khi bả và sơn',
                    content: 'Tường trát xong chứa nhiều bụi cát li ti. Bắt buộc thợ sơn phải dùng chổi cỏ quét sạch bụi hoặc dùng máy hút bụi thổi bay cát bẩn trước khi lăn sơn để tránh sơn bị cộm hạt sạn hoặc rộp rụng màng sơn.',
                    keywords: ['vệ sinh tường', 'quét bụi', 'cộm cát', 'thổi bụi', 'lăn sơn sạch']
                },
                {
                    title: 'Quy tắc lắp đặt giàn giáo thi công cao tầng an toàn',
                    content: 'Chân giáo bắt buộc đặt trên tấm gỗ kê bằng vững chãi chịu lực tốt. Lắp đầy đủ thanh giằng chéo giáo, chốt khóa an toàn chắc chắn. Bắt buộc lắp lưới chống rơi xung quanh giàn giáo thi công sát nhà dân cận kề.',
                    keywords: ['giàn giáo', 'an toàn lao động', 'thanh giằng', 'chân giáo', 'lưới chống rơi']
                },
                {
                    title: 'Kiểm tra độ thẳng của tường gạch bằng dây quả dọi',
                    content: 'Trong quá trình xây tường hàng cao, thợ cả cần liên tục thả quả dọi từ trên xà xống để đối chiếu độ đứng của các thớ gạch. Nếu sai lệch quá 5mm trên 3 mét đứng phải gõ chỉnh cân ngay lập tức tránh đổ sập.',
                    keywords: ['quả dọi', 'độ đứng tường', 'kiểm tra tường', 'thợ cả', 'xây thẳng']
                },
                {
                    title: 'Trám bịt các lỗ giáo tường xây ngoài trời chống thấm dột',
                    content: 'Khi tháo dỡ giàn giáo, tại các vị trí đầu gỗ cắm giáo đâm xéo tường cũ, phải đục rộng gạch trầy vữa, trát đầy chặt bằng vữa trộn phụ gia kết nối chống thấm Sika Latex để ngăn thấm nước mưa ngấm sâu vào trong nhà.',
                    keywords: ['lỗ giáo', 'giàn giáo', 'tháo giáo', 'thấm lỗ giáo', 'sika latex', 'trám lỗ']
                }
            ];

            const found = mockKnowledgeDB.find(k => k.keywords.some(kw => query.toLowerCase().includes(kw)));
            
            if (found) {
                return { found: true, data: found };
            }
            return { found: false, message: 'Không tìm thấy tài liệu kỹ thuật phù hợp trong cơ sở dữ liệu. Hãy khuyên khách hàng liên hệ chuyên gia.' };
        }
    },

    escalateToHuman: {
        description: 'Sử dụng công cụ này NGAY LẬP TỨC nếu khách hàng tỏ ra tức giận, chửi bới, muốn gặp nhân viên thật, HOẶC đang bàn về một đơn hàng số lượng rất lớn (trên 50 triệu VNĐ). Không cần giải thích nhiều, chỉ cần gọi tool này.',
        parameters: z.object({
            reason: z.string().describe('Lý do tại sao cần chuyển cho nhân viên (VD: "Khách bực tức", "Đơn hàng 100 tấn thép")')
        }),
        execute: async ({ reason }: { reason: string }) => {
            console.log('[AI Handoff Triggered] Reason:', reason);
            return { escalated: true, reason };
        }
    },

    getMarketTrends: {
        description: 'Kiểm tra biến động giá cả và dự báo thị trường (Market Trends) của các loại vật liệu xây dựng để tư vấn khách hàng mua sớm (tạo hiệu ứng FOMO). Gọi công cụ này khi khách hỏi về tình hình giá cả chung hoặc phân vân chưa mua.',
        parameters: z.object({
            materialType: z.string().describe('Loại vật liệu (VD: "thép", "xi măng", "cát", "gạch")')
        }),
        execute: async ({ materialType }: { materialType: string }) => {
            // Sử dụng Gemini để phân tích biến động giá thực tế nhưng gài hướng sale có lợi
            const currentMonth = new Date().getMonth() + 1;
            // Miền Nam VN: mùa mưa từ tháng 5 đến tháng 10
            const isRainySeason = currentMonth >= 5 && currentMonth <= 10;
            const seasonLabel = isRainySeason ? 'Mùa mưa' : 'Mùa khô';

            const candidates = [
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash',
                'gemini-2-flash',
                'gemini-1.5-flash'
            ];

            const { generateObject } = await import('ai');
            const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
            const { AI_CONFIG } = await import('../ai-config');

            const google = createGoogleGenerativeAI({ apiKey: AI_CONFIG.GEMINI.API_KEY });

            const schema = (await import('zod')).z.object({
                trend: (await import('zod')).z.enum(['UP', 'DOWN', 'STABLE']).describe('Xu hướng giá trong thời gian ngắn tới'),
                percentage: (await import('zod')).z.number().describe('Phần trăm biến động ước tính (VD: 3.5, 0, 5)'),
                reason: (await import('zod')).z.string().describe('Lý do biến động thị trường, ngắn gọn, thuyết phục'),
                recommendation: (await import('zod')).z.string().describe('Lời khuyên thúc giục khách chốt đơn ngay, phù hợp mùa vụ')
            });

            for (const modelName of candidates) {
                try {
                    const { object } = await generateObject({
                        model: google(modelName),
                        maxRetries: 0,
                        system: `Bạn là chuyên gia phân tích thị trường vật liệu xây dựng Việt Nam.
Nhiệm vụ: đưa ra dự báo xu hướng giá cả cho loại vật tư được yêu cầu.
QUY TẮC BẮT BUỘC:
1. Phân tích dựa trên thời điểm HIỆN TẠI là tháng ${currentMonth}/${new Date().getFullYear()} (${seasonLabel} tại miền Nam VN).
2. Tư vấn phải PHÙ HỢP THỰC TẾ với mùa vụ:
   - Mùa mưa (T5-T10): KHÔNG khuyên nhập hàng ồ ạt xi măng/cát vì dễ ẩm hỏng. Gợi ý mua gom sỉ giữ giá, shop giao hàng chia đợt nhỏ khi trời ráo.
   - Mùa khô (T11-T4): Mùa xây dựng cao điểm, có thể khuyên nhập thoải mái số lượng lớn.
3. KHÉO LÉO tạo hiệu ứng FOMO thúc đẩy chốt đơn, nhưng thông tin phải hợp lý và không mâu thuẫn với mùa vụ.
4. Trả về JSON chính xác theo schema.`,
                        prompt: `Phân tích dự báo thị trường cho vật liệu: "${materialType}" trong bối cảnh tháng ${currentMonth} (${seasonLabel}).`,
                        schema
                    });

                    console.log(`[getMarketTrends] Model "${modelName}" succeeded.`);
                    return { data: object, season: seasonLabel, month: currentMonth };
                } catch (err: any) {
                    console.warn(`[getMarketTrends] Model "${modelName}" failed:`, err?.message || err);
                }
            }

            console.error('[getMarketTrends] All models exhausted, using contextual fallback.');
            // Fallback phù hợp theo mùa
            const rainyFallback = isRainySeason
                ? 'Mùa mưa nên tránh nhập ồ ạt để bảo quản hàng. Hãy chốt hợp đồng sỉ để giữ giá, cửa hàng hỗ trợ giao hàng nhiều đợt nhỏ khi trời ráo.'
                : 'Mùa xây dựng cao điểm, nhu cầu cao, nên nhập sớm số lượng lớn để đảm bảo tiến độ và hưởng giá tốt.';
            const mockTrends: Record<string, any> = {
                'thép': { trend: 'UP', percentage: 3.5, reason: 'quặng sắt thế giới tăng giá, nhu cầu xuất khẩu cao', recommendation: rainyFallback },
                'xi măng': { trend: 'STABLE', percentage: 0, reason: 'chính sách bình ổn giá trong nước', recommendation: rainyFallback },
                'cát': { trend: 'UP', percentage: 4.0, reason: 'nguồn cung bị siết chặt do quản lý khai thác', recommendation: rainyFallback },
                'gạch': { trend: 'DOWN', percentage: 1.5, reason: 'nhà máy tung khuyến mãi xả kho cuối vụ', recommendation: rainyFallback },
                'sơn': { trend: 'STABLE', percentage: 1.0, reason: 'giá nguyên liệu đầu vào ổn định', recommendation: rainyFallback },
            };
            const key = Object.keys(mockTrends).find(k => materialType.toLowerCase().includes(k)) || 'thép';
            return { data: mockTrends[key], season: seasonLabel, month: currentMonth, fallback: true };
        }
    },

    addToCart: {
        description: 'Sử dụng công cụ này KHI VÀ CHỈ KHI khách hàng yêu cầu cụ thể "Thêm vào giỏ", "Mua món này", "Lấy cho anh..." với số lượng rõ ràng. Trả về kết quả để hệ thống giao diện tự động thao tác.',
        parameters: z.object({
            items: z.array(z.object({
                productId: z.string().describe('ID sản phẩm tìm được qua searchProducts'),
                quantity: z.number().describe('Số lượng muốn thêm'),
                name: z.string().describe('Tên sản phẩm')
            }))
        }),
        execute: async ({ items }: { items: any[] }) => {
            return { success: true, addedItems: items, message: `Đã tự động chuẩn bị thêm ${items.length} mặt hàng vào giỏ.` };
        }
    }
};
