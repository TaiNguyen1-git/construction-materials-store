import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const customer = await prisma.customer.findFirst({
        include: { user: true }
    })

    const banners = [
        {
            title: 'Vật Liệu Xây Dựng Chất Lượng Cao',
            description: 'Cung cấp giải pháp xây dựng bền vững cho ngôi nhà của bạn.',
            imageUrl: 'https://images.unsplash.com/photo-1503387762-592dea58ef21?q=80&w=2000',
            tag: 'Ưu đãi 2026',
            link: '/products',
            order: 1,
            isActive: true
        },
        {
            title: 'Hợp Tác Nhà Thầu - SME',
            description: 'Giải pháp cung ứng vật tư trọn gói cho doanh nghiệp và nhà thầu.',
            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2000',
            tag: 'Đối Tác',
            link: '/admin/contract-management',
            order: 2,
            isActive: true
        },
        {
            title: 'Hệ Thống Phân Phối Toàn Quốc',
            description: 'Giao hàng nhanh chóng và tin cậy đến mọi công trình.',
            imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad863c17d0ac?q=80&w=2000',
            tag: 'Logistic',
            link: '/order-tracking',
            order: 3,
            isActive: true
        }
    ]

    console.log('--- SEEDING BANNERS ---')
    for (const b of banners) {
        await prisma.banner.upsert({
            where: { id: 'temp' }, // or dummy
            update: b,
            create: b,
        }).catch(async () => {
            // Since ID is auto and map-unique title or something? 
            // Just create if not exists by title
            const exists = await prisma.banner.findFirst({ where: { title: b.title } })
            if (!exists) await prisma.banner.create({ data: b })
        })
    }
    console.log('✅ Banners seeded')

    if (customer) {
        console.log('--- SEEDING PROJECTS ---')
        const projects = [
            {
                name: 'Biệt Thự Phố Hiện Đại - Nhà Chú Minh',
                description: 'Công trình nhà phố 3 tầng, phong cách hiện đại. Sử dụng vật liệu hoàn thiện cao cấp.',
                customerId: customer.id,
                status: 'IN_PROGRESS',
                startDate: new Date('2025-11-01'),
                endDate: new Date('2026-05-15'),
                budget: 1500000000,
                priority: 'HIGH',
                progress: 45
            },
            {
                name: 'Cải Tạo Văn Phòng Làm Việc - SmartBuild Hub',
                description: 'Thi công cải tạo nội thất văn phòng 200m2. Thay đổi hệ thống trần thạch cao và vách ngăn.',
                customerId: customer.id,
                status: 'PLANNING',
                startDate: new Date('2026-02-01'),
                budget: 350000000,
                priority: 'MEDIUM',
                progress: 0
            },
            {
                name: 'Nhà Xưởng Sản Xuất Nhựa Long Thành',
                description: 'Thi công phần móng và kết cấu thép cho nhà xưởng diện tích 1000m2.',
                customerId: customer.id,
                status: 'COMPLETED',
                startDate: new Date('2025-05-01'),
                endDate: new Date('2025-12-20'),
                budget: 4200000000,
                priority: 'URGENT',
                progress: 100
            }
        ]

        for (const p of projects) {
            const exists = await prisma.project.findFirst({ where: { name: p.name } })
            if (!exists) {
                await (prisma as any).project.create({ data: p })
            }
        }
        console.log('✅ Projects seeded')
    } else {
        console.log('⚠️ No customer found to link projects. Please create a customer first.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
