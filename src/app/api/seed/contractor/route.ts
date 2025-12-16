import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * API để tạo tài khoản Nhà thầu mẫu
 * POST /api/seed/contractor
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Create User
        const hashedPassword = await bcrypt.hash('contractor123', 10)

        const existingUser = await prisma.user.findUnique({
            where: { email: 'contractor@test.com' }
        })

        let user
        if (existingUser) {
            user = existingUser
        } else {
            user = await prisma.user.create({
                data: {
                    email: 'contractor@test.com',
                    password: hashedPassword,
                    name: 'Nguyễn Văn Thầu',
                    phone: '0909123456',
                    role: 'CUSTOMER',
                    isActive: true
                }
            })
        }

        // 2. Create/Update Customer with CONTRACTOR type
        const existingCustomer = await prisma.customer.findUnique({
            where: { userId: user.id }
        })

        let customer
        if (existingCustomer) {
            customer = await prisma.customer.update({
                where: { id: existingCustomer.id },
                data: {
                    customerType: 'CONTRACTOR',
                    creditLimit: 100000000,
                    currentBalance: 45000000,
                    contractorVerified: true,
                    taxId: '0123456789',
                    companyName: 'Công ty TNHH Xây dựng Hoàng Phát',
                    companyAddress: '123 Đường Nguyễn Văn Linh, P. Tân Phong, TP. Biên Hòa',
                    creditHold: false,
                    overdueAmount: 0,
                    maxOverdueDays: 0
                }
            })
        } else {
            customer = await prisma.customer.create({
                data: {
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
        }

        // 3. Create a Contract
        const existingContract = await prisma.contract.findUnique({
            where: { contractNumber: 'HD-CONTRACTOR-001' }
        })

        if (!existingContract) {
            await prisma.contract.create({
                data: {
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
        }

        // 4. Seed Price Lists
        const priceLists = [
            { code: 'RETAIL', name: 'Giá lẻ', discountPercent: 0, customerTypes: ['REGULAR'], priority: 0 },
            { code: 'VIP', name: 'Giá VIP', discountPercent: 5, customerTypes: ['VIP'], priority: 10 },
            { code: 'WHOLESALE', name: 'Giá sỉ', discountPercent: 10, customerTypes: ['WHOLESALE'], priority: 20 },
            { code: 'CONTRACTOR', name: 'Giá nhà thầu', discountPercent: 15, customerTypes: ['CONTRACTOR'], priority: 30 }
        ]

        for (const pl of priceLists) {
            const existing = await prisma.priceList.findUnique({ where: { code: pl.code } })
            if (!existing) {
                await prisma.priceList.create({
                    data: {
                        code: pl.code,
                        name: pl.name,
                        discountPercent: pl.discountPercent,
                        customerTypes: pl.customerTypes as any,
                        priority: pl.priority,
                        isActive: true
                    }
                })
            }
        }

        // 5. Create Debt Configurations
        const debtConfigs = [
            { name: 'Default', maxOverdueDays: 30, creditLimitPercent: 100, autoHoldOnOverdue: true, warningDays: 7 },
            { name: 'CONTRACTOR', maxOverdueDays: 45, creditLimitPercent: 120, autoHoldOnOverdue: true, warningDays: 14 }
        ]

        for (const dc of debtConfigs) {
            const existing = await prisma.debtConfiguration.findUnique({ where: { name: dc.name } })
            if (!existing) {
                await prisma.debtConfiguration.create({
                    data: {
                        name: dc.name,
                        maxOverdueDays: dc.maxOverdueDays,
                        creditLimitPercent: dc.creditLimitPercent,
                        autoHoldOnOverdue: dc.autoHoldOnOverdue,
                        warningDays: dc.warningDays,
                        isActive: true
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Contractor account created successfully!',
            credentials: {
                email: 'contractor@test.com',
                password: 'contractor123'
            },
            customer: {
                id: customer.id,
                companyName: 'Công ty TNHH Xây dựng Hoàng Phát',
                taxId: '0123456789',
                creditLimit: 100000000,
                currentDebt: 45000000
            }
        })

    } catch (error: any) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
