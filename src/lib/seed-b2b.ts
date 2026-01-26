import { prisma } from './prisma'

/**
 * Script khởi tạo cấu hình B2B: Bảng giá mới và Bậc giá theo ngành hàng thực tế thị trường VN
 */
export async function seedB2BConfiguration() {
    console.log('--- Đang khởi tạo cấu hình B2B (Theo ngành hàng thực tế) ---')

    // 1. Lấy IDs các category quan trọng
    const categories = await prisma.category.findMany({
        where: { name: { in: ['Gạch', 'Xi măng', 'Thép', 'Sơn', 'Cát', 'Đá'] } }
    })

    const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]))

    // 2. Tạo/Cập nhật Bảng giá cho Nhà thầu (CONTRACTOR)
    const contractorPriceList = await prisma.priceList.upsert({
        where: { code: 'CONTRACTOR' },
        create: {
            code: 'CONTRACTOR',
            name: 'Giá ưu đãi Nhà thầu',
            description: 'Bảng giá dành riêng cho đối tác thi công chuyên nghiệp',
            discountPercent: 5, // Giảm 5% mặc định cho mọi thứ
            customerTypes: ['CONTRACTOR'],
            priority: 30,
            isActive: true
        },
        update: { isActive: true }
    })

    // Xóa bậc cũ
    await prisma.priceTier.deleteMany({ where: { priceListId: contractorPriceList.id } })

    // Thêm bậc giá thực tế cho Nhà thầu
    const contractorTiers = [
        // GẠCH (Đơn vị: Viên) - Thường mua theo xe/vạn
        { cat: 'Gạch', min: 10000, discount: 12 }, // 1 vạn (xe nhỏ)
        { cat: 'Gạch', min: 50000, discount: 18 }, // 5 vạn (xe lớn/dự án)

        // XI MĂNG (Đơn vị: Bao 50kg) - Mua theo tấn (20 bao) hoặc xe (200-400 bao)
        { cat: 'Xi măng', min: 100, discount: 10 }, // 5 tấn
        { cat: 'Xi măng', min: 400, discount: 15 }, // 20 tấn (full xe đầu kéo)

        // THÉP (Đơn vị: kg/cây) - Thường tính theo tấn (1000kg)
        { cat: 'Thép', min: 2000, discount: 8 },  // 2 tấn
        { cat: 'Thép', min: 10000, discount: 12 }, // 10 tấn

        // SƠN (Đơn vị: Thùng 18L)
        { cat: 'Sơn', min: 10, discount: 25 }, // Công trình nhỏ
        { cat: 'Sơn', min: 30, discount: 35 }, // Dự án chung cư/biệt thự

        // CÁT/ĐÁ (Đơn vị: m3) - Mua theo xe
        { cat: 'Cát', min: 15, discount: 10 }, // Xe ben lớn
        { cat: 'Đá', min: 15, discount: 10 }
    ]

    await prisma.priceTier.createMany({
        data: contractorTiers.map(t => ({
            priceListId: contractorPriceList.id,
            categoryId: catMap[t.cat],
            minQuantity: t.min,
            discountPercent: t.discount
        }))
    })

    // 3. Tạo bảng giá cho Đại lý (WHOLESALE) - Chiết khấu cực sâu cho số lượng cực lớn
    const wholesalePriceList = await prisma.priceList.upsert({
        where: { code: 'WHOLESALE' },
        create: {
            code: 'WHOLESALE',
            name: 'Giá sỉ Đại lý (Cấp 1/Cấp 2)',
            description: 'Bảng giá đổ kho cho các đại lý khu vực',
            discountPercent: 12,
            customerTypes: ['WHOLESALE'],
            priority: 40,
            isActive: true
        },
        update: { isActive: true }
    })

    await prisma.priceTier.deleteMany({ where: { priceListId: wholesalePriceList.id } })

    const wholesaleTiers = [
        { cat: 'Gạch', min: 200000, discount: 25 }, // Cấp sỉ đại lý lớn
        { cat: 'Xi măng', min: 2000, discount: 20 }, // 100 tấn
        { cat: 'Thép', min: 50000, discount: 18 },  // 50 tấn
        { cat: 'Sơn', min: 100, discount: 45 }       // Ôm hàng số lượng lớn
    ]

    await prisma.priceTier.createMany({
        data: wholesaleTiers.map(t => ({
            priceListId: wholesalePriceList.id,
            categoryId: catMap[t.cat],
            minQuantity: t.min,
            discountPercent: t.discount
        }))
    })

    console.log('--- Đã cập nhật định mức sỉ thực tế theo thị trường VN ---')
}
