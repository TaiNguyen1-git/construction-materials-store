/**
 * Seed Script: Demo 6 Flows for Quotes (Fixed)
 * Run: npx tsx prisma/seed-quotes-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Seeding Demo Data for Quote Flows...')

    const hashedPassword = await bcrypt.hash('demo123', 10)

    // Clean up existing demo data to avoid conflicts
    const existingEmails = ['customer@demo.com', 'contractor@demo.com']
    const existingUsers = await prisma.user.findMany({
        where: { email: { in: existingEmails } }
    })
    const existingUserIds = existingUsers.map(u => u.id)

    if (existingUserIds.length > 0) {
        console.log('🧹 Cleaning up old demo data...')
        const existingCustomers = await prisma.customer.findMany({
            where: { userId: { in: existingUserIds } }
        })
        const customerIds = existingCustomers.map(c => c.id)

        // Delete related data with safety checks
        try {
            await prisma.quoteItem.deleteMany({ where: { quote: { customerId: { in: customerIds } } } })
            await prisma.paymentMilestone.deleteMany({ where: { quote: { customerId: { in: customerIds } } } })
            await prisma.quoteStatusHistory.deleteMany({ where: { quote: { customerId: { in: customerIds } } } })
            await prisma.quoteRequest.deleteMany({ where: { customerId: { in: customerIds } } })
            await prisma.contractorReview.deleteMany({ where: { contractor: { customerId: { in: customerIds } } } })
            await prisma.contractorProfile.deleteMany({ where: { customerId: { in: customerIds } } })
            await prisma.project.deleteMany({ where: { customerId: { in: customerIds } } })
            await prisma.customer.deleteMany({ where: { id: { in: customerIds } } })
            await prisma.user.deleteMany({ where: { id: { in: existingUserIds } } })
        } catch (e) {
            console.log('Note: Some records were already gone or skip deletion')
        }
    }

    // 1. Create Demo Customer
    const customerUser = await prisma.user.create({
        data: {
            email: 'customer@demo.com',
            password: hashedPassword,
            name: 'Lê Khách Hàng',
            role: 'CUSTOMER',
            isActive: true
        }
    })

    const customer = await prisma.customer.create({
        data: {
            userId: customerUser.id,
            customerType: 'VIP',
            loyaltyPoints: 1000,
            referralCode: 'REF_DEMO_CUST_' + Date.now()
        }
    })

    // 2. Create Demo Contractor
    const contractorUser = await prisma.user.create({
        data: {
            email: 'contractor@demo.com',
            password: hashedPassword,
            name: 'Trần Nhà Thầu Pros',
            role: 'CUSTOMER',
            isActive: true
        }
    })

    const contractor = await prisma.customer.create({
        data: {
            userId: contractorUser.id,
            customerType: 'CONTRACTOR',
            contractorVerified: true,
            companyName: 'Xây Dựng Đại Việt',
            referralCode: 'REF_DEMO_CONT_' + Date.now()
        }
    })

    // Create Contractor Profile (Flow 5)
    const profile = await prisma.contractorProfile.create({
        data: {
            customerId: contractor.id,
            displayName: contractorUser.name,
            trustScore: 92.5,
            totalProjectsCompleted: 15,
            avgRating: 4.8,
            bio: 'Chuyên thi công nhà phố và biệt thự cao cấp với hơn 10 năm kinh nghiệm.',
            skills: ['Xây dựng thô', 'Hoàn thiện nội thất']
        }
    })

    // 3. Create a Project
    const project = await prisma.project.create({
        data: {
            name: 'Biệt Thự Vườn Demo',
            customerId: customer.id,
            location: 'Thảo Điền, Quận 2',
            status: 'PLANNING',
            startDate: new Date(),
            budget: 500000000
        }
    })

    // 4. Create Quote 1: PENDING (Flow 1 & 4 Start)
    await prisma.quoteRequest.create({
        data: {
            customerId: customer.id,
            contractorId: contractor.id,
            projectId: project.id,
            details: 'Yêu cầu báo giá hoàn thiện phần thô biệt thự 250m2. Cần vật tư loại 1.',
            budget: 500000000,
            location: 'Quận 2, TP.HCM',
            status: 'PENDING',
            history: {
                create: {
                    userId: customerUser.id,
                    newStatus: 'PENDING',
                    notes: 'Khách hàng khởi tạo yêu cầu'
                }
            }
        }
    })

    // 5. Create Quote 2: REPLIED (Flow 1: BoQ)
    await prisma.quoteRequest.create({
        data: {
            customerId: customer.id,
            contractorId: contractor.id,
            projectId: project.id,
            details: 'Cải tạo mặt tiền cửa hàng thời trang.',
            budget: 120000000,
            location: 'Quận 1, TP.HCM',
            status: 'REPLIED',
            priceQuote: 115000000,
            response: 'Chào bạn, chúng tôi đã xem kỹ yêu cầu. Đây là báo giá chi tiết cho gói hoàn thiện mặt tiền.',
            items: {
                create: [
                    { description: 'Phá dỡ hiện trạng', quantity: 1, unit: 'Gói', unitPrice: 15000000, totalPrice: 15000000 },
                    { description: 'Sơn nước Spec nội ngoại thất', quantity: 200, unit: 'm2', unitPrice: 150000, totalPrice: 30000000 },
                    { description: 'Ốp gạch Ceramic cao cấp', quantity: 50, unit: 'm2', unitPrice: 600000, totalPrice: 30000000 },
                    { description: 'Hệ thống đèn Led chiếu sáng', quantity: 100, unit: 'Bộ', unitPrice: 400000, totalPrice: 40000000 }
                ]
            },
            history: {
                create: {
                    userId: contractorUser.id,
                    newStatus: 'REPLIED',
                    notes: 'Nhà thầu đã bóc tách BoQ và gửi báo hàng'
                }
            }
        }
    })

    // 6. Create Quote 3: ACCEPTED (Flow 2, 3: OTP & Escrow)
    await prisma.quoteRequest.create({
        data: {
            customerId: customer.id,
            contractorId: contractor.id,
            projectId: project.id,
            details: 'Xây tường rào và sân vườn Biệt thự Vườn.',
            budget: 80000000,
            location: 'Thảo Điền, Quận 2',
            status: 'ACCEPTED',
            priceQuote: 75000000,
            isVerified: true,
            verifiedAt: new Date(),
            items: {
                create: [
                    { description: 'Xây tường 200 gạch ống', quantity: 45, unit: 'm2', unitPrice: 1000000, totalPrice: 45000000 },
                    { description: 'Lát đá granite sân vườn', quantity: 20, unit: 'm2', unitPrice: 1000000, totalPrice: 20000000 },
                    { description: 'Cổng sắt nghệ thuật', quantity: 1, unit: 'Bộ', unitPrice: 10000000, totalPrice: 10000000 }
                ]
            },
            milestones: {
                create: [
                    { name: 'Đợt 1: Tạm ứng vật tư', percentage: 30, amount: 22500000, order: 1, status: 'ESCROW_PAID', paidAt: new Date() },
                    { name: 'Đợt 2: Xong phần thô tường', percentage: 50, amount: 37500000, order: 2, status: 'PENDING' },
                    { name: 'Đợt 3: Nghiệm thu bàn giao', percentage: 20, amount: 15000000, order: 3, status: 'PENDING' }
                ]
            },
            history: {
                createMany: {
                    data: [
                        { userId: contractorUser.id, newStatus: 'REPLIED', notes: 'Gửi báo giá gốc' },
                        { userId: customerUser.id, newStatus: 'ACCEPTED', notes: 'Đã xác thực OTP và chốt đơn giá' }
                    ]
                }
            }
        }
    })

    // 7. Create Reviews for Contractor (Flow 5: Trust Score)
    await prisma.contractorReview.createMany({
        data: [
            {
                contractorId: profile.id,
                reviewerId: customerUser.id,
                rating: 5,
                priceAccuracy: 5,
                materialQuality: 5,
                comment: 'Làm việc cực kỳ chuyên nghiệp và bàn giao đúng hạn. Giá cả minh bạch.'
            },
            {
                contractorId: contractor.id,
                reviewerId: customerUser.id,
                rating: 4,
                priceAccuracy: 4,
                materialQuality: 5,
                comment: 'Hợp tác tốt, vật tư rất chất lượng.'
            }
        ]
    })

    console.log('✅ Demo data seeded successfully!')
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect())
