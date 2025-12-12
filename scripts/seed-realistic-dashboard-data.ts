/**
 * Seed Realistic Dashboard Data
 * Creates data from June 2025 to December 19, 2025
 * Preserves existing data - does NOT delete anything
 * 
 * Usage: npm run db:seed:dashboard
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateVietnameseName, generatePhoneNumber, generateAddress } from './vietnamese-names'

const prisma = new PrismaClient()

// Configuration
// Use current date as base (not future date!)
// IMPORTANT: API filters by last 30 days, so we need RECENT data!
const NOW = new Date() // Current time: Dec 12, 2025
const BASE_DATE = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 23, 59, 59) // Today at end of day
const START_DATE = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1, 0, 0, 0) // 2 months ago (not 6!)
const MONTHS_OF_DATA = 2 // Reduced from 6 to ensure data is within 30-day API filter

// Helper function to generate random date between two dates
function getRandomDate(start: Date, end: Date): Date {
    const startTime = start.getTime()
    const endTime = end.getTime()
    const randomTime = startTime + Math.random() * (endTime - startTime)
    return new Date(randomTime)
}

// Helper to get date within range
function getDateInRange(daysAgo: number, baseDate: Date = BASE_DATE): Date {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - daysAgo)
    return date
}

async function main() {
    console.log('🌱 Starting Realistic Dashboard Data Seeding...')
    console.log('='.repeat(70))
    console.log(`📅 Date Range: ${START_DATE.toLocaleDateString('vi-VN')} - ${BASE_DATE.toLocaleDateString('vi-VN')}`)
    console.log('⚠️  NO DATA WILL BE DELETED - Only adding new data')
    console.log('='.repeat(70))

    // 1. Ensure Admin User Exists
    console.log('\n👤 Checking admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)

    let adminUser = await prisma.user.findUnique({
        where: { email: 'admin@smartbuild.vn' }
    })

    if (!adminUser) {
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@smartbuild.vn',
                name: 'Admin',
                password: hashedPassword,
                role: 'MANAGER',
                phone: '0901234567',
                address: 'TP. Biên Hòa, Đồng Nai',
                isActive: true
            }
        })

        await prisma.employee.create({
            data: {
                userId: adminUser.id,
                employeeCode: 'EMP001',
                department: 'Quản lý',
                position: 'Giám đốc',
                baseSalary: 20000000,
                hireDate: new Date('2025-01-01'),
                isActive: true
            }
        })
        console.log('✅ Created admin user: admin@smartbuild.vn / admin123')
    } else {
        console.log('✅ Admin user already exists')
    }

    // 2. Create/Ensure Categories
    console.log('\n📦 Setting up categories...')
    const categoryData = [
        { name: 'Xi măng', description: 'Xi măng các loại PC30, PC40, PCB40' },
        { name: 'Gạch', description: 'Gạch đinh, gạch ống các loại' },
        { name: 'Đá', description: 'Đá 1x2, đá mi, đá xây dựng' },
        { name: 'Cát', description: 'Cát xây dựng, cát vàng' },
        { name: 'Thép', description: 'Thép xây dựng các loại' },
        { name: 'Sơn', description: 'Sơn nước, sơn dầu, bột trét' }
    ]

    const categories = []
    for (const catData of categoryData) {
        let category = await prisma.category.findFirst({
            where: { name: catData.name }
        })

        if (!category) {
            category = await prisma.category.create({
                data: { ...catData, isActive: true }
            })
            console.log(`  ✅ Created category: ${category.name}`)
        } else {
            console.log(`  ⏭️  Category exists: ${category.name}`)
        }
        categories.push(category)
    }

    // 3. Create/Ensure Suppliers
    console.log('\n🏢 Setting up suppliers...')
    const supplierData = [
        {
            name: 'Vật Liệu Xây Dựng Số 88',
            email: 'vatlieu88@gmail.com',
            phone: '0941 96 60 60',
            address: '317 Nguyễn Phúc Chu, P.Trảng Dài, Tp.Biên Hòa, Đồng Nai',
            contactPerson: 'Mr. Bình'
        },
        {
            name: 'Công Ty Xi Măng Hà Tiên',
            email: 'info@hatiencement.com',
            phone: '0281-3888-888',
            address: 'Kiên Giang, Việt Nam',
            contactPerson: 'Phòng Kinh Doanh'
        },
        {
            name: 'Gạch Đồng Tâm',
            email: 'info@dongtam.vn',
            phone: '0251-3500-888',
            address: 'Đồng Nai, Việt Nam',
            contactPerson: 'Phòng Bán Hàng'
        },
        {
            name: 'Vật Liệu Xây Dựng Thái Bình Dương',
            email: 'thaibinhduong.vlxd@gmail.com',
            phone: '0964 999 154',
            address: '1423/271 KP Vườn Dừa, P. Phước Tân, TP. Biên Hòa, Đồng Nai',
            contactPerson: 'Mr. Phát'
        }
    ]

    const suppliers = []
    for (const suppData of supplierData) {
        let supplier = await prisma.supplier.findFirst({
            where: { email: suppData.email }
        })

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: { ...suppData, isActive: true }
            })
            console.log(`  ✅ Created supplier: ${supplier.name}`)
        } else {
            console.log(`  ⏭️  Supplier exists: ${supplier.name}`)
        }
        suppliers.push(supplier)
    }

    // 4. Create/Ensure Products with Inventory
    console.log('\n🛍️  Setting up products...')
    const productData = [
        {
            name: 'Xi măng INSEE PC30',
            categoryName: 'Xi măng',
            sku: 'XM-INSEE-PC30',
            description: 'Xi măng Portland PC30 của INSEE, phù hợp cho xây tô, vữa trát, các công trình dân dụng thông thường',
            price: 120000,
            unit: 'bao 50kg',
            inventory: { available: 500, min: 50, reorder: 100 }
        },
        {
            name: 'Xi măng INSEE PC40',
            categoryName: 'Xi măng',
            sku: 'XM-INSEE-PC40',
            description: 'Xi măng Portland hỗn hợp PCB40 của INSEE, chất lượng cao, độ bền tốt',
            price: 135000,
            unit: 'bao 50kg',
            inventory: { available: 800, min: 100, reorder: 150 }
        },
        {
            name: 'Xi măng Hà Tiên PC30',
            categoryName: 'Xi măng',
            sku: 'XM-HATIEN-PC30',
            description: 'Xi măng Portland PC30 của Hà Tiên, dùng cho xây tô, giá thành hợp lý',
            price: 110000,
            unit: 'bao 50kg',
            inventory: { available: 600, min: 80, reorder: 120 }
        },
        {
            name: 'Gạch Đinh 8x8x18cm',
            categoryName: 'Gạch',
            sku: 'GACH-DINH-8X8X18',
            description: 'Gạch đinh (gạch 4 lỗ) kích thước 8x8x18cm',
            price: 2200,
            unit: 'viên',
            inventory: { available: 10000, min: 1000, reorder: 2000 }
        },
        {
            name: 'Gạch Ống đỏ 6x10x20cm',
            categoryName: 'Gạch',
            sku: 'GACH-ONG-6X10X20',
            description: 'Gạch ống đỏ truyền thống, có lỗ rỗng bên trong',
            price: 2800,
            unit: 'viên',
            inventory: { available: 8000, min: 800, reorder: 1500 }
        },
        {
            name: 'Đá 1x2 (10-20mm)',
            categoryName: 'Đá',
            sku: 'DA-1X2',
            description: 'Đá dăm cỡ 1x2 (10-20mm), dùng để trộn bê tông',
            price: 420000,
            unit: 'm³',
            inventory: { available: 50, min: 5, reorder: 10 }
        },
        {
            name: 'Đá mi (5-7mm)',
            categoryName: 'Đá',
            sku: 'DA-MI',
            description: 'Đá dăm cỡ nhỏ 5-7mm, dùng trộn bê tông mác thấp',
            price: 380000,
            unit: 'm³',
            inventory: { available: 40, min: 4, reorder: 8 }
        },
        {
            name: 'Cát xây dựng loại I',
            categoryName: 'Cát',
            sku: 'CAT-XD-I',
            description: 'Cát xây dựng sạch, hạt to đều',
            price: 380000,
            unit: 'm³',
            inventory: { available: 60, min: 6, reorder: 12 }
        },
        {
            name: 'Cát vàng',
            categoryName: 'Cát',
            sku: 'CAT-VANG',
            description: 'Cát vàng hạt mịn, dùng để xây gạch, trát tường',
            price: 320000,
            unit: 'm³',
            inventory: { available: 45, min: 5, reorder: 10 }
        },
        {
            name: 'Thép D10',
            categoryName: 'Thép',
            sku: 'THEP-D10',
            description: 'Thép tròn trơn phi 10, dài 11.7m',
            price: 185000,
            unit: 'cây',
            inventory: { available: 300, min: 50, reorder: 100 }
        }
    ]

    const products = []
    for (const prodData of productData) {
        const category = categories.find(c => c.name === prodData.categoryName)
        if (!category) continue

        let product = await prisma.product.findUnique({
            where: { sku: prodData.sku }
        })

        if (!product) {
            product = await prisma.product.create({
                data: {
                    name: prodData.name,
                    categoryId: category.id,
                    sku: prodData.sku,
                    description: prodData.description,
                    price: prodData.price,
                    unit: prodData.unit,
                    images: [],
                    isActive: true,
                    inventoryItem: {
                        create: {
                            availableQuantity: prodData.inventory.available,
                            reservedQuantity: 0,
                            reorderPoint: prodData.inventory.reorder,
                            minStockLevel: prodData.inventory.min
                        }
                    }
                }
            })
            console.log(`  ✅ Created product: ${product.name}`)
        } else {
            console.log(`  ⏭️  Product exists: ${product.name}`)
        }
        products.push(product)
    }

    // 5. Create Customer Users (if needed)
    console.log('\n👥 Creating customers...')
    let customerCount = 0
    const targetCustomers = 40
    const existingCustomers = await prisma.customer.count()

    if (existingCustomers < targetCustomers) {
        const customersToCreate = targetCustomers - existingCustomers

        for (let i = 1; i <= customersToCreate; i++) {
            const gender = Math.random() > 0.5 ? 'male' : 'female'
            const name = generateVietnameseName(gender)
            const email = `${name.toLowerCase().replace(/ /g, '.')}${i}@example.com`

            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: 'CUSTOMER',
                    phone: generatePhoneNumber(),
                    address: generateAddress(),
                    isActive: true
                }
            })

            await prisma.customer.create({
                data: {
                    userId: user.id,
                    customerType: i <= 5 ? 'VIP' : 'REGULAR',
                    totalPurchases: 0,
                    loyaltyPoints: Math.floor(Math.random() * 1000),
                    creditLimit: 50000000,
                    currentBalance: 0,
                    loyaltyTier: i <= 3 ? 'GOLD' : (i <= 10 ? 'SILVER' : 'BRONZE'),
                    referralCode: `REF${Date.now()}-${i}`
                }
            })

            customerCount++
        }
        console.log(`✅ Created ${customerCount} new customers (total: ${existingCustomers + customerCount})`)
    } else {
        console.log(`✅ Already have ${existingCustomers} customers (target: ${targetCustomers})`)
    }

    // 6. Create Orders with realistic dates
    console.log('\n📦 Creating orders...')
    const customers = await prisma.customer.findMany({
        include: { user: true }
    })

    let orderCount = 0
    const targetOrders = 120
    const existingOrders = await prisma.order.count({
        where: {
            createdAt: { gte: START_DATE, lte: BASE_DATE }
        }
    })

    if (existingOrders < targetOrders) {
        const ordersToCreate = targetOrders - existingOrders

        for (let i = 0; i < ordersToCreate; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)]
            const orderDate = getRandomDate(START_DATE, BASE_DATE)

            // Determine status based on how old the order is
            // IMPORTANT: Most orders should be DELIVERED for charts to show data!
            const daysAgo = Math.floor((BASE_DATE.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
            let status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

            if (daysAgo > 14) {
                // Orders older than 2 weeks are mostly delivered (90%)
                status = Math.random() > 0.1 ? 'DELIVERED' : 'SHIPPED'
            } else if (daysAgo > 7) {
                // Orders 1-2 weeks old: 70% delivered, 20% shipped, 10% confirmed
                const rand = Math.random()
                status = rand > 0.3 ? 'DELIVERED' : (rand > 0.1 ? 'SHIPPED' : 'CONFIRMED')
            } else if (daysAgo > 3) {
                // Orders 3-7 days old: 50% delivered, 30% shipped, 20% confirmed
                const rand = Math.random()
                status = rand > 0.5 ? 'DELIVERED' : (rand > 0.2 ? 'SHIPPED' : 'CONFIRMED')
            } else {
                // Recent orders (last 3 days): mix including pending
                const rand = Math.random()
                status = rand > 0.5 ? 'DELIVERED' : (rand > 0.3 ? 'SHIPPED' : (rand > 0.15 ? 'CONFIRMED' : 'PENDING'))
            }

            // Random 2-4 products per order
            const numProducts = Math.floor(Math.random() * 3) + 2
            const orderProducts = []
            let totalAmount = 0

            for (let j = 0; j < numProducts; j++) {
                const product = products[Math.floor(Math.random() * products.length)]
                const quantity = Math.floor(Math.random() * 15) + 1
                const price = product.price * quantity
                totalAmount += price

                orderProducts.push({
                    productId: product.id,
                    quantity,
                    unitPrice: product.price,
                    totalPrice: price
                })
            }

            const taxAmount = totalAmount * 0.1
            const netAmount = totalAmount + taxAmount

            // Generate unique order number using timestamp to avoid duplicates
            const orderNumber = `ORD-2025-${Date.now()}-${Math.floor(Math.random() * 1000)}`

            await prisma.order.create({
                data: {
                    orderNumber,
                    customerId: customer.id,
                    customerType: 'REGISTERED',
                    status,
                    totalAmount,
                    taxAmount,
                    shippingAmount: 0,
                    discountAmount: 0,
                    netAmount,
                    paymentMethod: Math.random() > 0.3 ? 'CASH' : 'BANK_TRANSFER',
                    paymentStatus: ['DELIVERED', 'SHIPPED'].includes(status) ? 'PAID' : 'PENDING',
                    shippingAddress: {
                        address: customer.user.address || 'TP. Biên Hòa, Đồng Nài',
                        phone: customer.user.phone || '',
                        name: customer.user.name
                    },
                    createdAt: orderDate,
                    updatedAt: orderDate,
                    orderItems: {
                        create: orderProducts
                    }
                }
            })

            orderCount++

            if (orderCount % 20 === 0) {
                console.log(`  Progress: ${orderCount}/${ordersToCreate} orders created...`)
            }
        }
        console.log(`✅ Created ${orderCount} new orders (total: ${existingOrders + orderCount})`)
    } else {
        console.log(`✅ Already have ${existingOrders} orders in date range (target: ${targetOrders})`)
    }

    // 7. Create Employee Data
    console.log('\n👨‍💼 Setting up employee data...')
    const employees = await prisma.employee.findMany({
        include: { user: true }
    })

    if (employees.length === 0) {
        console.log('  ⚠️  No employees found. Creating sample employees...')

        // Create 3 sample employees
        const employeeNames = [
            { name: generateVietnameseName('male'), dept: 'Kho vận', pos: 'Thủ kho' },
            { name: generateVietnameseName('female'), dept: 'Bán hàng', pos: 'Nhân viên bán hàng' },
            { name: generateVietnameseName('male'), dept: 'Kế toán', pos: 'Kế toán viên' }
        ]

        for (let i = 0; i < 3; i++) {
            const empData = employeeNames[i]
            const user = await prisma.user.create({
                data: {
                    email: `${empData.name.toLowerCase().replace(/ /g, '.')}@smartbuild.vn`,
                    name: empData.name,
                    password: hashedPassword,
                    role: 'EMPLOYEE',
                    phone: generatePhoneNumber(),
                    address: generateAddress(),
                    isActive: true
                }
            })

            await prisma.employee.create({
                data: {
                    userId: user.id,
                    employeeCode: `EMP00${i + 2}`,
                    department: empData.dept,
                    position: empData.pos,
                    baseSalary: 8000000 + (i * 1000000),
                    hireDate: new Date('2025-01-01'),
                    isActive: true
                }
            })
        }
        console.log('  ✅ Created 3 sample employees')
    }

    // Refresh employees list
    const allEmployees = await prisma.employee.findMany({
        include: { user: true }
    })

    // 8. Create Employee Tasks
    console.log('\n✏️  Creating employee tasks...')

    const taskTitles = [
        'Kiểm tra tồn kho',
        'Nhập hàng mới',
        'Xử lý đơn hàng',
        'Chăm sóc khách hàng',
        'Báo cáo doanh thu',
        'Kiểm tra chất lượng sản phẩm',
        'Cập nhật danh mục sản phẩm',
        'Xử lý khiếu nại'
    ]

    let taskCount = 0
    for (const employee of allEmployees) {
        const numTasks = Math.floor(Math.random() * 6) + 5 // 5-10 tasks per employee

        for (let i = 0; i < numTasks; i++) {
            const dueDate = getRandomDate(START_DATE, BASE_DATE)
            const createdDate = getDateInRange(Math.floor(Math.random() * 30) + 5, dueDate)

            const statuses = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'PENDING']
            const status = statuses[Math.floor(Math.random() * statuses.length)]

            await prisma.employeeTask.create({
                data: {
                    employeeId: employee.id,
                    title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
                    description: `Task được giao cho ${employee.user.name}`,
                    taskType: 'GENERAL',
                    status: status as any,
                    priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
                    dueDate,
                    estimatedHours: Math.floor(Math.random() * 8) + 1,
                    actualHours: status === 'COMPLETED' ? Math.floor(Math.random() * 8) + 1 : null,
                    completedAt: status === 'COMPLETED' ? dueDate : null,
                    createdAt: createdDate
                }
            })
            taskCount++
        }
    }
    console.log(`✅ Created ${taskCount} employee tasks`)

    // 9. Create Work Shifts
    console.log('\n🕐 Creating work shifts...')
    let shiftCount = 0

    // Create shifts from START_DATE to BASE_DATE
    const currentDate = new Date(START_DATE)

    while (currentDate <= BASE_DATE) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            for (const employee of allEmployees) {
                const shiftDate = new Date(currentDate)

                // Check if shift exists
                const existing = await prisma.workShift.findFirst({
                    where: {
                        employeeId: employee.id,
                        date: {
                            gte: new Date(shiftDate.setHours(0, 0, 0, 0)),
                            lt: new Date(shiftDate.setHours(23, 59, 59, 999))
                        }
                    }
                })

                if (!existing) {
                    await prisma.workShift.create({
                        data: {
                            employeeId: employee.id,
                            date: new Date(currentDate),
                            startTime: '08:00',
                            endTime: '17:00',
                            shiftType: 'REGULAR',
                            status: currentDate < new Date() ? 'COMPLETED' : 'SCHEDULED',
                            clockIn: currentDate < new Date() ? new Date(currentDate.setHours(8, Math.floor(Math.random() * 15), 0)) : null,
                            clockOut: currentDate < new Date() ? new Date(currentDate.setHours(17, Math.floor(Math.random() * 15), 0)) : null,
                            breakTime: 60,
                            overtime: 0
                        }
                    })
                    shiftCount++
                }
            }
        }
        currentDate.setDate(currentDate.getDate() + 1)
    }
    console.log(`✅ Created ${shiftCount} work shifts`)

    // 10. Create Payroll Records
    console.log('\n💰 Creating payroll records...')
    let payrollCount = 0

    for (let monthOffset = 0; monthOffset < MONTHS_OF_DATA; monthOffset++) {
        const payrollDate = new Date(2025, 11 - monthOffset, 1) // Start from December 2025
        const period = `${payrollDate.getFullYear()}-${String(payrollDate.getMonth() + 1).padStart(2, '0')}`

        for (const employee of allEmployees) {
            const existing = await prisma.payrollRecord.findUnique({
                where: {
                    employeeId_period: {
                        employeeId: employee.id,
                        period
                    }
                }
            })

            if (!existing) {
                const baseSalary = employee.baseSalary || 8000000
                const bonuses = monthOffset === 0 ? Math.floor(Math.random() * 2000000) : 0
                const grossPay = baseSalary + bonuses
                const taxDeductions = grossPay * 0.1
                const netPay = grossPay - taxDeductions

                await prisma.payrollRecord.create({
                    data: {
                        employeeId: employee.id,
                        period,
                        baseSalary,
                        bonuses,
                        penalties: 0,
                        overtime: 0,
                        totalAdvances: 0,
                        grossPay,
                        taxDeductions,
                        otherDeductions: 0,
                        netPay,
                        hoursWorked: 176,
                        overtimeHours: 0,
                        isPaid: monthOffset > 0,
                        paidAt: monthOffset > 0 ? new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 28) : null
                    }
                })
                payrollCount++
            }
        }
    }
    console.log(`✅ Created ${payrollCount} payroll records`)

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('✅ Dashboard Data Seeding Completed!')
    console.log('='.repeat(70))
    console.log('\n📊 Summary:')
    console.log(`   - Date Range: ${START_DATE.toLocaleDateString('vi-VN')} - ${BASE_DATE.toLocaleDateString('vi-VN')}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Suppliers: ${suppliers.length}`)
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Customers: ${customers.length}`)
    console.log(`   - Orders created: ${orderCount} (existing: ${existingOrders})`)
    console.log(`   - Employee Tasks: ${taskCount}`)
    console.log(`   - Work Shifts: ${shiftCount}`)
    console.log(`   - Payroll Records: ${payrollCount}`)
    console.log('\n🚀 You can now check the dashboard at: http://localhost:3000/admin')
    console.log('   Login: admin@smartbuild.vn / admin123')
    console.log('='.repeat(70))
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
