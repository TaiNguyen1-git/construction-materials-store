import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n')

    const [products, suppliers, employees, customers, orders, invoices] = await Promise.all([
      prisma.product.count(),
      prisma.supplier.count(),
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.invoice.count()
    ])

    console.log('📊 Database Summary:')
    console.log(`   - Products: ${products}`)
    console.log(`   - Suppliers: ${suppliers}`)
    console.log(`   - Employees: ${employees}`)
    console.log(`   - Customers: ${customers}`)
    console.log(`   - Orders: ${orders}`)
    console.log(`   - Invoices: ${invoices}`)
    console.log('')

    // Get sample data
    console.log('📦 Sample Products:')
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: {
        category: true,
        inventoryItem: true
      }
    })
    sampleProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.sku}) - Price: ${p.price}, Stock: ${p.inventoryItem?.quantity || 0}`)
    })
    console.log('')

    console.log('🏢 Sample Suppliers:')
    const sampleSuppliers = await prisma.supplier.findMany({ take: 3 })
    sampleSuppliers.forEach(s => {
      console.log(`   - ${s.name} - Email: ${s.email}, Phone: ${s.phone}`)
    })
    console.log('')

    console.log('👥 Sample Employees:')
    const sampleEmployees = await prisma.employee.findMany({
      take: 5,
      include: { user: true }
    })
    sampleEmployees.forEach(e => {
      console.log(`   - ${e.user.name} (${e.employeeCode}) - ${e.department} - Salary: ${e.baseSalary}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
