/**
 * Seed Contractors Script
 * Creates sample contractor profiles for demo purposes
 * Run: npm run db:seed:contractors
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample contractor data
const contractors = [
    {
        customerId: 'contractor_001',
        displayName: 'Công ty XD Hoàng Phát',
        bio: 'Chuyên xây dựng nhà ở, biệt thự với hơn 15 năm kinh nghiệm. Đội ngũ thợ lành nghề, cam kết chất lượng.',
        phone: '0909123456',
        email: 'hoangphat.xd@gmail.com',
        address: '123 Nguyễn Văn Linh',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        skills: ['Xây thô', 'Hoàn thiện', 'Móng cọc', 'Kết cấu'],
        experienceYears: 15,
        teamSize: 25,
        portfolioImages: ['/images/portfolio/hoangphat-1.jpg', '/images/portfolio/hoangphat-2.jpg'],
        portfolioDesc: ['Biệt thự 3 tầng Phú Mỹ Hưng', 'Nhà phố liền kề KDC Tân Phong'],
        documents: [],
        isVerified: true,
        avgRating: 4.9,
        totalReviews: 45,
        completedJobs: 52
    },
    {
        customerId: 'contractor_002',
        displayName: 'CTCP Xây dựng Minh Đức',
        bio: 'Thi công công trình dân dụng và công nghiệp. Uy tín, đúng tiến độ, giá cạnh tranh.',
        phone: '0918234567',
        email: 'minhduc.construction@gmail.com',
        address: '456 Đường 30/4',
        district: 'Thủ Đức',
        city: 'TP Hồ Chí Minh',
        skills: ['Xây thô', 'Công nghiệp', 'Nhà xưởng', 'Sửa chữa'],
        experienceYears: 12,
        teamSize: 35,
        portfolioImages: ['/images/portfolio/minhduc-1.jpg'],
        portfolioDesc: ['Nhà xưởng KCN Sóng Thần'],
        documents: [],
        isVerified: true,
        avgRating: 4.8,
        totalReviews: 38,
        completedJobs: 41
    },
    {
        customerId: 'contractor_003',
        displayName: 'Nhà thầu Trường Thành',
        bio: 'Chuyên thi công điện nước, hoàn thiện nội thất. Báo giá minh bạch, bảo hành dài hạn.',
        phone: '0927345678',
        email: 'truongthanh.dn@gmail.com',
        address: '789 Phạm Văn Đồng',
        district: 'Long Thành',
        city: 'Đồng Nai',
        skills: ['Điện', 'Nước', 'Hoàn thiện', 'Nội thất'],
        experienceYears: 8,
        teamSize: 12,
        portfolioImages: [],
        portfolioDesc: [],
        documents: [],
        isVerified: true,
        avgRating: 4.7,
        totalReviews: 28,
        completedJobs: 35
    },
    {
        customerId: 'contractor_004',
        displayName: 'Công ty TNHH Phúc An',
        bio: 'Xây dựng nhà phố, biệt thự trọn gói từ A-Z. Thiết kế - Thi công - Giám sát.',
        phone: '0936456789',
        email: 'phucan.build@gmail.com',
        address: '321 Võ Thị Sáu',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        skills: ['Xây thô', 'Hoàn thiện', 'Thiết kế', 'Trọn gói'],
        experienceYears: 10,
        teamSize: 20,
        portfolioImages: ['/images/portfolio/phucan-1.jpg', '/images/portfolio/phucan-2.jpg'],
        portfolioDesc: ['Nhà phố hiện đại Q9', 'Villa nghỉ dưỡng Vũng Tàu'],
        documents: [],
        isVerified: true,
        avgRating: 4.9,
        totalReviews: 31,
        completedJobs: 38
    },
    {
        customerId: 'contractor_005',
        displayName: 'XD Tân Phát Lộc',
        bio: 'Đội thợ xây dựng chuyên nghiệp, nhận xây nhà cấp 4, nhà ống. Giá rẻ, chất lượng tốt.',
        phone: '0945567890',
        email: 'tanphatloc@gmail.com',
        address: '654 Lê Duẩn',
        district: 'Nhơn Trạch',
        city: 'Đồng Nai',
        skills: ['Xây thô', 'Nhà cấp 4', 'Sửa chữa'],
        experienceYears: 6,
        teamSize: 8,
        portfolioImages: [],
        portfolioDesc: [],
        documents: [],
        isVerified: false,
        avgRating: 4.6,
        totalReviews: 15,
        completedJobs: 22
    },
    {
        customerId: 'contractor_006',
        displayName: 'Công ty XD Thịnh Vượng',
        bio: 'Chuyên gia thi công móng cọc, kết cấu bê tông cốt thép. Máy móc hiện đại.',
        phone: '0954678901',
        email: 'thinhvuong.xd@gmail.com',
        address: '987 Nguyễn Ái Quốc',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        skills: ['Móng cọc', 'Kết cấu', 'Bê tông', 'Công nghiệp'],
        experienceYears: 18,
        teamSize: 45,
        portfolioImages: ['/images/portfolio/thinhvuong-1.jpg'],
        portfolioDesc: ['Móng cọc nhà máy KCN Amata'],
        documents: [],
        isVerified: true,
        avgRating: 4.8,
        totalReviews: 52,
        completedJobs: 67
    },
    {
        customerId: 'contractor_007',
        displayName: 'DNTN Xây dựng Hưng Long',
        bio: 'Nhận sửa chữa, cải tạo nhà cũ. Nâng tầng, mở rộng không gian. Tư vấn miễn phí.',
        phone: '0963789012',
        email: 'hunglong.repair@gmail.com',
        address: '147 Trần Phú',
        district: 'Tân Uyên',
        city: 'Bình Dương',
        skills: ['Sửa chữa', 'Cải tạo', 'Nâng tầng', 'Hoàn thiện'],
        experienceYears: 9,
        teamSize: 15,
        portfolioImages: [],
        portfolioDesc: [],
        documents: [],
        isVerified: true,
        avgRating: 4.7,
        totalReviews: 35,
        completedJobs: 48
    },
    {
        customerId: 'contractor_008',
        displayName: 'Nhà thầu Đại Việt',
        bio: 'Thi công chung cư, nhà cao tầng. Đội ngũ kỹ sư giàu kinh nghiệm, thiết bị hiện đại.',
        phone: '0972890123',
        email: 'daiviet.construction@gmail.com',
        address: '258 Điện Biên Phủ',
        district: 'Quận 3',
        city: 'TP Hồ Chí Minh',
        skills: ['Cao tầng', 'Chung cư', 'Kết cấu', 'Công nghiệp'],
        experienceYears: 20,
        teamSize: 80,
        portfolioImages: ['/images/portfolio/daiviet-1.jpg', '/images/portfolio/daiviet-2.jpg'],
        portfolioDesc: ['Chung cư Sunrise City', 'Tòa nhà văn phòng Q1'],
        documents: [],
        isVerified: true,
        avgRating: 4.9,
        totalReviews: 78,
        completedJobs: 95
    },
    {
        customerId: 'contractor_009',
        displayName: 'Thợ điện Văn Minh',
        bio: 'Chuyên thi công điện dân dụng, điện công nghiệp. Lắp đặt, sửa chữa nhanh chóng.',
        phone: '0981901234',
        email: 'vanminh.electric@gmail.com',
        address: '369 Hai Bà Trưng',
        district: 'Biên Hòa',
        city: 'Đồng Nai',
        skills: ['Điện dân dụng', 'Điện công nghiệp', 'Sửa chữa điện'],
        experienceYears: 11,
        teamSize: 6,
        portfolioImages: [],
        portfolioDesc: [],
        documents: [],
        isVerified: true,
        avgRating: 4.5,
        totalReviews: 22,
        completedJobs: 89
    },
    {
        customerId: 'contractor_010',
        displayName: 'Nội thất Gia Hưng',
        bio: 'Thiết kế và thi công nội thất trọn gói. Phong cách hiện đại, cổ điển, tân cổ điển.',
        phone: '0990012345',
        email: 'giahung.interior@gmail.com',
        address: '480 Lê Hồng Phong',
        district: 'Quận 10',
        city: 'TP Hồ Chí Minh',
        skills: ['Nội thất', 'Thiết kế', 'Gỗ công nghiệp', 'Trang trí'],
        experienceYears: 7,
        teamSize: 18,
        portfolioImages: ['/images/portfolio/giahung-1.jpg'],
        portfolioDesc: ['Nội thất căn hộ Vinhomes'],
        documents: [],
        isVerified: true,
        avgRating: 4.8,
        totalReviews: 41,
        completedJobs: 56
    }
]

async function seedContractors() {
    console.log('🚀 Starting contractor seed...')

    let created = 0
    let skipped = 0

    for (const contractor of contractors) {
        try {
            // Check if already exists
            const existing = await prisma.contractorProfile.findFirst({
                where: { customerId: contractor.customerId }
            })

            if (existing) {
                console.log(`⏭️  Skipping ${contractor.displayName} (already exists)`)
                skipped++
                continue
            }

            await prisma.contractorProfile.create({
                data: contractor
            })

            console.log(`✅ Created: ${contractor.displayName}`)
            created++
        } catch (error) {
            console.error(`❌ Error creating ${contractor.displayName}:`, error)
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   Created: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log('✨ Contractor seed completed!')
}

seedContractors()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
