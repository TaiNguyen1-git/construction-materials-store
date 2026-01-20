/**
 * Seed Script: Create diverse contractor data for Marketplace
 * Run: npx ts-node prisma/seed-marketplace.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CONTRACTORS = [
    {
        email: 'thau_xay@smartbuild.com',
        name: 'Phạm Hùng Thắng',
        company: 'Xây dựng Thắng Lợi',
        skills: ['Xây thô', 'Hoàn thiện', 'Chống thấm'],
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        bio: 'Phụ trách thi công hơn 100 công trình nhà xưởng và nhà ở dân dụng tại TP.HCM. Cam kết chất lượng và tiến độ.',
        exp: 12,
        rating: 4.8,
        projects: 142,
        trust: 98
    },
    {
        email: 'dien_nuoc@smartbuild.com',
        name: 'Trần Minh Quân',
        company: 'Cơ điện Quân Anh',
        skills: ['Điện nước', 'Máy lạnh', 'Hệ thống an ninh'],
        city: 'Hà Nội',
        district: 'Cầu Giấy',
        bio: 'Chuyên gia thiết kế và lắp đặt hệ thống cơ điện cho biệt thự và căn hộ cao cấp. Bảo hành 24 tháng cho mọi công trình.',
        exp: 8,
        rating: 4.9,
        projects: 85,
        trust: 95
    },
    {
        email: 'son_ba@smartbuild.com',
        name: 'Lê Thị Thu',
        company: 'Sơn bả Thiên Phú',
        skills: ['Sơn bả', 'Thạch cao', 'Giấy dán tường'],
        city: 'Hồ Chí Minh',
        district: 'Quận 7',
        bio: 'Đội ngũ chuyên nghiệp, sử dụng công nghệ máy phun sơn hiện đại giúp bề mặt phẳng mịn và tiết kiệm vật tư.',
        exp: 6,
        rating: 4.7,
        projects: 210,
        trust: 92
    },
    {
        email: 'noi_that@smartbuild.com',
        name: 'Nguyễn Kiên Cường',
        company: 'Nội thất Mộc Gia',
        skills: ['Nội thất', 'Gỗ công nghiệp', 'Sàn gỗ'],
        city: 'Đà Nẵng',
        district: 'Hải Châu',
        bio: 'Xưởng sản xuất trực tiếp, cam kết vật liệu chuẩn An Cường. Thiết kế 3D miễn phí khi thi công trọn gói.',
        exp: 10,
        rating: 5.0,
        projects: 120,
        trust: 100
    },
    {
        email: 'sua_nha@smartbuild.com',
        name: 'Hoàng Văn Lâm',
        company: 'Sửa nhà 247',
        skills: ['Sửa chữa', 'Cải tạo', 'Phá dỡ'],
        city: 'Hải Phòng',
        district: 'Lê Chân',
        bio: 'Dịch vụ sửa chữa nhanh trong vòng 24h. Xử lý triệt để các vấn đề thấm dột, nứt tường và xuống cấp của công trình.',
        exp: 15,
        rating: 4.6,
        projects: 300,
        trust: 89
    },
    {
        email: 'mai_ton@smartbuild.com',
        name: 'Đặng Quốc Huy',
        company: 'Cơ khí Huy Hoàng',
        skills: ['Cửa sắt', 'Mái tôn', 'Hàng rào'],
        city: 'Cần Thơ',
        district: 'Ninh Kiều',
        bio: 'Chuyên các hạng mục sắt nghệ thuật, mái vòm, mái tôn chống nóng cho kho bãi và nhà phố.',
        exp: 7,
        rating: 4.5,
        projects: 64,
        trust: 90
    }
]

async function main() {
    console.log('🚀 Seeding marketplace data...')
    const password = await bcrypt.hash('thau123', 10)

    for (const c of CONTRACTORS) {
        // 1. Create User
        const user = await prisma.user.upsert({
            where: { email: c.email },
            update: {},
            create: {
                email: c.email,
                name: c.name,
                password: password,
                role: 'CONTRACTOR' as any,
                isActive: true
            }
        })

        // 2. Create Customer
        const customer = await prisma.customer.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                customerType: 'CONTRACTOR' as any,
                contractorVerified: true,
                companyName: c.company,
                companyAddress: `${c.district}, ${c.city}`,
                referralCode: `REF-${c.email.split('@')[0].toUpperCase()}`
            } as any
        })

        // 3. Create Profile
        await prisma.contractorProfile.upsert({
            where: { customerId: customer.id },
            update: {
                displayName: c.name,
                bio: c.bio,
                companyName: c.company,
                skills: c.skills,
                experienceYears: c.exp,
                avgRating: c.rating,
                totalProjectsCompleted: c.projects,
                trustScore: c.trust,
                isVerified: true,
                onboardingStatus: 'VERIFIED',
                city: c.city,
                district: c.district
            } as any,
            create: {
                customerId: customer.id,
                displayName: c.name,
                bio: c.bio,
                companyName: c.company,
                skills: c.skills,
                experienceYears: c.exp,
                avgRating: c.rating,
                totalProjectsCompleted: c.projects,
                trustScore: c.trust,
                isVerified: true,
                onboardingStatus: 'VERIFIED',
                city: c.city,
                district: c.district
            } as any
        })

        console.log(`✅ Created contractor: ${c.name} (${c.company})`)
    }

    console.log('🎉 Seed marketplace completed!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
