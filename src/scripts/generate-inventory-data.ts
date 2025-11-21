/**
 * Generate Sample Inventory Data
 * Creates 12 months of historical orders with realistic seasonal patterns
 */

import { PrismaClient, OrderStatus, OrderCustomerType, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Seasonal factors for construction materials (Jan-Dec)
const SEASONAL_FACTORS: Record<string, number[]> = {
    // Xi măng: High demand in summer (construction peak), low in winter
    'xi măng': [0.7, 0.8, 1.0, 1.2, 1.4, 1.5, 1.6, 1.5, 1.3, 1.1, 0.9, 0.8],
    'cement': [0.7, 0.8, 1.0, 1.2, 1.4, 1.5, 1.6, 1.5, 1.3, 1.1, 0.9, 0.8],

    // Cát/Đá: Steady demand with slight summer peak
    'cát': [0.9, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9],
    'đá': [0.9, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9],
    'sand': [0.9, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9],
    'stone': [0.9, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9],

    // Thép: Moderate demand with project-based spikes
    'thép': [0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.5, 1.4, 1.2, 1.0, 0.9, 0.8],
    'steel': [0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.5, 1.4, 1.2, 1.0, 0.9, 0.8],

    // Gạch: Consistent demand
    'gạch': [0.95, 0.95, 1.0, 1.05, 1.1, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95],
    'brick': [0.95, 0.95, 1.0, 1.05, 1.1, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95],

    // Default for other products
    'default': [0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.15, 1.1, 1.05, 0.95, 0.9]
}

function getSeasonalFactor(productName: string, monthIndex: number): number {
    const lowerName = productName.toLowerCase()

    for (const [key, factors] of Object.entries(SEASONAL_FACTORS)) {
        if (lowerName.includes(key)) {
            return factors[monthIndex]
        }
    }

    return SEASONAL_FACTORS.default[monthIndex]
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

async function generateHistoricalOrders() {
    console.log('🚀 Starting historical data generation...\n')

    // Get all active products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            price: true,
            unit: true
        }
    })

    if (products.length === 0) {
        console.error('❌ No products found. Please seed products first.')
        return
    }

    console.log(`✅ Found ${products.length} products\n`)

    // Get customers
    const customers = await prisma.customer.findMany({
        select: { id: true, userId: true }
    })

    if (customers.length === 0) {
        console.error('❌ No customers found. Please create customers first.')
        return
    }

    console.log(`✅ Found ${customers.length} customers\n`)

    // Generate orders for the past 12 months
    const now = new Date()
    const startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - 12)

    let totalOrders = 0
    let totalOrderItems = 0

    // Generate 500-1000 orders over 12 months
    const targetOrders = randomInt(500, 1000)
    console.log(`🎯 Target: ${targetOrders} orders over 12 months\n`)

    for (let i = 0; i < targetOrders; i++) {
        try {
            // Random date within the 12-month period
            const orderDate = new Date(
                startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
            )

            const monthIndex = orderDate.getMonth()

            // Random customer
            const customer = customers[randomInt(0, customers.length - 1)]

            // Select 1-5 random products for this order
            const numItems = randomInt(1, 5)
            const selectedProducts = []
            const usedIndices = new Set<number>()

            while (selectedProducts.length < numItems) {
                const idx = randomInt(0, products.length - 1)
                if (!usedIndices.has(idx)) {
                    usedIndices.add(idx)
                    selectedProducts.push(products[idx])
                }
            }

            // Calculate order items with seasonal factors
            const orderItems = selectedProducts.map(product => {
                const seasonalFactor = getSeasonalFactor(product.name, monthIndex)

                // Base quantity varies by product type
                let baseQuantity = 1
                if (product.unit === 'kg' || product.unit === 'tấn') {
                    baseQuantity = randomInt(50, 500) // 50-500 kg
                } else if (product.unit === 'm3') {
                    baseQuantity = randomInt(5, 50) // 5-50 m3
                } else if (product.unit === 'cái' || product.unit === 'pcs') {
                    baseQuantity = randomInt(10, 200) // 10-200 pieces
                } else {
                    baseQuantity = randomInt(1, 100)
                }

                // Apply seasonal factor
                const quantity = Math.max(1, Math.round(baseQuantity * seasonalFactor))
                const unitPrice = product.price
                const subtotal = quantity * unitPrice

                return {
                    productId: product.id,
                    quantity,
                    unitPrice,
                    totalPrice: subtotal,
                    discount: 0,
                    createdAt: orderDate
                }
            })

            const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
            const taxAmount = totalAmount * 0.1 // 10% VAT
            const shippingAmount = randomFloat(50000, 200000) // 50k-200k shipping
            const netAmount = totalAmount + taxAmount + shippingAmount

            // Create order
            await prisma.order.create({
                data: {
                    orderNumber: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
                    customerId: customer.id,
                    customerType: OrderCustomerType.REGISTERED,
                    status: OrderStatus.DELIVERED, // Historical orders are completed
                    totalAmount,
                    taxAmount,
                    shippingAmount,
                    discountAmount: 0,
                    netAmount,
                    paymentMethod: ['BANK_TRANSFER', 'CASH', 'COD'][randomInt(0, 2)],
                    paymentStatus: PaymentStatus.PAID,
                    shippingAddress: {
                        address: 'Sample Address',
                        city: 'Ho Chi Minh',
                        district: 'District 1',
                        ward: 'Ward 1'
                    },
                    notes: 'Historical data',
                    createdAt: orderDate,
                    updatedAt: orderDate,
                    actualDelivery: orderDate,
                    orderItems: {
                        create: orderItems
                    }
                }
            })

            totalOrders++
            totalOrderItems += orderItems.length

            if ((i + 1) % 50 === 0) {
                console.log(`📦 Generated ${i + 1}/${targetOrders} orders...`)
            }

        } catch (error) {
            console.error(`❌ Error creating order ${i + 1}:`, error)
        }
    }

    console.log('\n✅ Data generation complete!')
    console.log(`📊 Summary:`)
    console.log(`   - Total Orders: ${totalOrders}`)
    console.log(`   - Total Order Items: ${totalOrderItems}`)
    console.log(`   - Average Items per Order: ${(totalOrderItems / totalOrders).toFixed(2)}`)
    console.log(`   - Date Range: ${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}`)
}

async function main() {
    try {
        await generateHistoricalOrders()
    } catch (error) {
        console.error('❌ Fatal error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
