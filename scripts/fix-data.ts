import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixData() {
  try {
    console.log('🔧 Starting data fixes...')

    // 1. Fix products with missing prices
    const products = await prisma.product.findMany()
    for (const product of products) {
      if (!product.price || product.price === 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            price: Math.floor(Math.random() * 500000) + 50000 // Random price between 50k-550k
          }
        })
      }
    }
    console.log('✅ Fixed product prices')

    // 2. Fix inventory items with missing data
    const inventoryItems = await prisma.inventoryItem.findMany()
    for (const item of inventoryItems) {
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          availableQuantity: item.availableQuantity || 100,
          minStockLevel: item.minStockLevel || 20,
          maxStockLevel: item.maxStockLevel || 500,
          reorderPoint: item.reorderPoint || 30
        }
      })
    }
    console.log('✅ Fixed inventory items')

    // 3. Reviews will be added later (model not in schema yet)
    console.log('⏭️  Skipped reviews (model not available)')

    // 4. Update suppliers with missing data
    const suppliers = await prisma.supplier.findMany()
    for (const supplier of suppliers) {
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          creditLimit: supplier.creditLimit || 50000000,
          currentBalance: supplier.currentBalance || 0,
          rating: supplier.rating || 4.5
        }
      })
    }
    console.log('✅ Fixed supplier data')

    // 5. Fix work shifts with invalid dates
    const shifts = await prisma.workShift.findMany()
    const now = new Date()
    for (const shift of shifts) {
      const shiftDate = new Date(shift.date)
      if (isNaN(shiftDate.getTime())) {
        // Invalid date, fix it
        await prisma.workShift.update({
          where: { id: shift.id },
          data: {
            date: new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1)
          }
        })
      }
    }
    console.log('✅ Fixed work shift dates')

    // 6. Create sample invoices for better sales data
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      take: 10,
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })

    for (const order of orders) {
      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: { orderId: order.id }
      })

      if (!existingInvoice) {
        const items = order.orderItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))

        await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            orderId: order.id,
            type: 'PURCHASE' as any,
            items: items,
            subtotal: order.totalAmount - order.shippingAmount,
            tax: (order.totalAmount - order.shippingAmount) * 0.1,
            discount: 0,
            totalAmount: order.totalAmount,
            status: 'PAID',
            paymentMethod: order.paymentMethod,
            paymentDate: order.createdAt,
            notes: 'Hóa đơn tự động tạo từ đơn hàng'
          }
        })
      }
    }
    console.log('✅ Created sample invoices')

    // 7. Update payroll records to avoid duplicates
    await prisma.payrollRecord.deleteMany({
      where: {
        period: new Date().toISOString().slice(0, 7)
      }
    })

    const employees = await prisma.employee.findMany()
    for (const emp of employees) {
      await prisma.payrollRecord.create({
        data: {
          employeeId: emp.id,
          period: new Date().toISOString().slice(0, 7),
          baseSalary: emp.baseSalary,
          bonuses: Math.random() * 1000000,
          penalties: 0,
          overtime: 0,
          totalAdvances: 0,
          grossPay: emp.baseSalary + (Math.random() * 1000000),
          taxDeductions: emp.baseSalary * 0.1,
          otherDeductions: 0,
          netPay: emp.baseSalary * 0.9 + (Math.random() * 1000000),
          hoursWorked: 176,
          overtimeHours: 0,
          isPaid: false
        }
      })
    }
    console.log('✅ Fixed payroll records')

    console.log('🎉 Data fixes completed!')
  } catch (error) {
    console.error('❌ Error fixing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixData()
