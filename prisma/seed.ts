import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ Cleaning up database...')

  // Helper function to safely delete a table
  const safeDelete = async (model: string, deleteFunc: () => Promise<unknown>) => {
    try {
      await deleteFunc()
      console.log(`   ✓ Deleted ${model}`)
    } catch (error: any) {
      if (error?.code === 'P2014') {
        console.log(`   ⚠ Skipped ${model} (foreign key constraint - will try later)`)
      } else {
        console.log(`   - Skipped ${model} (empty or other error)`)
      }
    }
  }

  // Delete in order of dependencies (child tables first)

  // 1. Employee operational data
  await safeDelete('PayrollRecord', () => prisma.payrollRecord.deleteMany())
  await safeDelete('WorkShift', () => prisma.workShift.deleteMany())
  await safeDelete('SalaryAdvance', () => prisma.salaryAdvance.deleteMany())
  await safeDelete('EmployeeTask', () => prisma.employeeTask.deleteMany())

  // 2. Project operational data
  await safeDelete('ProjectTaskMaterial', () => prisma.projectTaskMaterial.deleteMany())
  await safeDelete('ProjectMaterial', () => prisma.projectMaterial.deleteMany())
  await safeDelete('ProjectTask', () => prisma.projectTask.deleteMany())
  await safeDelete('Project', () => prisma.project.deleteMany())

  // 3. Inventory-related data
  await safeDelete('InventoryBinLink', () => prisma.inventoryBinLink.deleteMany())
  await safeDelete('InventoryMovement', () => prisma.inventoryMovement.deleteMany())
  await safeDelete('InventoryPrediction', () => prisma.inventoryPrediction.deleteMany())
  await safeDelete('InventoryHistory', () => prisma.inventoryHistory.deleteMany())
  await safeDelete('InventoryItem', () => prisma.inventoryItem.deleteMany())

  // 4. Sales & Purchase operational data referencing Product
  await safeDelete('OrderItem', () => prisma.orderItem.deleteMany())
  await safeDelete('InvoiceItem', () => prisma.invoiceItem.deleteMany())
  await safeDelete('PurchaseItem', () => prisma.purchaseItem.deleteMany())
  await safeDelete('PurchaseReturnItem', () => prisma.purchaseReturnItem.deleteMany())
  await safeDelete('CustomerReturnItem', () => prisma.customerReturnItem.deleteMany())
  await safeDelete('CartItem', () => prisma.cartItem.deleteMany())
  await safeDelete('Cart', () => prisma.cart.deleteMany())
  await safeDelete('ProductReview', () => prisma.productReview.deleteMany())
  await safeDelete('SupplierProduct', () => prisma.supplierProduct.deleteMany())
  await safeDelete('ContractPrice', () => prisma.contractPrice.deleteMany())
  await safeDelete('QuoteItem', () => prisma.quoteItem.deleteMany())

  // 5. Parent sales/purchase data
  await safeDelete('Order', () => prisma.order.deleteMany())
  await safeDelete('Invoice', () => prisma.invoice.deleteMany())
  await safeDelete('PurchaseOrder', () => prisma.purchaseOrder.deleteMany())

  // 6. Base Catalog data
  await safeDelete('Product', () => prisma.product.deleteMany())
  await safeDelete('Category', () => prisma.category.deleteMany())

  console.log('✅ Database cleanup completed\n')

  // Create default categories
  const categories = [
    {
      name: 'Xi măng & Bê tông',
      description: 'Xi măng Portland, bê tông tươi, gạch bê tông và vật liệu gốc xi măng',
    },
    {
      name: 'Thép & Kim loại',
      description: 'Thép cây, ống thép, tấm kim loại và các sản phẩm thép kết cấu',
    },
    {
      name: 'Gạch & Khối xây',
      description: 'Gạch đất sét, gạch bê tông, gạch tự chèn và vật liệu xây',
    },
    {
      name: 'Gỗ & Ván ép',
      description: 'Gỗ xây dựng, ván ép, dầm gỗ và các sản phẩm gỗ',
    },
    {
      name: 'Vật liệu Lợp mái',
      description: 'Mái tôn, ngói, tấm lợp và vật liệu chống thấm',
    },
    {
      name: 'Thiết bị Điện',
      description: 'Dây điện, công tắc, ổ cắm, ống luồn dây và thiết bị điện',
    },
    {
      name: 'Thiết bị Nước',
      description: 'Ống nước, phụ kiện, van và thiết bị vệ sinh',
    },
    {
      name: 'Sơn & Hoàn thiện',
      description: 'Sơn nội ngoại thất, sơn lót, chất nhuộm và vật liệu hoàn thiện',
    },
  ]

  console.log('📦 Seeding categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }



  console.log('🔑 Hashing passwords...')
  // Hashes for demo accounts
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const employeePassword = await bcrypt.hash('Employee@123', 12)
  const customerPassword = await bcrypt.hash('Customer@123', 12)
  const contractorPassword = await bcrypt.hash('Contractor@123', 12)
  const supplierPassword = await bcrypt.hash('Supplier@123', 12)

  console.log('👤 Seeding demo accounts...')
  // 1. Create Demo Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartbuild.vn' },
    update: { password: adminPassword },
    create: {
      email: 'admin@smartbuild.vn',
      name: 'Quản trị viên Hệ thống',
      password: adminPassword,
      role: 'MANAGER',
      phone: '+84900000001',
      address: 'Trụ sở SmartBuild, Khu Công nghệ cao, TP.HCM',
      emailVerified: true,
      isActive: true,
    },
  })

  // Ensure Admin has Employee record
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeCode: 'ADM001',
      department: 'Ban Giám đốc',
      position: 'Quản trị viên',
      baseSalary: 50000000,
      hireDate: new Date('2025-01-01'),
    }
  })

  // 2. Create Demo Employee
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@smartbuild.vn' },
    update: { password: employeePassword },
    create: {
      email: 'employee@smartbuild.vn',
      name: 'Nhân viên Demo',
      password: employeePassword,
      role: 'EMPLOYEE',
      phone: '+84900000002',
      address: 'Quận Tân Bình, TP.HCM',
      emailVerified: true,
      isActive: true,
    },
  })

  // Check if Employee record exists for this user or code
  const existingDemoEmp = await prisma.employee.findFirst({
    where: {
      OR: [
        { userId: empUser.id },
        { employeeCode: 'EMP001' }
      ]
    }
  })

  if (!existingDemoEmp) {
    await prisma.employee.create({
      data: {
        userId: empUser.id,
        employeeCode: 'EMP001',
        department: 'Kinh doanh',
        position: 'Chuyên viên Kinh doanh',
        baseSalary: 15000000,
        hireDate: new Date('2025-02-01'),
      }
    })
  } else if (existingDemoEmp.userId === empUser.id) {
    // Update existing if it matches userId
    await prisma.employee.update({
      where: { id: existingDemoEmp.id },
      data: {
        department: 'Kinh doanh',
        position: 'Chuyên viên Kinh doanh',
        baseSalary: 15000000,
        hireDate: new Date('2025-02-01'),
      }
    })
  }

  // 3. Create Demo Customer
  const custUser = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: { password: customerPassword },
    create: {
      email: 'customer@test.com',
      name: 'Khách hàng Demo',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+84900000003',
      address: 'Quận 1, TP.HCM',
      emailVerified: true,
      isActive: true,
    },
  })

  await prisma.customer.upsert({
    where: { userId: custUser.id },
    update: {},
    create: {
      userId: custUser.id,
      customerType: 'REGULAR',
      loyaltyTier: 'SILVER',
      loyaltyPoints: 1500,
      creditLimit: 0,
      referralCode: `REF-${Date.now()}-CUST`,
    }
  })

  // 4. Create Demo Contractor
  const contUser = await prisma.user.upsert({
    where: { email: 'contractor@test.com' },
    update: { password: contractorPassword },
    create: {
      email: 'contractor@test.com',
      name: 'Nhà thầu Demo',
      password: contractorPassword,
      role: 'CONTRACTOR',
      phone: '+84900000004',
      address: 'Quận 7, TP.HCM',
      emailVerified: true,
      isActive: true,
    },
  })

  const contCustomer = await prisma.customer.upsert({
    where: { userId: contUser.id },
    update: {},
    create: {
      userId: contUser.id,
      customerType: 'WHOLESALE',
      loyaltyTier: 'GOLD',
      loyaltyPoints: 5000,
      creditLimit: 100000000, // 100M VND
      contractorVerified: true,
      companyName: 'Công ty Xây dựng Smart',
      taxId: '0312345678',
      referralCode: `REF-${Date.now()}-CONT`,
    }
  })

  await prisma.contractorProfile.upsert({
    where: { customerId: contCustomer.id },
    update: {},
    create: {
      customerId: contCustomer.id,
      displayName: 'Xây dựng Smart Co.',
      companyName: 'Công ty TNHH Xây dựng Smart',
      phone: '+84900000004',
      email: 'contractor@test.com',
      experienceYears: 5,
      skills: ['Nhà ở', 'Thương mại', 'Cải tạo'],
      isVerified: true,
      onboardingStatus: 'VERIFIED',
      trustScore: 85,
      city: 'Hồ Chí Minh',
      district: 'Quận 7',
    }
  })

  // 5. Create Demo Supplier
  const suppUser = await prisma.user.upsert({
    where: { email: 'supplier@test.com' },
    update: { password: supplierPassword },
    create: {
      email: 'supplier@test.com',
      name: 'Nhà cung cấp Demo',
      password: supplierPassword,
      role: 'SUPPLIER',
      phone: '+84900000005',
      address: 'Khu Công nghiệp Đồng Nai',
      emailVerified: true,
      isActive: true,
    },
  })

  const demoSupplier = await prisma.supplier.upsert({
    where: { userId: suppUser.id },
    update: {},
    create: {
      userId: suppUser.id,
      name: 'Nhà cung cấp Vật liệu Demo',
      contactPerson: 'Anh Nhà Cung Cấp',
      email: 'supplier@test.com',
      phone: '+84900000005',
      address: 'Khu Công nghiệp Đồng Nai',
      city: 'Đồng Nai',
      country: 'Việt Nam',
      isActive: true,
      is2FAEnabled: false,
    }
  })

  // Create sample products
  const cementCategory = await prisma.category.findFirst({
    where: { name: 'Xi măng & Bê tông' }
  })

  const steelCategory = await prisma.category.findFirst({
    where: { name: 'Thép & Kim loại' }
  })

  if (cementCategory && steelCategory) {
    const sampleProducts = [
      {
        name: 'Portland Cement 50kg',
        description: 'High-quality Portland cement suitable for all construction needs',
        categoryId: cementCategory.id,
        sku: 'CEM-PORT-50',
        price: 850000,
        costPrice: 620000,
        unit: 'bao',
        weight: 50,
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Ready Mix Concrete M25',
        description: 'Ready-to-use concrete mix with 25 MPa strength',
        categoryId: cementCategory.id,
        sku: 'CON-RDY-M25',
        price: 1200000,
        costPrice: 950000,
        unit: 'm³',
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Thép cây D12',
        description: 'Thép thanh vằn xây dựng phi 12, tiêu chuẩn Việt - Nhật',
        categoryId: steelCategory.id,
        sku: 'STL-RBR-12',
        price: 185000,
        costPrice: 158000,
        unit: 'cây',
        weight: 0.888,
        isActive: true,
        isFeatured: false,
      },
      {
        name: 'Ống thép mạ kẽm 2 inch',
        description: 'Ống thép Hòa Phát mạ kẽm, bền bỉ, chống gỉ sét',
        categoryId: steelCategory.id,
        sku: 'STL-PIPE-2',
        price: 320000,
        costPrice: 280000,
        unit: 'mét',
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
  ]

  const createdSuppliers = [demoSupplier] // Add demo supplier here!
  const supplierPasswordHash = await bcrypt.hash('Supplier@123', 12)

  for (const supplier of suppliers) {
    let user = await prisma.user.findUnique({
      where: { email: supplier.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: supplier.email,
          name: supplier.contactPerson || supplier.name,
          password: supplierPasswordHash,
          role: 'SUPPLIER',
          phone: supplier.phone,
          address: supplier.address,
          isActive: true,
        }
      })
    }

    const created = await prisma.supplier.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        ...supplier,
        userId: user.id
      }
    })
    createdSuppliers.push(created)
  }

  // Create customer users
  // Start with the demo accounts we already created
  const demoCustomer = await prisma.customer.findUnique({ where: { userId: custUser.id } })
  const demoContractorCustomer = await prisma.customer.findUnique({ where: { userId: contUser.id } })

  const customers = []
  if (demoCustomer) customers.push(demoCustomer)
  if (demoContractorCustomer) customers.push(demoContractorCustomer)

  for (let i = 1; i <= 10; i++) {
    const email = `customer${i}@example.com`
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `Khách hàng ${i}`,
          password: customerPassword,
          role: 'CUSTOMER',
          phone: `+8490${1000000 + i}`,
          address: `${i} Customer Street`,
        },
      })
    }

    const customer = await prisma.customer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        customerType: i % 3 === 0 ? 'WHOLESALE' : 'REGULAR',
        loyaltyTier: ['BRONZE', 'SILVER', 'GOLD'][i % 3] as any,
        totalPurchases: Math.random() * 50000000,
        loyaltyPoints: Math.floor(Math.random() * 5000),
        totalPointsEarned: Math.floor(Math.random() * 10000),
        referralCode: `REF-${Date.now()}-${i}`,
      },
    })
    customers.push(customer)
  }

  // Create orders and invoices with more data
  const products = await prisma.product.findMany({ take: 10 })

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
        customerType: (customer.customerType === 'WHOLESALE' ? 'CONTRACTOR' : 'REGISTERED') as any,
        status: ['PENDING', 'PROCESSING', 'DELIVERED', 'DELIVERED', 'DELIVERED'][i % 5] as any,
        totalAmount,
        taxAmount: totalAmount * 0.1,
        shippingAmount: 50000,
        discountAmount: 0,
        netAmount: totalAmount + totalAmount * 0.1 + 50000,
        shippingAddress: JSON.parse(JSON.stringify({
          street: `${i} Delivery Street`,
          city: 'TP. Hồ Chí Minh',
          district: `Quận ${(i % 10) + 1}`,
          zipCode: '700000'
        })),
        billingAddress: JSON.parse(JSON.stringify({
          street: `${i} Billing Street`,
          city: 'TP. Hồ Chí Minh',
          district: `Quận ${(i % 10) + 1}`,
          zipCode: '700000'
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
      const invoiceItemsArr = orderItems.map(item => ({
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
            create: invoiceItemsArr
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

    let calculatedTotal = 0
    const purchaseInvoiceItems = randomProducts.map(product => {
      const quantity = Math.floor(Math.random() * 50) + 10
      const unitPrice = product.costPrice || product.price * 0.7
      const itemTotal = quantity * unitPrice
      calculatedTotal += itemTotal

      return {
        productId: product.id,
        description: `Nhập hàng ${product.name}`,
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
        subtotal: calculatedTotal,
        taxAmount: calculatedTotal * 0.1,
        discountAmount: 0,
        totalAmount: calculatedTotal + calculatedTotal * 0.1,
        paidAmount: (i % 4 === 3) ? calculatedTotal + calculatedTotal * 0.1 : 0,
        balanceAmount: (i % 4 === 3) ? 0 : calculatedTotal + calculatedTotal * 0.1,
        paymentTerms: 'Net 45',
        invoiceItems: {
          create: purchaseInvoiceItems
        }
      },
    })
  }

  // Create employees with more comprehensive data
  const employees = []
  const departments = ['Kinh doanh', 'Kho vận', 'Giao hàng', 'Kế toán', 'CNTT', 'Nhân sự', 'Quản lý']
  const positions = ['Nhân viên Kinh doanh', 'Nhân viên Kho', 'Tài xế', 'Kế toán viên', 'Hỗ trợ CNTT', 'Trưởng phòng NS', 'Giám sát']

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
          password: employeePassword,
          role: 'EMPLOYEE',
          phone: `+8490${2000000 + i}`,
        },
      })
    }

    const deptIndex = i % departments.length
    const employeeCode = `EMP${String(i).padStart(4, '0')}`

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: empUser.id },
          { employeeCode: employeeCode }
        ]
      }
    })

    if (!existingEmployee) {
      const employee = await prisma.employee.create({
        data: {
          userId: empUser.id,
          employeeCode: employeeCode,
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

  console.log('⏱️ Seeding work shifts (this might take a while)...')
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
        name: `Dự án Xây dựng ${i + 1}`,
        description: `Dự án xây dựng tòa nhà tại Quận ${i + 1}`,
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
          name: `Công việc ${j + 1} cho Dự án ${i + 1}`,
          description: `Hoàn thành công việc số ${j + 1}`,
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