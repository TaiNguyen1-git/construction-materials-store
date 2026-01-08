/**
 * Seed Projects Script
 * Creates sample marketplace projects for demo purposes
 * Run: npm run db:seed:projects
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample projects data
const projects = [
    {
        customerId: 'customer_demo_001',
        title: 'Xây nhà 2 tầng tại Biên Hòa',
        description: 'Cần tìm nhà thầu xây nhà 2 tầng diện tích 100m2, đã có bản vẽ kiến trúc. Yêu cầu hoàn thiện trong 6 tháng.',
        projectType: 'NEW_BUILD' as const,
        status: 'PLANNING' as const,
        address: '123 Đường Nguyễn Văn Cừ',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        budgetMin: 800000000,
        budgetMax: 1200000000,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-01'),
        requirements: ['Xây thô', 'Hoàn thiện', 'Điện', 'Nước'],
        images: [],
        isUrgent: false
    },
    {
        customerId: 'customer_demo_002',
        title: 'Sửa chữa nhà cũ - Cải tạo phòng khách',
        description: 'Cải tạo phòng khách rộng 30m2, đập tường mở rộng, thay sàn gạch mới, sơn lại tường.',
        projectType: 'RENOVATION' as const,
        status: 'PLANNING' as const,
        address: '456 Đường 30/4',
        district: 'Thủ Đức',
        city: 'TP Hồ Chí Minh',
        budgetMin: 50000000,
        budgetMax: 80000000,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-15'),
        requirements: ['Hoàn thiện', 'Sơn nước', 'Ốp lát'],
        images: [],
        isUrgent: true
    },
    {
        customerId: 'customer_demo_003',
        title: 'Thi công nội thất căn hộ 3PN',
        description: 'Thiết kế và thi công nội thất trọn gói căn hộ 90m2. Phong cách hiện đại, tối giản.',
        projectType: 'INTERIOR' as const,
        status: 'PLANNING' as const,
        address: '789 Võ Văn Ngân',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        budgetMin: 200000000,
        budgetMax: 300000000,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-04-30'),
        requirements: ['Nội thất', 'Gỗ công nghiệp', 'Thiết kế'],
        images: [],
        isUrgent: false
    },
    {
        customerId: 'customer_demo_001',
        title: 'Lắp đặt hệ thống điện nhà xưởng',
        description: 'Cần thợ điện chuyên nghiệp lắp đặt hệ thống điện 3 pha cho nhà xưởng 500m2.',
        projectType: 'ELECTRICAL' as const,
        status: 'PLANNING' as const,
        address: 'KCN Amata',
        district: 'Long Bình',
        city: 'Đồng Nai',
        budgetMin: 100000000,
        budgetMax: 150000000,
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-02-20'),
        requirements: ['Điện công nghiệp', 'Điện 3 pha'],
        images: [],
        isUrgent: true
    },
    {
        customerId: 'customer_demo_004',
        title: 'Xây dựng biệt thự sân vườn',
        description: 'Thi công biệt thự 3 tầng có sân vườn, hồ bơi mini. Diện tích đất 300m2, diện tích xây dựng 180m2.',
        projectType: 'NEW_BUILD' as const,
        status: 'IN_PROGRESS' as const,
        address: '111 Đường Hùng Vương',
        district: 'Long Thành',
        city: 'Đồng Nai',
        budgetMin: 2500000000,
        budgetMax: 3500000000,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-06-01'),
        requirements: ['Xây thô', 'Hoàn thiện', 'Móng cọc', 'Kết cấu', 'Hồ bơi'],
        images: [],
        isUrgent: false
    },
    {
        customerId: 'customer_demo_005',
        title: 'Sửa chữa đường ống nước nhà ở',
        description: 'Thay thế hệ thống ống nước cũ, sửa chữa thiết bị vệ sinh. Nhà 1 trệt 1 lầu.',
        projectType: 'PLUMBING' as const,
        status: 'PLANNING' as const,
        address: '222 Lê Lợi',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        budgetMin: 30000000,
        budgetMax: 50000000,
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-25'),
        requirements: ['Nước', 'Sửa chữa'],
        images: [],
        isUrgent: true
    },
    {
        customerId: 'customer_demo_002',
        title: 'Lợp lại mái tôn nhà xưởng',
        description: 'Thay mái tôn cũ bị dột, diện tích 800m2. Cần hoàn thành nhanh do mùa mưa.',
        projectType: 'ROOFING' as const,
        status: 'COMPLETED' as const,
        address: 'Khu công nghiệp Sóng Thần',
        district: 'Dĩ An',
        city: 'Bình Dương',
        budgetMin: 200000000,
        budgetMax: 280000000,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-15'),
        requirements: ['Mái', 'Tôn lạnh'],
        images: [],
        isUrgent: false
    },
    {
        customerId: 'customer_demo_003',
        title: 'Nâng tầng nhà phố',
        description: 'Nâng thêm 1 tầng cho nhà phố 5x20m. Cần gia cố móng, đổ bê tông cốt thép.',
        projectType: 'RENOVATION' as const,
        status: 'PLANNING' as const,
        address: '333 Phạm Văn Đồng',
        district: 'Nhơn Trạch',
        city: 'Đồng Nai',
        budgetMin: 350000000,
        budgetMax: 450000000,
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-05-15'),
        requirements: ['Xây thô', 'Kết cấu', 'Bê tông', 'Nâng tầng'],
        images: [],
        isUrgent: false
    }
]

async function seedProjects() {
    console.log('🚀 Starting projects seed...')

    let created = 0
    let skipped = 0

    for (const project of projects) {
        try {
            // Check if project with same title already exists
            const existing = await prisma.marketProject.findFirst({
                where: { title: project.title }
            })

            if (existing) {
                console.log(`⏭️  Skipping "${project.title}" (already exists)`)
                skipped++
                continue
            }

            await prisma.marketProject.create({
                data: project
            })

            console.log(`✅ Created: ${project.title}`)
            created++
        } catch (error) {
            console.error(`❌ Error creating "${project.title}":`, error)
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   Created: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log('✨ Projects seed completed!')
}

seedProjects()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
