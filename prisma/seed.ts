import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = [
    {
      name: 'Cement & Concrete',
      description: 'Portland cement, ready-mix concrete, concrete blocks, and cement-based materials',
    },
    {
      name: 'Steel & Metal',
      description: 'Rebar, steel pipes, metal sheets, and structural steel products',
    },
    {
      name: 'Bricks & Blocks',
      description: 'Clay bricks, concrete blocks, interlocking pavers, and masonry materials',
    },
    {
      name: 'Wood & Lumber',
      description: 'Construction lumber, plywood, wooden beams, and timber products',
    },
    {
      name: 'Roofing Materials',
      description: 'Metal roofing, tiles, shingles, and waterproofing materials',
    },
    {
      name: 'Electrical Supplies',
      description: 'Wiring, switches, outlets, conduits, and electrical hardware',
    },
    {
      name: 'Plumbing Supplies',
      description: 'Pipes, fittings, valves, and plumbing fixtures',
    },
    {
      name: 'Tools & Hardware',
      description: 'Hand tools, power tools, fasteners, and construction hardware',
    },
    {
      name: 'Insulation & Drywall',
      description: 'Thermal insulation, acoustic panels, drywall, and finishing materials',
    },
    {
      name: 'Paint & Finishes',
      description: 'Interior and exterior paints, primers, stains, and finishing supplies',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@constructionstore.com' },
    update: {},
    create: {
      email: 'admin@constructionstore.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'MANAGER',
      phone: '+1234567890',
      address: '123 Construction Ave, Building City',
    },
  })

  // Create employee record for admin
  const existingAdminEmployee = await prisma.employee.findUnique({
    where: { userId: adminUser.id }
  })
  
  if (!existingAdminEmployee) {
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        employeeCode: 'EMP0001',
        department: 'Management',
        position: 'Store Manager',
        baseSalary: 20000000,
        hireDate: new Date(),
      },
    })
  }

  // Create sample products
  const cementCategory = await prisma.category.findFirst({
    where: { name: 'Cement & Concrete' }
  })

  const steelCategory = await prisma.category.findFirst({
    where: { name: 'Steel & Metal' }
  })

  if (cementCategory && steelCategory) {
    const sampleProducts = [
      {
        name: 'Portland Cement 50kg',
        description: 'High-quality Portland cement suitable for all construction needs',
        categoryId: cementCategory.id,
        sku: 'CEM-PORT-50',
        price: 8.50,
        costPrice: 6.20,
        unit: 'bag',
        weight: 50,
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Ready Mix Concrete M25',
        description: 'Ready-to-use concrete mix with 25 MPa strength',
        categoryId: cementCategory.id,
        sku: 'CON-RDY-M25',
        price: 120.00,
        costPrice: 95.00,
        unit: 'm³',
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Steel Rebar 12mm',
        description: 'High-tensile steel reinforcement bar, 12mm diameter',
        categoryId: steelCategory.id,
        sku: 'STL-RBR-12',
        price: 0.85,
        costPrice: 0.68,
        unit: 'meter',
        weight: 0.888,
        isActive: true,
        isFeatured: false,
      },
      {
        name: 'Steel Pipe 2 inch',
        description: 'Galvanized steel pipe, 2 inch diameter for plumbing',
        categoryId: steelCategory.id,
        sku: 'STL-PIPE-2',
        price: 12.50,
        costPrice: 9.80,
        unit: 'meter',
        weight: 3.63,
        isActive: true,
        isFeatured: false,
      },
    ]

    for (const product of sampleProducts) {
      const createdProduct = await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      })

      // Create inventory record for each product
      await prisma.inventoryItem.upsert({
        where: { productId: createdProduct.id },
        update: {},
        create: {
          productId: createdProduct.id,
          quantity: 100,
          availableQuantity: 100,
          minStockLevel: 10,
          maxStockLevel: 500,
          reorderPoint: 20,
        },
      })
    }
  }

  // Create suppliers
  const suppliers = [
    {
      name: 'VietCement Corporation',
      contactPerson: 'Nguyen Van A',
      email: 'contact@vietcement.com',
      phone: '+84901234567',
      address: '123 Industrial Zone',
      city: 'Hanoi',
      country: 'Vietnam',
      taxId: 'VN123456789',
      paymentTerms: 'Net 30',
      creditLimit: 100000,
      isActive: true,
    },
    {
      name: 'Steel Trading Co',
      contactPerson: 'Tran Thi B',
      email: 'sales@steeltrading.com',
      phone: '+84902345678',
      address: '456 Steel District',
      city: 'Ho Chi Minh',
      country: 'Vietnam',
      taxId: 'VN234567890',
      paymentTerms: 'Net 45',
      creditLimit: 150000,
      isActive: true,
    },
    {
      name: 'BuildMart Supplies',
      contactPerson: 'Le Van C',
      email: 'info@buildmart.vn',
      phone: '+84903456789',
      address: '789 Construction Ave',
      city: 'Da Nang',
      country: 'Vietnam',
      taxId: 'VN345678901',
      paymentTerms: 'Net 30',
      creditLimit: 80000,
      isActive: true,
    },
    {
      name: 'Hardware Heaven Ltd',
      contactPerson: 'Pham Thi D',
      email: 'sales@hardwareheaven.com',
      phone: '+84904567890',
      address: '321 Tool Street',
      city: 'Hanoi',
      country: 'Vietnam',
      taxId: 'VN456789012',
      paymentTerms: 'Net 15',
      creditLimit: 50000,
      isActive: true,
    },
  ]

  const createdSuppliers = []
  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findFirst({
      where: { name: supplier.name }
    })
    
    if (existing) {
      createdSuppliers.push(existing)
    } else {
      const created = await prisma.supplier.create({
        data: supplier
      })
      createdSuppliers.push(created)
    }
  }

  // Create customer users
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customers = []
  
  for (let i = 1; i <= 10; i++) {
    const email = `customer${i}@example.com`
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    
    let user
    if (existing) {
      user = existing
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: `Customer ${i}`,
          password: customerPassword,
          role: 'CUSTOMER',
          phone: `+8490${1000000 + i}`,
          address: `${i} Customer Street`,
        },
      })
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { userId: user.id }
    })
    
    if (!existingCustomer) {
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          customerType: i % 3 === 0 ? 'WHOLESALE' : 'REGULAR',
          loyaltyTier: ['BRONZE', 'SILVER', 'GOLD'][i % 3] as any,
          totalPurchases: Math.random() * 50000,
          loyaltyPoints: Math.floor(Math.random() * 5000),
          totalPointsEarned: Math.floor(Math.random() * 10000),
        },
      })
      customers.push(customer)
    } else {
      customers.push(existingCustomer)
    }
  }

  // Create orders and invoices with more data
  const products = await prisma.product.findMany({ take: 4 })
  
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length]
    const randomProducts = products.slice(0, Math.floor(Math.random() * 3) + 1)
    
    const orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    let totalAmount = 0
    const orderItems = randomProducts.map(product => {
      const quantity = Math.floor(Math.random() * 10) + 1
      const itemTotal = quantity * product.price
      totalAmount += itemTotal
      return {
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        discount: 0
      }
    })

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        customerId: customer.id,
        customerType: 'REGISTERED',
        status: ['PENDING', 'PROCESSING', 'DELIVERED', 'DELIVERED', 'DELIVERED'][i % 5] as any,
        totalAmount,
        taxAmount: totalAmount * 0.1,
        shippingAmount: 50000,
        discountAmount: 0,
        netAmount: totalAmount + totalAmount * 0.1 + 50000,
        shippingAddress: JSON.parse(JSON.stringify({
          street: `${i} Delivery Street`,
          city: 'Hanoi',
          district: `District ${(i % 10) + 1}`,
          zipCode: '100000'
        })),
        billingAddress: JSON.parse(JSON.stringify({
          street: `${i} Billing Street`,
          city: 'Hanoi',
          district: `District ${(i % 10) + 1}`,
          zipCode: '100000'
        })),
        paymentMethod: 'CASH',
        paymentStatus: (['PAID', 'PAID', 'PENDING'] as const)[i % 3] as any,
        createdAt: orderDate,
        orderItems: {
          create: orderItems,
        },
      },
    })

    // Create sales invoice for delivered orders
    if (['DELIVERED', 'SHIPPED'].includes(order.status as string)) {
      const invoiceItems = orderItems.map(item => ({
        productId: item.productId,
        description: products.find(p => p.id === item.productId)?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: 0,
        taxRate: 10,
        taxAmount: item.totalPrice * 0.1
      }))

      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-SALES-${Date.now()}-${i}`,
          invoiceType: 'SALES',
          orderId: order.id,
          customerId: customer.id,
          issueDate: orderDate,
          dueDate: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: ['DRAFT', 'SENT', 'PAID', 'PAID'][i % 4] as any,
          subtotal: totalAmount,
          taxAmount: totalAmount * 0.1,
          discountAmount: 0,
          totalAmount: totalAmount + totalAmount * 0.1,
          paidAmount: (i % 4 === 3) ? totalAmount + totalAmount * 0.1 : 0,
          balanceAmount: (i % 4 === 3) ? 0 : totalAmount + totalAmount * 0.1,
          paymentTerms: 'Net 30',
          invoiceItems: {
            create: invoiceItems
          }
        },
      })
    }
  }

  // Create purchase invoices from suppliers
  for (let i = 0; i < 30; i++) {
    const supplier = createdSuppliers[i % createdSuppliers.length]
    const purchaseDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    const randomProducts = products.slice(0, Math.floor(Math.random() * 3) + 1)
    
    let totalAmount = 0
    const invoiceItems = randomProducts.map(product => {
      const quantity = Math.floor(Math.random() * 50) + 10
      const unitPrice = product.costPrice || product.price * 0.7
      const itemTotal = quantity * unitPrice
      totalAmount += itemTotal
      
      return {
        productId: product.id,
        description: `Purchase ${product.name}`,
        quantity,
        unitPrice,
        totalPrice: itemTotal,
        discount: 0,
        taxRate: 10,
        taxAmount: itemTotal * 0.1
      }
    })

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-PURCHASE-${Date.now()}-${i}`,
        invoiceType: 'PURCHASE',
        supplierId: supplier.id,
        issueDate: purchaseDate,
        dueDate: new Date(purchaseDate.getTime() + 45 * 24 * 60 * 60 * 1000),
        status: ['DRAFT', 'SENT', 'PAID', 'PAID'][i % 4] as any,
        subtotal: totalAmount,
        taxAmount: totalAmount * 0.1,
        discountAmount: 0,
        totalAmount: totalAmount + totalAmount * 0.1,
        paidAmount: (i % 4 === 3) ? totalAmount + totalAmount * 0.1 : 0,
        balanceAmount: (i % 4 === 3) ? 0 : totalAmount + totalAmount * 0.1,
        paymentTerms: 'Net 45',
        invoiceItems: {
          create: invoiceItems
        }
      },
    })
  }

  // Create employees with more comprehensive data
  const employees = []
  const departments = ['Sales', 'Warehouse', 'Delivery', 'Accounting', 'IT', 'HR', 'Management']
  const positions = ['Sales Staff', 'Warehouse Staff', 'Driver', 'Accountant', 'IT Support', 'HR Manager', 'Supervisor']
  
  for (let i = 2; i <= 20; i++) {
    const email = `employee${i}@constructionstore.com`
    const existingEmpUser = await prisma.user.findUnique({
      where: { email }
    })
    
    let empUser
    if (existingEmpUser) {
      empUser = existingEmpUser
    } else {
      empUser = await prisma.user.create({
        data: {
          email,
          name: `Nhân Viên ${i}`,
          password: hashedPassword,
          role: 'EMPLOYEE',
          phone: `+8490${2000000 + i}`,
        },
      })
    }

    const deptIndex = i % departments.length
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId: empUser.id }
    })
    
    if (!existingEmployee) {
      const employee = await prisma.employee.create({
        data: {
          userId: empUser.id,
          employeeCode: `EMP${String(i).padStart(4, '0')}`,
          department: departments[deptIndex],
          position: positions[deptIndex],
          baseSalary: 5000000 + Math.random() * 10000000,
          hireDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
        },
      })
      employees.push(employee)
    } else {
      employees.push(existingEmployee)
    }
  }

  // Create work shifts (last 60 days with more variety)
  const shiftTypes = ['REGULAR', 'OVERTIME', 'LOADING', 'TRANSPORT']
  const shiftTimes = [
    { start: '08:00', end: '17:00' }, // Regular
    { start: '17:00', end: '21:00' }, // Overtime
    { start: '06:00', end: '14:00' }, // Loading
    { start: '08:00', end: '18:00' }, // Transport
  ]

  for (let day = 0; day < 60; day++) {
    const shiftDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000)
    
    for (const employee of employees.slice(0, 12)) {
      const shiftTypeIndex = Math.floor(Math.random() * shiftTypes.length)
      const times = shiftTimes[shiftTypeIndex]
      const status = day < 2 ? 'SCHEDULED' : (Math.random() > 0.05 ? 'COMPLETED' : 'CANCELLED')
      
      await prisma.workShift.create({
        data: {
          employeeId: employee.id,
          date: shiftDate,
          startTime: times.start,
          endTime: times.end,
          shiftType: shiftTypes[shiftTypeIndex] as any,
          status: status as any,
          clockIn: status === 'COMPLETED' ? new Date(shiftDate.getTime() + Math.random() * 3600000) : null,
          clockOut: status === 'COMPLETED' ? new Date(shiftDate.getTime() + 8 * 3600000 + Math.random() * 3600000) : null,
          breakTime: 60,
          overtime: status === 'COMPLETED' && Math.random() > 0.7 ? Math.floor(Math.random() * 120) : 0,
          notes: day % 7 === 0 ? 'Ca cuối tuần' : (Math.random() > 0.9 ? 'Tăng ca' : null),
        },
      })
    }
  }

  // Create employee tasks with more variety
  const taskTitles = [
    'Sắp xếp kho hàng',
    'Xử lý đơn hàng khách',
    'Giao hàng đến công trình',
    'Kiểm tra hàng từ NCC',
    'Cập nhật giá sản phẩm',
    'Lập báo cáo tháng',
    'Kiểm tra an toàn kho',
    'Đào tạo nhân viên mới',
    'Xử lý khiếu nại KH',
    'Kiểm kê tồn kho',
    'Bảo trì thiết bị',
    'Cập nhật website',
    'Liên hệ nhà cung cấp',
    'Lập kế hoạch mua hàng',
    'Phân tích doanh số',
  ]

  const taskTypes = ['GENERAL', 'LOADING', 'TRANSPORT', 'INVENTORY', 'SALES']

  for (let i = 0; i < 80; i++) {
    const dueDate = new Date(Date.now() + (i - 40) * 24 * 60 * 60 * 1000)
    const status = i < 25 ? 'COMPLETED' : (i < 50 ? 'IN_PROGRESS' : 'PENDING')
    
    await prisma.employeeTask.create({
      data: {
        employeeId: employees[i % employees.length].id,
        title: taskTitles[i % taskTitles.length],
        description: `Hoàn thành ${taskTitles[i % taskTitles.length].toLowerCase()} theo phân công`,
        taskType: taskTypes[i % taskTypes.length] as any,
        status: status as any,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'MEDIUM'][i % 4] as any,
        dueDate,
        completedAt: status === 'COMPLETED' ? new Date(dueDate.getTime() - Math.random() * 86400000) : null,
        estimatedHours: 2 + Math.random() * 6,
        actualHours: status === 'COMPLETED' ? 2 + Math.random() * 8 : null,
      },
    })
  }

  // Create projects
  for (let i = 0; i < 5; i++) {
    const project = await prisma.project.create({
      data: {
        name: `Construction Project ${i + 1}`,
        description: `Building construction project in District ${i + 1}`,
        customerId: customers[i].id,
        status: ['PLANNING', 'IN_PROGRESS', 'COMPLETED'][i % 3] as any,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        budget: 50000000 + Math.random() * 100000000,
        actualCost: 30000000 + Math.random() * 70000000,
      },
    })

    // Create project tasks
    for (let j = 0; j < 6; j++) {
      await prisma.projectTask.create({
        data: {
          projectId: project.id,
          name: `Task ${j + 1} for Project ${i + 1}`,
          description: `Complete task ${j + 1}`,
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][j % 3] as any,
          priority: ['LOW', 'MEDIUM', 'HIGH'][j % 3] as any,
          assigneeId: employees[j % employees.length].id,
          dueDate: new Date(Date.now() + j * 10 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  // Daily sales are tracked through orders, skip separate dailySales model
  console.log('✅ Daily sales tracked through orders')

  // Skip notifications for now
  console.log('✅ Notifications skipped (can be added later)')

  // Create payroll records for last 3 months
  const currentDate = new Date()
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const payrollDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1)
    const period = `${payrollDate.getFullYear()}-${String(payrollDate.getMonth() + 1).padStart(2, '0')}`
    
    for (const employee of employees) {
      // Calculate work hours from shifts for this period
      const monthStart = new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 1)
      const monthEnd = new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0)
      
      const workDays = 22 // Average work days per month
      const hoursWorked = workDays * 8 + Math.random() * 20
      const overtimeHours = Math.random() * 20
      
      const bonuses = monthOffset === 0 ? Math.random() * 2000000 : Math.random() * 1000000
      const penalties = Math.random() * 500000
      const grossPay = employee.baseSalary + bonuses - penalties + (overtimeHours * (employee.baseSalary / 176) * 1.5)
      const taxDeductions = grossPay * 0.1
      const otherDeductions = Math.random() * 300000
      const netPay = grossPay - taxDeductions - otherDeductions
      
      await prisma.payrollRecord.create({
        data: {
          employeeId: employee.id,
          period,
          baseSalary: employee.baseSalary,
          bonuses,
          penalties,
          overtime: overtimeHours * (employee.baseSalary / 176) * 1.5,
          totalAdvances: 0,
          grossPay,
          taxDeductions,
          otherDeductions,
          netPay,
          hoursWorked,
          overtimeHours,
          isPaid: monthOffset > 0,
          paidAt: monthOffset > 0 ? new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 28) : null,
        },
      })
    }
  }

  console.log('\n🎉 Database seeded successfully with comprehensive data!')
  console.log('📊 Summary:')
  console.log(`   - ${categories.length} categories`)
  console.log(`   - ${products.length} products`)
  console.log(`   - ${createdSuppliers.length} suppliers`)
  console.log(`   - ${customers.length} customers`)
  console.log(`   - 50 orders with invoices`)
  console.log(`   - 30 purchase invoices from suppliers`)
  console.log(`   - ${employees.length} employees`)
  console.log(`   - 720+ work shifts (60 days x 12 employees)`)
  console.log(`   - 80 employee tasks`)
  console.log(`   - 5 projects with 30 project tasks`)
  console.log(`   - Payroll records for last 3 months`)
  console.log('\n✅ All admin pages now have sufficient data!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })