/**
 * Seed Script: Create a test Contractor Account
 * Run: npx ts-node prisma/seed-contractor.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Creating test contractor account...')

    // 1. Create User
    const hashedPassword = await bcrypt.hash('contractor123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'contractor@test.com' },
        update: {},
        create: {
            email: 'contractor@test.com',
            password: hashedPassword,
            name: 'Nguyễn Văn Thầu',
            phone: '0909123456',
            role: 'USER',
            isActive: true,
            emailVerified: true
        }
    })
    console.log('✅ User created:', user.email)

    // 2. Create Customer with CONTRACTOR type
    const customer = await prisma.customer.upsert({
        where: { userId: user.id },
        update: {
            customerType: 'CONTRACTOR',
            creditLimit: 100000000, // 100 triệu
            currentBalance: 45000000, // Nợ 45 triệu
            contractorVerified: true,
            taxId: '0123456789',
            companyName: 'Công ty TNHH Xây dựng Hoàng Phát',
            companyAddress: '123 Đường Nguyễn Văn Linh, P. Tân Phong, TP. Biên Hòa',
            creditHold: false,
            overdueAmount: 0,
            maxOverdueDays: 0
        },
        create: {
            userId: user.id,
            customerType: 'CONTRACTOR',
            creditLimit: 100000000,
            currentBalance: 45000000,
            contractorVerified: true,
            taxId: '0123456789',
            companyName: 'Công ty TNHH Xây dựng Hoàng Phát',
            companyAddress: '123 Đường Nguyễn Văn Linh, P. Tân Phong, TP. Biên Hòa',
            creditHold: false,
            overdueAmount: 0,
            maxOverdueDays: 0,
            totalPurchases: 250000000,
            loyaltyPoints: 5000
        }
    })
    console.log('✅ Customer created:', customer.id)

    // 3. Create a Contract for this customer
    const contract = await prisma.contract.upsert({
        where: { contractNumber: 'HD-CONTRACTOR-001' },
        update: {},
        create: {
            contractNumber: 'HD-CONTRACTOR-001',
            customerId: customer.id,
            name: 'Hợp đồng Giá ưu đãi 2025',
            description: 'Hợp đồng cung cấp VLXD cho các dự án năm 2025',
            contractType: 'DISCOUNT',
            status: 'ACTIVE',
            validFrom: new Date('2025-01-01'),
            validTo: new Date('2025-12-31'),
            creditTermDays: 30,
            specialCreditLimit: 150000000,
            terms: 'Thanh toán trong vòng 30 ngày kể từ ngày giao hàng'
        }
    })
    console.log('✅ Contract created:', contract.contractNumber)

    // 4. Seed default Price Lists if not exists
    const priceLists = [
        { code: 'RETAIL', name: 'Giá lẻ', discountPercent: 0, customerTypes: ['REGULAR'], priority: 0 },
        { code: 'VIP', name: 'Giá VIP', discountPercent: 5, customerTypes: ['VIP'], priority: 10 },
        { code: 'WHOLESALE', name: 'Giá sỉ', discountPercent: 10, customerTypes: ['WHOLESALE'], priority: 20 },
        { code: 'CONTRACTOR', name: 'Giá nhà thầu', discountPercent: 15, customerTypes: ['CONTRACTOR'], priority: 30 }
    ]

    for (const pl of priceLists) {
        await prisma.priceList.upsert({
            where: { code: pl.code },
            update: {},
            create: {
                code: pl.code,
                name: pl.name,
                discountPercent: pl.discountPercent,
                customerTypes: pl.customerTypes as any,
                priority: pl.priority,
                isActive: true
            }
        })
    }
    console.log('✅ Price Lists created')

    // 5. Create Debt Configuration
    await prisma.debtConfiguration.upsert({
        where: { name: 'Default' },
        update: {},
        create: {
            name: 'Default',
            maxOverdueDays: 30,
            creditLimitPercent: 100,
            autoHoldOnOverdue: true,
            warningDays: 7,
            isActive: true
        }
    })

    await prisma.debtConfiguration.upsert({
        where: { name: 'CONTRACTOR' },
        update: {},
        create: {
            name: 'CONTRACTOR',
            maxOverdueDays: 45, // Nhà thầu được nợ lâu hơn
            creditLimitPercent: 120, // Có thể vượt hạn mức 20%
            autoHoldOnOverdue: true,
            warningDays: 14,
            isActive: true
        }
    })
    console.log('✅ Debt Configurations created')

    console.log('\n========================================')
    console.log('🎉 CONTRACTOR ACCOUNT CREATED!')
    console.log('========================================')
    console.log('Email:    contractor@test.com')
    console.log('Password: contractor123')
    console.log('Company:  Công ty TNHH Xây dựng Hoàng Phát')
    console.log('Tax ID:   0123456789')
    console.log('Credit:   100,000,000 VND')
    console.log('Debt:     45,000,000 VND')
    console.log('Contract: HD-CONTRACTOR-001 (15% discount)')
    console.log('========================================\n')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
