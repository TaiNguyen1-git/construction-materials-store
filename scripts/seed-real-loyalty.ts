import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding realistic loyalty data...')

    const password = await hash('password123', 12)

    // 1. Create/Update Main High-Value Account
    try {
        const mainUserEmail = 'vip.customer@example.com'
        let mainUser = await prisma.user.findUnique({ where: { email: mainUserEmail } })

        if (!mainUser) {
            mainUser = await prisma.user.create({
                data: {
                    email: mainUserEmail,
                    name: 'Trần Minh Tuấn',
                    password,
                    role: 'CUSTOMER',
                    phone: '0901234567',
                    address: '123 Nguyễn Huệ, Quận 1, TP.HCM'
                }
            })
            console.log(`Created main VIP user: ${mainUser.name}`)
        }

        // Upsert Customer profile for Main User
        await prisma.customer.upsert({
            where: { userId: mainUser.id },
            create: {
                userId: mainUser.id,
                customerType: 'VIP',
                loyaltyTier: 'DIAMOND',
                loyaltyPoints: 15600,
                totalPointsEarned: 25000,
                totalPointsRedeemed: 9400,
                totalPurchases: 250000000, // 250 million VND
                loyaltyPointsToNextTier: 0,
                lastPurchaseDate: new Date(),
                purchaseFrequency: 4.5, // purchases per month
                preferredCategories: ['Xi măng', 'Thép', 'Gạch'],
                referralCode: 'TUANVIP888',
                totalReferrals: 12
            },
            update: {
                loyaltyTier: 'DIAMOND',
                loyaltyPoints: 15600,
                totalPointsEarned: 25000,
                totalPointsRedeemed: 9400,
                totalPurchases: 250000000,
                referralCode: 'TUANVIP888'
            }
        })
    } catch (error) {
        console.error('Error creating main VIP user:', error)
    }

    // 2. Create 5 Diverse Loyalty Accounts
    const diverseUsers = [
        {
            name: 'Nguyễn Thị Mai',
            email: 'mai.nguyen@example.com',
            phone: '0912345678',
            tier: 'PLATINUM',
            points: 6200,
            totalSpent: 65000000,
            redeemed: 300,
            referrals: 3,
            type: 'WHOLESALE'
        },
        {
            name: 'Lê Văn Hùng',
            email: 'hung.le@example.com',
            phone: '0987654321',
            tier: 'GOLD',
            points: 2800,
            totalSpent: 28000000,
            redeemed: 0,
            referrals: 1,
            type: 'REGULAR'
        },
        {
            name: 'Phạm Thanh Hương',
            email: 'huong.pham@example.com',
            phone: '0933445566',
            tier: 'SILVER',
            points: 1500,
            totalSpent: 15000000,
            redeemed: 0,
            referrals: 0,
            type: 'REGULAR'
        },
        {
            name: 'Hoàng Quốc Bảo',
            email: 'bao.hoang@example.com',
            phone: '0977889900',
            tier: 'BRONZE',
            points: 850,
            totalSpent: 8500000,
            redeemed: 0,
            referrals: 0,
            type: 'REGULAR'
        },
        {
            name: 'Vũ Thị Lan',
            email: 'lan.vu@example.com',
            phone: '0966778899',
            tier: 'GOLD',
            points: 3500,
            totalSpent: 36000000,
            redeemed: 100,
            referrals: 2,
            type: 'WHOLESALE'
        }
    ]

    for (const u of diverseUsers) {
        try {
            let user = await prisma.user.findUnique({ where: { email: u.email } })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: u.email,
                        name: u.name,
                        password,
                        role: 'CUSTOMER',
                        phone: u.phone,
                        address: 'TP.HCM'
                    }
                })
                console.log(`Created user: ${u.name}`)
            }

            await prisma.customer.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    customerType: u.type as any,
                    loyaltyTier: u.tier as any,
                    loyaltyPoints: u.points,
                    totalPointsEarned: u.points + u.redeemed,
                    totalPointsRedeemed: u.redeemed,
                    totalPurchases: u.totalSpent,
                    loyaltyPointsToNextTier: 1000, // Simplified
                    lastPurchaseDate: new Date(),
                    totalReferrals: u.referrals
                },
                update: {
                    loyaltyTier: u.tier as any,
                    loyaltyPoints: u.points,
                    totalPointsEarned: u.points + u.redeemed,
                    totalPointsRedeemed: u.redeemed,
                    totalPurchases: u.totalSpent
                }
            })
        } catch (error) {
            console.error(`Error processing user ${u.name}:`, error)
        }
    }

    console.log('Seeding finished successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
