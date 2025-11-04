import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addMoreData() {
  try {
    console.log('📦 Adding more sample data...')

    // Get existing categories
    const categories = await prisma.category.findMany()
    if (categories.length === 0) {
      console.log('❌ No categories found. Run seed first.')
      return
    }

    // 1. Add more products
    const productNames = [
      { name: 'Xi măng Hà Tiên PCB40', category: 'Xi măng & Bê tông', price: 1350000, unit: 'tấn' },
      { name: 'Xi măng Insee PCB40', category: 'Xi măng & Bê tông', price: 1380000, unit: 'tấn' },
      { name: 'Gạch lát nền 60×60', category: 'Gạch & Ốp lát', price: 420000, unit: 'm²' },
      { name: 'Gạch ốp tường 30×60', category: 'Gạch & Ốp lát', price: 380000, unit: 'm²' },
      { name: 'Thép cây CB240-T Đ10', category: 'Thép xây dựng', price: 14500, unit: 'kg' },
      { name: 'Ống nước PPR PN16 D25', category: 'Điện & Nước', price: 35000, unit: 'm' },
      { name: 'Ống nước PPR PN16 D32', category: 'Điện & Nước', price: 58000, unit: 'm' },
      { name: 'Sơn nước Dulux Inspire', category: 'Sơn & Hóa chất', price: 680000, unit: 'thùng 5L' },
      { name: 'Sơn dầu Dulux 18L', category: 'Sơn & Hóa chất', price: 2200000, unit: 'thùng' },
    ]

    for (const prod of productNames) {
      const category = categories.find(c => c.name.includes(prod.category.split('&')[0].trim()))
      if (!category) continue

      const existing = await prisma.product.findFirst({
        where: { name: prod.name }
      })

      if (!existing) {
        const product = await prisma.product.create({
          data: {
            name: prod.name,
            sku: `${prod.category.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            categoryId: category.id,
            price: prod.price,
            unit: prod.unit,
            description: `${prod.name} chất lượng cao, phù hợp cho công trình xây dựng`,
            isActive: true
          }
        })

        // Create inventory for product
        await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            quantity: Math.floor(Math.random() * 200) + 50,
            availableQuantity: Math.floor(Math.random() * 200) + 50,
            reservedQuantity: 0,
            minStockLevel: 30,
            maxStockLevel: 500,
            reorderPoint: 40,
            lastStockDate: new Date(),
            lastCountDate: new Date()
          }
        })
      }
    }
    console.log('✅ Added more products')

    // 2. Add more customers
    const customerEmails = [
      'thanhtai6012004@gmail.com',
      'customer2@test.com',
      'customer3@test.com',
      'customer4@test.com',
      'customer5@test.com',
    ]

    const hashedPassword = await bcrypt.hash('customer123', 12)

    for (let i = 0; i < customerEmails.length; i++) {
      const email = customerEmails[i]
      const existing = await prisma.user.findUnique({ where: { email } })

      if (!existing) {
        const user = await prisma.user.create({
          data: {
            email,
            name: `Nguyễn Thành Tài`,
            password: hashedPassword,
            role: 'CUSTOMER',
            phone: `0918180969`,
            address: `${100 + i} Đường ABC, Quận ${i + 1}, TP.HCM`
          }
        })

        await prisma.customer.create({
          data: {
            userId: user.id,
            loyaltyPoints: Math.floor(Math.random() * 1000)
          }
        })
      }
    }
    console.log('✅ Added more customers')

    // 3. Create more orders
    const customers = await prisma.customer.findMany({
      include: { user: true }
    })
    
    const products = await prisma.product.findMany({
      take: 10
    })

    if (customers.length > 0 && products.length > 0) {
      for (let i = 0; i < 15; i++) {
        const customer = customers[i % customers.length]
        const numItems = Math.floor(Math.random() * 3) + 1
        const orderItems = []
        let totalAmount = 0

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)]
          const quantity = Math.floor(Math.random() * 5) + 1
          const itemTotal = product.price * quantity
          
          orderItems.push({
            productId: product.id,
            quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            discount: 0
          })
          
          totalAmount += itemTotal
        }

        const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            customerId: customer.id,
            customerType: 'REGISTERED',
            status: status as any,
            totalAmount,
            shippingAmount: 50000,
            netAmount: totalAmount + 50000,
            taxAmount: 0,
            discountAmount: 0,
            paymentMethod: ['CASH', 'BANK_TRANSFER', 'E_WALLET'][Math.floor(Math.random() * 3)],
            paymentStatus: status === 'DELIVERED' ? 'PAID' : 'PENDING',
            paymentType: 'FULL',
            shippingAddress: {
              address: customer.user.address || 'Địa chỉ mặc định',
              city: 'TP.HCM'
            },
            orderItems: {
              create: orderItems
            }
          }
        })
      }
      console.log('✅ Created more orders')
    }

    console.log('🎉 Successfully added more data!')
  } catch (error) {
    console.error('❌ Error adding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMoreData()
