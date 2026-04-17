/**
 * Material Calculator — pure calculation logic
 * No AI calls, no database access — just TCVN material norm math.
 */

import {
    MaterialEstimate,
    RoomDimension,
    CONSTRUCTION_STANDARDS,
    ConstructionStandard,
} from './estimator-types'

/** Calculate material quantities for a given area and project type (synchronous, pure) */
export function calculateMaterials(
    area: number,
    type: string,
    rooms: RoomDimension[],
    style: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự',
    wallPerimeter: number,
    roofType: string
): MaterialEstimate[] {
    const materials: MaterialEstimate[] = []
    const std = (CONSTRUCTION_STANDARDS as Record<string, ConstructionStandard | object>)[style] as ConstructionStandard
        || CONSTRUCTION_STANDARDS.nhà_cấp_4

    // wallPerimeter and rooms kept for future use / caller compatibility
    void wallPerimeter
    void rooms

    if (type === 'general') {
        // ── Bricks ─────────────────────────────────────────────────────────────
        const totalBricks = Math.ceil(area * std.bricks)
        materials.push({
            productName: 'Gạch ống 8×8×18cm (Xây tường)',
            quantity: Math.ceil(totalBricks * 0.8),
            unit: 'viên',
            reason: `Dự toán xây tường gạch ống (~80% tổng gạch cho ${style})`
        })
        materials.push({
            productName: 'Gạch đinh 4×8×18cm (Gia cố chân tường/bể)',
            quantity: Math.ceil(totalBricks * 0.2),
            unit: 'viên',
            reason: `Gạch đinh dùng cho chân tường, móng, bể tự hoại (~20%)`
        })

        // ── Cement ─────────────────────────────────────────────────────────────
        const totalCementKg = area * std.cement
        materials.push({
            productName: 'Xi măng bê tông (Portland)',
            quantity: Math.ceil((totalCementKg * 0.4) / 50),
            unit: 'bao',
            reason: `Hạng mục đổ bê tông móng, cột, dầm, sàn (40%)`
        })
        materials.push({
            productName: 'Xi măng xây tô (Loại 1)',
            quantity: Math.ceil((totalCementKg * 0.6) / 50),
            unit: 'bao',
            reason: `Vữa xây trát và hoàn thiện (60%)`
        })

        // ── Steel ──────────────────────────────────────────────────────────────
        const totalSteelTons = (area * std.steel) / 1000
        materials.push({
            productName: 'Thép cuộn Phi 6-8 (Làm đai/Sàn)',
            quantity: Number((totalSteelTons * 0.35).toFixed(2)),
            unit: 'tấn',
            reason: `Thép cuộn dùng làm đai kết cấu và thép sàn`
        })
        materials.push({
            productName: 'Thép thanh vằn Phi 10-25 (Cột/Dầm)',
            quantity: Number((totalSteelTons * 0.65).toFixed(2)),
            unit: 'tấn',
            reason: `Thép cây chịu lực chính cho khung nhà`
        })

        // ── Sand ───────────────────────────────────────────────────────────────
        const totalSandM3 = area * std.sand_build
        materials.push({
            productName: 'Cát bê tông (Cát vàng hạt lớn)',
            quantity: Number((totalSandM3 * 0.4).toFixed(1)),
            unit: 'm³',
            reason: `Cát sạch dùng để trộn bê tông`
        })
        materials.push({
            productName: 'Cát tô sạch (Mịn)',
            quantity: Number((totalSandM3 * 0.6).toFixed(1)),
            unit: 'm³',
            reason: `Cát mịn dùng cho công tác trát tường`
        })
        materials.push({
            productName: 'Cát san lấp (Nền móng)',
            quantity: Number((area * std.sand_fill).toFixed(1)),
            unit: 'm³',
            reason: `Dùng cho tôn nền và đệm móng chống lún`
        })

        // ── Stone ──────────────────────────────────────────────────────────────
        materials.push({
            productName: 'Đá 1×2 (Bê tông)',
            quantity: Number((area * std.stone_1x2).toFixed(1)),
            unit: 'm³',
            reason: `Cốt liệu đá cho bê tông các hạng mục chịu lực`
        })
        materials.push({
            productName: 'Đá 4×6 (Bê tông lót)',
            quantity: Number((area * std.stone_4x6).toFixed(1)),
            unit: 'm³',
            reason: `Lớp bê tông lót móng và chống úng`
        })

        // ── Essential hardware ─────────────────────────────────────────────────
        materials.push({
            productName: 'Kẽm buộc (1ly)',
            quantity: Math.ceil(area * 0.08),
            unit: 'kg',
            reason: `Phụ kiện buộc cố định thép sàn và cột`
        })
        materials.push({
            productName: 'Đinh thép (tổng hợp)',
            quantity: Math.ceil(area * 0.04),
            unit: 'kg',
            reason: `Dùng đóng cốp pha và giàn giáo gỗ`
        })
        materials.push({
            productName: 'Que hàn điện (Hồ quang)',
            quantity: Math.ceil(area * 0.02),
            unit: 'kg',
            reason: `Hàn các mối liên kết sắt hộp và thép kết cấu`
        })

        // Steel box for railings (townhouse and villa only)
        if (style !== 'nhà_cấp_4') {
            materials.push({
                productName: 'Sắt hộp kẽm (Lan can/Khung)',
                quantity: Math.ceil(area * 1.5),
                unit: 'kg',
                reason: `Ước tính cho lan can cầu thang, ban công và khung bảo vệ`
            })
        }

        // ── Finishing materials ────────────────────────────────────────────────
        materials.push({
            productName: 'Bột trét tường nội/ngoại thất',
            quantity: Math.ceil((area * 3.0) / 1.2 / 40),
            unit: 'bao',
            reason: `Lớp bả phẳng bề mặt trước khi sơn`
        })
        materials.push({
            productName: 'Sơn lót kháng kiềm (Primer)',
            quantity: Math.ceil((area * 3.0) / 10),
            unit: 'lít',
            reason: `Sơn bảo vệ bề mặt tường chống ẩm mốc`
        })
        materials.push({
            productName: 'Sơn phủ hoàn thiện (Nội/Ngoại thất)',
            quantity: Math.ceil((area * 3.0 * 2) / 8), // 2 layers, ~8m2/l
            unit: 'lít',
            reason: `Sơn màu 2 lớp cho toàn bộ diện tích tường`
        })
        materials.push({
            productName: 'Ống nhựa điện PVC (D20/D25)',
            quantity: Math.ceil(area * std.electric_pipes),
            unit: 'm',
            reason: `Hệ thống ống luồn dây điện âm lót sàn và tường`
        })
        materials.push({
            productName: 'Ống nước PVC/PPR (Cấp thoát)',
            quantity: Math.ceil(area * std.water_pipes),
            unit: 'm',
            reason: `Hệ thống cấp thoát nước sinh hoạt cơ bản`
        })
        materials.push({
            productName: 'Gạch lát nền (Ước tính)',
            quantity: Math.ceil(area * 1.1), // 10% wastage
            unit: 'm²',
            reason: `Diện tích gạch lát sàn cho các phòng`
        })
        materials.push({
            productName: 'Lưới mắt cáo (Chống nứt)',
            quantity: Math.ceil(area * 0.6),
            unit: 'm',
            reason: `Gia cố các góc tường và vị trí tiếp giáp đà - tường`
        })
        materials.push({
            productName: 'Phụ gia chống thấm (Sika/Waterproofing)',
            quantity: Math.ceil(area * 0.1),
            unit: 'kg',
            reason: `Dùng cho khu vực ban công, sân thượng và toilet`
        })

        // ── Roofing system ─────────────────────────────────────────────────────
        if (roofType === 'mái_thái') {
            materials.push({
                productName: 'Ngói lợp (Mái thái)',
                quantity: Math.ceil(area * 10),
                unit: 'viên',
                reason: `Ước tính số lượng ngói dựa trên diện tích sàn (10 viên/m2)`
            })
            materials.push({
                productName: 'Sắt hộp mạ kẽm (Xà gồ mái)',
                quantity: Math.ceil(area * 4.5),
                unit: 'kg',
                reason: `Hệ khung kèo, xà gồ thép cho mái lợp ngói`
            })
            materials.push({
                productName: 'Vít bắn ngói/tôn',
                quantity: 1,
                unit: 'hộp',
                reason: `Vít chuyên dụng lắp đặt hệ mái`
            })
        } else if (roofType === 'mái_tôn') {
            materials.push({
                productName: 'Tôn lạnh màu (Mái tôn)',
                quantity: Math.ceil(area * 1.2),
                unit: 'm',
                reason: `Tôn lợp mái và máng xối`
            })
            materials.push({
                productName: 'Sắt hộp mạ kẽm (Xà gồ mái)',
                quantity: Math.ceil(area * 3.5),
                unit: 'kg',
                reason: `Hệ xà gồ thép chịu lực cho mái tôn`
            })
            materials.push({
                productName: 'Vít bắn tôn (Ron cao su)',
                quantity: 1,
                unit: 'hộp',
                reason: `Vít bắn tôn chống dột`
            })
        }

    } else if (type === 'flooring') {
        const floorStd = CONSTRUCTION_STANDARDS.flooring
        materials.push({
            productName: 'Gạch lát nền 60×60cm',
            quantity: Math.ceil((area / 0.36) * floorStd.tile_wastage),
            unit: 'viên',
            reason: `Diện tích ${area.toFixed(1)} m² + 8% hao hụt thi công`
        })
        materials.push({
            productName: 'Cát vàng (Cán nền)',
            quantity: Number((area * floorStd.sand_leveling_m3_m2).toFixed(1)),
            unit: 'm³',
            reason: `Lớp cát đệm cán nền dày ~4cm`
        })
        materials.push({
            productName: 'Xi măng dán gạch/leveling',
            quantity: Math.ceil((area * floorStd.cement_leveling_kg_m2) / 50),
            unit: 'bao',
            reason: `Lớp vữa lót / dán gạch (${floorStd.cement_leveling_kg_m2}kg/m²)`
        })
        materials.push({
            productName: 'Keo chà ron',
            quantity: Math.ceil(area * floorStd.grout_kg_m2),
            unit: 'kg',
            reason: `Định mức ~${floorStd.grout_kg_m2} kg/m² cho mạch gạch`
        })

    } else if (type === 'painting') {
        const paintStd = CONSTRUCTION_STANDARDS.painting
        const wallArea = area * 3.0
        materials.push({
            productName: 'Sơn lót chống kiềm',
            quantity: Math.ceil(wallArea / paintStd.primer_m2_per_liter),
            unit: 'lít',
            reason: `Sơn lót 1 lớp cho diện tích tường ~${wallArea.toFixed(0)} m²`
        })
        materials.push({
            productName: 'Sơn phủ màu nội thất',
            quantity: Math.ceil(wallArea / paintStd.topcoat_m2_per_liter),
            unit: 'lít',
            reason: `Sơn phủ 2 lớp cho diện tích tường ~${wallArea.toFixed(0)} m²`
        })
        materials.push({
            productName: 'Bột trét tường (Putty)',
            quantity: Math.ceil(wallArea / paintStd.putty_m2_per_kg),
            unit: 'kg',
            reason: `Lớp bả hoàn thiện bề mặt tường`
        })
    }

    return materials
}

/**
 * Self-verification: checks if AI output is within TCVN industry norms.
 * Returns 'verified', 'outlier', or 'warning' with a Vietnamese message.
 */
export function validateAgainstIndustryStandards(
    area: number,
    materials: MaterialEstimate[]
): { status: 'verified' | 'outlier' | 'warning'; message: string } {
    if (area <= 0) return { status: 'warning', message: 'Diện tích không hợp lệ.' }

    const cement = materials.find(m => m.productName.includes('Xi măng'))
    if (cement) {
        const ratio = cement.quantity / area
        if (ratio < 0.5 || ratio > 3.5) {
            return {
                status: 'outlier',
                message: 'Khối lượng Xi măng bất thường so với diện tích. Vui lòng kiểm tra lại ảnh hoặc đơn vị đo.'
            }
        }
    }

    const steel = materials.find(m => m.productName.includes('Sắt thép'))
    if (steel && steel.quantity > area * 0.15) {
        return {
            status: 'outlier',
            message: 'Khối lượng Sắt thép vượt quá định mức thông thường. Cần chuyên gia kiểm tra.'
        }
    }

    if (area > 1000) {
        return {
            status: 'warning',
            message: 'Công trình diện tích lớn, kết cấu có thể phức tạp hơn ước tính sơ bộ.'
        }
    }

    return {
        status: 'verified',
        message: 'Kết quả bóc tách phù hợp với định mức xây dựng dân dụng (TCVN).'
    }
}
