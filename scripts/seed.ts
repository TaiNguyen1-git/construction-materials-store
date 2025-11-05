import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create or update categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Xi măng & Bê tông' },
        update: {},
        create: {
          name: 'Xi măng & Bê tông',
          description: 'Xi măng các loại, bê tông tươi, phụ gia bê tông',
          isActive: true
        }
      }),
      prisma.category.upsert({
        where: { name: 'Thép xây dựng' },
        update: {},
        create: {
          name: 'Thép xây dựng',
          description: 'Thép cây, thép hộp, thép tấm, thép ống',
          isActive: true
        }
      }),
      prisma.category.upsert({
        where: { name: 'Gạch & Ốp lát' },
        update: {},
        create: {
          name: 'Gạch & Ốp lát',
          description: 'Gạch xây, gạch ốp tường, gạch lát nền',
          isActive: true
        }
      }),
      prisma.category.upsert({
        where: { name: 'Sơn & Hóa chất' },
        update: {},
        create: {
          name: 'Sơn & Hóa chất',
          description: 'Sơn tường, sơn chống thấm, hóa chất xây dựng',
          isActive: true
        }
      }),
      prisma.category.upsert({
        where: { name: 'Điện & Nước' },
        update: {},
        create: {
          name: 'Điện & Nước',
          description: 'Ống nước, dây điện, thiết bị điện',
          isActive: true
        }
      })
    ])

    console.log('✅ Categories created:', categories.length)

    // Create suppliers (skip if exists)
    const supplierData = [
      {
        name: 'Công ty Xi măng Hà Tiên',
        email: 'info@hatiencement.com',
        phone: '0281-3888-888',
        address: 'Kiên Giang, Việt Nam',
        isActive: true
      },
      {
        name: 'Thép Hòa Phát',
        email: 'sales@hoaphat.com.vn',
        phone: '024-3555-6666',
        address: 'Hà Nội, Việt Nam',
        isActive: true
      },
      {
        name: 'Gạch ốp lát Đồng Tâm',
        email: 'info@dongtam.vn',
        phone: '0274-3500-888',
        address: 'Đồng Nai, Việt Nam',
        isActive: true
      }
    ]

    // Check and create suppliers if they don't exist
    const suppliers = []
    for (const supplierInfo of supplierData) {
      const existing = await prisma.supplier.findFirst({
        where: { name: supplierInfo.name }
      })
      if (!existing) {
        const supplier = await prisma.supplier.create({ data: supplierInfo })
        suppliers.push(supplier)
      } else {
        suppliers.push(existing)
      }
    }

    console.log('✅ Suppliers created:', suppliers.length)

    // Create products
    const products = [
      {
        name: 'Xi măng Insee PCB40',
        description: 'Xi măng Insee Portland PC40 - Thương hiệu uy tín, chất lượng cao, phù hợp cho mọi công trình xây dựng. Độ bền cao, an toàn cho công trình.',
        categoryId: categories[0].id,
        sku: 'XM-INSEE-PCB40',
        price: 90000,
        costPrice: 75000,
        unit: 'bao',
        weight: 50,
        dimensions: '40x20x10',
        tags: ['Xi măng', 'Insee', 'PC40', 'Xám'],
        images: [],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Xi măng Hà Tiên PCB40',
        description: 'Xi măng Hà Tiên Portland PC40 - Sản xuất tại Việt Nam, chất lượng tốt, giá cả phải chăng',
        categoryId: categories[0].id,
        sku: 'XM-HATIEN-PCB40',
        price: 100000,
        costPrice: 85000,
        unit: 'bao',
        weight: 50,
        dimensions: '40x20x10',
        tags: ['Xi măng', 'Hà Tiên', 'PC40', 'Xám'],
        images: [],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Thép cây CB240-T D10',
        description: 'Thép cây xây dựng CB240-T đường kính 10mm, độ bền cao',
        categoryId: categories[1].id,
        sku: 'THEP-CB240-D10',
        price: 18500,
        costPrice: 16000,
        unit: 'cây',
        weight: 6.17,
        dimensions: '12000x10',
        tags: ['Thép carbon', 'Đen'],
        images: [],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Gạch ốp tường 30x60',
        description: 'Gạch ốp tường cao cấp kích thước 30x60cm, bề mặt nhẵn bóng',
        categoryId: categories[2].id,
        sku: 'GACH-OP-30X60',
        price: 85000,
        costPrice: 70000,
        unit: 'm2',
        weight: 2.5,
        dimensions: '30x60x0.8',
        tags: ['Ceramic', 'Trắng'],
        images: [],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Sơn nước Dulux Inspire',
        description: 'Sơn nước nội thất cao cấp Dulux Inspire, bảo vệ tối ưu',
        categoryId: categories[3].id,
        sku: 'SON-DULUX-18L',
        price: 890000,
        costPrice: 750000,
        unit: 'thùng',
        weight: 18,
        dimensions: '25x25x35',
        tags: ['Sơn nước', 'Trắng'],
        images: [],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Ống nước PPR PN16 D25',
        description: 'Ống nước PPR áp lực cao PN16, đường kính 25mm',
        categoryId: categories[4].id,
        sku: 'ONG-PPR-D25',
        price: 45000,
        costPrice: 35000,
        unit: 'cây',
        weight: 1.2,
        dimensions: '4000x25',
        tags: ['PPR', 'Trắng'],
        images: [],
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Gạch lát nền 60x60',
        description: 'Gạch lát nền granite 60x60cm chống trơn trượt',
        categoryId: categories[2].id,
        sku: 'GACH-LAT-60X60',
        price: 120000,
        costPrice: 100000,
        unit: 'm2',
        weight: 3.2,
        dimensions: '60x60x1.0',
        tags: ['Granite', 'Kem'],
        images: [],
        isFeatured: true,
        isActive: true
      }
    ]

    const createdProducts = []
    for (const productData of products) {
      const existing = await prisma.product.findFirst({
        where: { sku: productData.sku }
      })
      if (!existing) {
        const product = await prisma.product.create({ data: productData })
        createdProducts.push(product)

        // Create inventory item for each product
        await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            quantity: Math.floor(Math.random() * 100) + 50, // Random stock 50-150
            availableQuantity: Math.floor(Math.random() * 100) + 50,
            reservedQuantity: 0,
            minStockLevel: 20,
            reorderPoint: 20
          }
        })
      } else {
        createdProducts.push(existing)
      }
    }

    console.log('✅ Products created:', createdProducts.length)

    // Create a sample admin user
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smartbuild.vn' },
      update: {},
      create: {
        name: 'Administrator',
        email: 'admin@smartbuild.vn',
        phone: '0123456789',
        role: 'MANAGER' as any,
        password: hashedPassword
      }
    })

    console.log('✅ Admin user created:', adminUser.email)

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 10)

    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@test.com' },
      update: {},
      create: {
        name: 'Nguyễn Văn A',
        email: 'customer@test.com',
        phone: '0987654321',
        role: 'CUSTOMER' as any,
        password: customerPassword,
        address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM'
      }
    })

    const customer = await prisma.customer.upsert({
      where: { userId: customerUser.id },
      update: {},
      create: {
        userId: customerUser.id,
        referralCode: `REF${Date.now()}-${Math.random().toString(36).substring(7)}`
      }
    })
    console.log('✅ Sample customer created:', customerUser.email)

    // Create more customers
    const additionalCustomers = []
    for (let i = 1; i <= 15; i++) {
      const custEmail = `customer${i}@example.com`
      const existingCust = await prisma.user.findUnique({ where: { email: custEmail } })
      
      if (!existingCust) {
        const custUser = await prisma.user.create({
          data: {
            name: `Khách hàng ${i}`,
            email: custEmail,
            phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            role: 'CUSTOMER',
            password: customerPassword,
            address: `${i} Đường ABC, Quận ${(i % 12) + 1}, TP.HCM`
          }
        })

        const cust = await prisma.customer.create({
          data: {
            userId: custUser.id,
            loyaltyTier: ['BRONZE', 'SILVER', 'GOLD'][i % 3] as any,
            referralCode: `REF${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`
          }
        })
        additionalCustomers.push(cust)
      }
    }
    console.log('✅ Additional customers created:', additionalCustomers.length)

    // Create employees
    const employees = []
    for (let i = 1; i <= 10; i++) {
      const empEmail = `employee${i}@smartbuild.vn`
      const empCode = `EMP${i.toString().padStart(4, '0')}`
      
      const existingEmpUser = await prisma.user.findUnique({ where: { email: empEmail } })
      const existingEmpCode = await prisma.employee.findUnique({ where: { employeeCode: empCode } })
      
      if (!existingEmpUser && !existingEmpCode) {
        const empUser = await prisma.user.create({
          data: {
            name: `Nhân viên ${i}`,
            email: empEmail,
            phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            role: 'EMPLOYEE',
            password: hashedPassword
          }
        })

        const emp = await prisma.employee.create({
          data: {
            userId: empUser.id,
            employeeCode: empCode,
            department: ['Kho', 'Giao hàng', 'Bán hàng', 'Kế toán'][i % 4],
            position: ['Nhân viên kho', 'Tài xế', 'Nhân viên bán hàng', 'Kế toán viên'][i % 4],
            baseSalary: 5000000 + (i * 500000),
            hireDate: new Date(Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000))
          }
        })
        employees.push(emp)
      } else if (existingEmpUser) {
        const existingEmp = await prisma.employee.findUnique({ where: { userId: existingEmpUser.id } })
        if (existingEmp) {
          employees.push(existingEmp)
        }
      }
    }
    console.log('✅ Employees created/found:', employees.length)

    // Create work shifts for employees (last 30 days)
    const shifts = []
    if (employees.length > 0) {
      for (let day = 0; day < 30; day++) {
        const shiftDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000)
        
        for (const emp of employees.slice(0, Math.min(5, employees.length))) {
          const shift = await prisma.workShift.create({
            data: {
              employeeId: emp.id,
              date: shiftDate,
              startTime: '08:00',
              endTime: '17:00',
              shiftType: 'REGULAR',
              status: day < 2 ? 'SCHEDULED' : 'COMPLETED',
              clockIn: day >= 2 ? new Date(shiftDate.getTime() + 8 * 60 * 60 * 1000) : null,
              clockOut: day >= 2 ? new Date(shiftDate.getTime() + 17 * 60 * 60 * 1000) : null,
              breakTime: 60,
              overtime: 0
            }
          })
          shifts.push(shift)
        }
      }
      console.log('✅ Work shifts created:', shifts.length)

      // Create payroll for employees
      const payrolls = []
      for (const emp of employees) {
        const payroll = await prisma.payrollRecord.create({
          data: {
            employeeId: emp.id,
            period: new Date().toISOString().slice(0, 7), // YYYY-MM
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
        payrolls.push(payroll)
      }
      console.log('✅ Payroll records created:', payrolls.length)

      // Create employee tasks
      const taskTitles = [
        'Kiểm tra hàng tồn kho',
        'Giao hàng cho khách hàng',
        'Sắp xếp kho hàng',
        'Liên hệ nhà cung cấp',
        'Cập nhật giá sản phẩm',
        'Báo cáo doanh thu tuần',
        'Kiểm tra chất lượng hàng',
        'Đào tạo nhân viên mới'
      ]
      
      const tasks = []
      for (let i = 0; i < 30; i++) {
        const task = await prisma.employeeTask.create({
          data: {
            employeeId: employees[i % employees.length].id,
            title: taskTitles[i % taskTitles.length],
            description: `Công việc ${taskTitles[i % taskTitles.length].toLowerCase()}`,
            taskType: ['GENERAL', 'LOADING', 'TRANSPORT', 'INVENTORY', 'SALES'][i % 5] as any,
            status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][i % 3] as any,
            priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3] as any,
            dueDate: new Date(Date.now() + (i - 15) * 24 * 60 * 60 * 1000),
            completedAt: (i % 3 === 2) ? new Date() : null,
            estimatedHours: 2 + Math.random() * 4,
            actualHours: (i % 3 === 2) ? 2 + Math.random() * 5 : null
          }
        })
        tasks.push(task)
      }
      console.log('✅ Employee tasks created:', tasks.length)
    }

    // Create orders
    const allCustomers = await prisma.customer.findMany({ take: 10 })
    const orders = []
    if (allCustomers.length > 0 && createdProducts.length > 0) {
      for (let i = 0; i < 20; i++) {
        const customer = allCustomers[i % allCustomers.length]
        const orderDate = new Date(Date.now() - (Math.random() * 60 * 24 * 60 * 60 * 1000))
        
        const orderItems = []
        const numItems = Math.floor(Math.random() * 3) + 1
        let totalAmount = 0
        
        for (let j = 0; j < numItems; j++) {
          const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
          const quantity = Math.floor(Math.random() * 10) + 1
          const itemTotal = product.price * quantity
          totalAmount += itemTotal
          
          orderItems.push({
            productId: product.id,
            quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            discount: 0
          })
        }

        const order = await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${i}`,
            customerId: customer.id,
            customerType: 'REGISTERED',
            status: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'][i % 5] as any,
            totalAmount,
            taxAmount: totalAmount * 0.1,
            shippingAmount: 50000,
            discountAmount: 0,
            netAmount: totalAmount + totalAmount * 0.1 + 50000,
            shippingAddress: JSON.parse(JSON.stringify({
              street: `${i} Đường Giao Hàng`,
              city: 'TP.HCM',
              district: `Quận ${(i % 12) + 1}`,
              zipCode: '70000'
            })),
            billingAddress: JSON.parse(JSON.stringify({
              street: `${i} Đường Thanh Toán`,
              city: 'TP.HCM',
              district: `Quận ${(i % 12) + 1}`,
              zipCode: '70000'
            })),
            paymentMethod: ['CASH', 'BANK_TRANSFER', 'MOMO'][i % 3] as any,
            paymentStatus: ['PAID', 'PAID', 'PENDING'][i % 3] as any,
            createdAt: orderDate,
            orderItems: {
              create: orderItems
            }
          }
        })
        orders.push(order)
      }
      console.log('✅ Orders created:', orders.length)
    }

    // Create invoices for completed orders
    const completedOrders = allCustomers.length > 0 && createdProducts.length > 0 && orders.length > 0 ? 
      orders.filter((_, i) => i % 5 === 4) : []
    
    if (completedOrders.length > 0) {
      for (const order of completedOrders) {
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-SALES-${Date.now()}-${order.id}`,
            invoiceType: 'SALES',
            orderId: order.id,
            customerId: order.customerId,
            issueDate: order.createdAt,
            dueDate: new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'PAID',
            subtotal: order.totalAmount,
            taxAmount: order.taxAmount,
            discountAmount: 0,
            totalAmount: order.netAmount,
            paidAmount: order.netAmount,
            balanceAmount: 0,
            paymentTerms: 'Net 30',
            notes: 'Hóa đơn bán hàng'
          }
        })
      }
    }
    console.log('✅ Invoices created:', completedOrders.length)

    console.log('🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${suppliers.length} suppliers`) 
    console.log(`   - ${createdProducts.length} products`)
    console.log(`   - ${additionalCustomers.length + 1} customers`)
    console.log(`   - ${employees.length} employees`)
    console.log(`   - ${shifts.length} work shifts`)
    console.log(`   - ${employees.length > 0 ? 10 : 0} payroll records`)
    console.log(`   - ${employees.length > 0 ? 30 : 0} employee tasks`)
    console.log(`   - ${orders.length} orders`)
    console.log(`   - ${completedOrders.length} invoices`)
    console.log('')
    console.log('🔑 Login credentials:')
    console.log('   Admin: admin@smartbuild.vn / admin123')
    console.log('   Customer: customer@test.com / customer123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()