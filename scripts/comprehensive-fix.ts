import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function comprehensiveFix() {
  try {
    console.log('🔧 Starting comprehensive data fix...\n')

    // 1. Fix Suppliers - add contactPerson
    console.log('1️⃣ Fixing Suppliers...')
    const suppliers = await prisma.supplier.findMany()
    const contactNames = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D']
    
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i]
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          contactPerson: supplier.contactPerson || contactNames[i % contactNames.length],
          email: supplier.email || `contact${i + 1}@${supplier.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: supplier.phone || `028${Math.floor(Math.random() * 90000000 + 10000000)}`,
          address: supplier.address || `${100 + i} Đường XYZ`,
          city: supplier.city || ['Kiên Giang, Việt Nam', 'Đồng Nai, Việt Nam', 'Hà Nội, Việt Nam'][i % 3],
          creditLimit: supplier.creditLimit || 50000000,
          currentBalance: 0,
          rating: supplier.rating || 4.5
        }
      })
    }
    console.log(`✅ Fixed ${suppliers.length} suppliers\n`)

    // 2. Fix Customers - update user status and ensure proper data
    console.log('2️⃣ Fixing Customers...')
    const customers = await prisma.customer.findMany({
      include: {
        user: true,
        _count: {
          select: { orders: true }
        }
      }
    })
    
    for (const customer of customers) {
      // Update customer data
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: customer.loyaltyPoints || 0,
          totalPurchases: customer.totalPurchases || 0,
          customerType: customer.customerType || 'REGULAR'
        }
      })

      // Update user status based on activity
      const isActive = customer._count.orders > 0
      await prisma.user.update({
        where: { id: customer.userId },
        data: {
          isActive: isActive,
          phone: customer.user.phone || `09${Math.floor(Math.random() * 900000000 + 100000000)}`,
          address: customer.user.address || `Địa chỉ khách hàng ${customer.id.substring(0, 8)}`
        }
      })
    }
    console.log(`✅ Fixed ${customers.length} customers\n`)

    // 3. Fix Inventory Items - ensure all have proper data
    console.log('3️⃣ Fixing Inventory Items...')
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: { product: true }
    })
    
    for (const item of inventoryItems) {
      const quantity = Math.floor(Math.random() * 200) + 50
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: item.quantity || quantity,
          availableQuantity: item.availableQuantity || quantity,
          reservedQuantity: item.reservedQuantity || 0,
          minStockLevel: item.minStockLevel || 30,
          maxStockLevel: item.maxStockLevel || 500,
          reorderPoint: item.reorderPoint || 40,
          lastStockDate: item.lastStockDate || new Date(),
          lastCountDate: item.lastCountDate || new Date(),
          location: item.location || `Kho A - Kệ ${Math.floor(Math.random() * 20) + 1}`
        }
      })
    }
    console.log(`✅ Fixed ${inventoryItems.length} inventory items\n`)

    // 4. Create Review model data (if model exists)
    console.log('4️⃣ Creating Product Reviews...')
    try {
      // Check if we have reviews table
      const existingReviews = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "product_reviews" LIMIT 1`
      
      const products = await prisma.product.findMany({
        take: 10,
        where: { isActive: true }
      })

      const reviewCustomers = await prisma.customer.findMany({
        take: 5,
        include: { user: true }
      })

      if (products.length > 0 && reviewCustomers.length > 0) {
        const reviewComments = [
          'Sản phẩm chất lượng tốt, đóng gói cẩn thận',
          'Giao hàng nhanh, sản phẩm đúng mô tả',
          'Giá cả hợp lý, sẽ mua lại',
          'Chất lượng tuyệt vời, rất hài lòng',
          'Sản phẩm ok, phù hợp với công trình',
        ]

        for (let i = 0; i < 15; i++) {
          const customer = reviewCustomers[i % reviewCustomers.length]
          const product = products[i % products.length]
          const rating = Math.floor(Math.random() * 2) + 4 // 4-5 stars

          await prisma.$executeRaw`
            INSERT INTO "product_reviews" (id, "userId", "productId", rating, comment, "isVerifiedPurchase", "helpfulCount", "createdAt", "updatedAt")
            VALUES (
              ${`review-${Date.now()}-${i}`,
              customer.userId,
              product.id,
              rating,
              reviewComments[i % reviewComments.length],
              true,
              Math.floor(Math.random() * 10),
              NOW(),
              NOW()
            })
            ON CONFLICT (id) DO NOTHING
          `
        }
        console.log('✅ Created product reviews\n')
      }
    } catch (error) {
      console.log('⏭️  Skipped reviews (table may not exist)\n')
    }

    // 5. Fix Sales Management - ensure invoices have proper customer/supplier data
    console.log('5️⃣ Fixing Sales Management / Invoices...')
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            customer: {
              include: { user: true }
            }
          }
        }
      }
    })

    for (const invoice of invoices) {
      if (invoice.order?.customer) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            invoiceType: invoice.invoiceType || 'SALES',
            paidAmount: invoice.paidAmount || (invoice.order.status === 'DELIVERED' ? invoice.totalAmount : 0),
            balanceAmount: invoice.balanceAmount || (invoice.order.status === 'DELIVERED' ? 0 : invoice.totalAmount),
            paymentTerms: invoice.paymentTerms || 'Thanh toán khi nhận hàng'
          }
        })
      }
    }
    console.log(`✅ Fixed ${invoices.length} invoices\n`)

    // 6. Create more orders if needed
    console.log('6️⃣ Creating additional orders...')
    const orderCount = await prisma.order.count()
    
    if (orderCount < 20) {
      const allCustomers = await prisma.customer.findMany({
        include: { user: true }
      })
      const allProducts = await prisma.product.findMany()

      for (let i = 0; i < 10; i++) {
        const customer = allCustomers[i % allCustomers.length]
        const numItems = Math.floor(Math.random() * 3) + 1
        const orderItems = []
        let totalAmount = 0

        for (let j = 0; j < numItems; j++) {
          const product = allProducts[Math.floor(Math.random() * allProducts.length)]
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
      console.log('✅ Created additional orders\n')
    } else {
      console.log('✅ Order count is sufficient\n')
    }

    // 7. Update statistics
    console.log('7️⃣ Updating statistics...')
    const stats = {
      products: await prisma.product.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
      suppliers: await prisma.supplier.count(),
      inventory: await prisma.inventoryItem.count(),
      invoices: await prisma.invoice.count()
    }

    console.log('\n📊 Current Database Statistics:')
    console.log(`   Products: ${stats.products}`)
    console.log(`   Customers: ${stats.customers}`)
    console.log(`   Orders: ${stats.orders}`)
    console.log(`   Suppliers: ${stats.suppliers}`)
    console.log(`   Inventory Items: ${stats.inventory}`)
    console.log(`   Invoices: ${stats.invoices}`)

    console.log('\n🎉 Comprehensive data fix completed!')
  } catch (error) {
    console.error('❌ Error fixing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

comprehensiveFix()
