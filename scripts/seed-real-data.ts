// Seed Real Construction Materials Data
// Run: npm run db:seed:real

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Real Data Seeding...')
  console.log('=' .repeat(70))

  // 1. Clear existing data (optional - comment out if you want to keep existing data)
  console.log('\n🗑️  Clearing existing data...')
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.projectTaskMaterial.deleteMany({})
  await prisma.projectMaterial.deleteMany({})
  await prisma.projectTask.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.invoiceItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.purchaseItem.deleteMany({})
  await prisma.purchaseOrder.deleteMany({})
  await prisma.inventoryMovement.deleteMany({})
  await prisma.inventoryHistory.deleteMany({})
  await prisma.inventoryItem.deleteMany({})
  await prisma.productReview.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.payrollRecord.deleteMany({})
  await prisma.salaryAdvance.deleteMany({})
  await prisma.employeeTask.deleteMany({})
  await prisma.workShift.deleteMany({})
  await prisma.employee.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.supplier.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✅ Cleared existing data')

  // 2. Create Admin User
  console.log('\n👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@smartbuild.vn',
      name: 'Admin',
      password: hashedPassword,
      role: 'MANAGER',
      phone: '0901234567',
      address: 'TP. Hồ Chí Minh',
      isActive: true
    }
  })
  
  const employee = await prisma.employee.create({
    data: {
      userId: adminUser.id,
      employeeCode: 'EMP001',
      department: 'Quản lý',
      position: 'Giám đốc',
      baseSalary: 20000000,
      hireDate: new Date(),
      isActive: true
    }
  })
  console.log('✅ Admin created: admin@smartbuild.vn / admin123')

  // 3. Create Categories
  console.log('\n📦 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Xi măng',
        description: 'Xi măng các loại PC30, PC40, PCB40',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Gạch',
        description: 'Gạch đinh, gạch ống các loại',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Đá',
        description: 'Đá 1x2, đá mi, đá xây dựng',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Cát',
        description: 'Cát xây dựng, cát vàng',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Thép',
        description: 'Thép xây dựng các loại',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sơn',
        description: 'Sơn nước, sơn dầu, bột trét',
        isActive: true
      }
    })
  ])
  console.log(`✅ Created ${categories.length} categories`)

  // 4. Create Suppliers
  console.log('\n🏢 Creating suppliers...')
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'INSEE Việt Nam',
        email: 'sales@insee.vn',
        phone: '028-3820-8888',
        address: 'TP. Hồ Chí Minh',
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Xi măng Hà Tiên',
        email: 'info@hatiencement.com',
        phone: '0297-3888-888',
        address: 'Kiên Giang',
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Gạch Đồng Tâm',
        email: 'info@dongtam.vn',
        phone: '0251-3500-888',
        address: 'Đồng Nai',
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Đá Xây Dựng Phú Mỹ',
        email: 'phumy@stone.vn',
        phone: '0274-3850-123',
        address: 'Bình Dương',
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Cát Xây Dựng Tân Phú',
        email: 'tanphu@sand.vn',
        phone: '0251-3820-456',
        address: 'Đồng Nai',
        isActive: true
      }
    })
  ])
  console.log(`✅ Created ${suppliers.length} suppliers`)

  // 5. Create Products (Based on Knowledge Base)
  console.log('\n🛍️  Creating products...')
  
  const cementCategory = categories[0]
  const brickCategory = categories[1]
  const stoneCategory = categories[2]
  const sandCategory = categories[3]
  
  const inseeSupplier = suppliers[0]
  const hatienSupplier = suppliers[1]
  const dongtamSupplier = suppliers[2]
  const stoneSupplier = suppliers[3]
  const sandSupplier = suppliers[4]

  // Xi măng
  const products = [
    // Xi măng INSEE
    await prisma.product.create({
      data: {
        name: 'Xi măng INSEE PC30',
        categoryId: cementCategory.id,
        sku: 'XM-INSEE-PC30',
        description: 'Xi măng Portland PC30 của INSEE, phù hợp cho xây tô, vữa trát, các công trình dân dụng thông thường',
        price: 120000,
        unit: 'bao 50kg',
        images: ['/images/cement-insee-pc30.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 500,
            reservedQuantity: 0,
            reorderPoint: 100,
            minStockLevel: 50
          }
        }
      }
    }),
    await prisma.product.create({
      data: {
        name: 'Xi măng INSEE PC40',
        categoryId: cementCategory.id,
        sku: 'XM-INSEE-PC40',
        description: 'Xi măng Portland hỗn hợp PCB40 của INSEE, chất lượng cao, độ bền tốt, phù hợp cho móng, cột, dầm, sàn',
        price: 135000,
        unit: 'bao 50kg',
        images: ['/images/cement-insee-pc40.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 800,
            reservedQuantity: 0,
            reorderPoint: 150,
            minStockLevel: 100
          }
        }
      }
    }),
    
    // Xi măng Hà Tiên
    await prisma.product.create({
      data: {
        name: 'Xi măng Hà Tiên PC30',
        categoryId: cementCategory.id,
        sku: 'XM-HATIEN-PC30',
        description: 'Xi măng Portland PC30 của Hà Tiên, dùng cho xây tô, giá thành hợp lý',
        price: 110000,
        unit: 'bao 50kg',
        images: ['/images/cement-hatien-pc30.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 600,
            reservedQuantity: 0,
            reorderPoint: 120,
            minStockLevel: 80
          }
        }
      }
    }),
    await prisma.product.create({
      data: {
        name: 'Xi măng Hà Tiên PCB40',
        categoryId: cementCategory.id,
        sku: 'XM-HATIEN-PCB40',
        description: 'Xi măng Portland hỗn hợp PCB40 của Hà Tiên, thương hiệu Việt Nam uy tín, giá tốt',
        price: 125000,
        unit: 'bao 50kg',
        images: ['/images/cement-hatien-pcb40.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 700,
            reservedQuantity: 0,
            reorderPoint: 140,
            minStockLevel: 100
          }
        }
      }
    }),
    
    // Gạch
    await prisma.product.create({
      data: {
        name: 'Gạch Đinh 8x8x18cm',
        categoryId: brickCategory.id,
        sku: 'GACH-DINH-8X8X18',
        description: 'Gạch đinh (gạch 4 lỗ) kích thước 8x8x18cm, dùng phổ biến cho xây tường ngăn, tường bao',
        price: 2200,
        unit: 'viên',
        images: ['/images/brick-dinh.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 10000,
            reservedQuantity: 0,
            reorderPoint: 2000,
            minStockLevel: 1000
          }
        }
      }
    }),
    await prisma.product.create({
      data: {
        name: 'Gạch Ống đỏ 6x10x20cm',
        categoryId: brickCategory.id,
        sku: 'GACH-ONG-6X10X20',
        description: 'Gạch ống đỏ truyền thống, có lỗ rỗng bên trong, thông thoáng, cách nhiệt tốt',
        price: 2800,
        unit: 'viên',
        images: ['/images/brick-ong.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 8000,
            reservedQuantity: 0,
            reorderPoint: 1500,
            minStockLevel: 800
          }
        }
      }
    }),
    
    // Đá
    await prisma.product.create({
      data: {
        name: 'Đá 1x2 (10-20mm)',
        categoryId: stoneCategory.id,
        sku: 'DA-1X2',
        description: 'Đá dăm cỡ 1x2 (10-20mm), dùng để trộn bê tông cho móng, cột, dầm, sàn',
        price: 420000,
        unit: 'm³',
        images: ['/images/stone-1x2.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 50,
            reservedQuantity: 0,
            reorderPoint: 10,
            minStockLevel: 5
          }
        }
      }
    }),
    await prisma.product.create({
      data: {
        name: 'Đá mi (5-7mm)',
        categoryId: stoneCategory.id,
        sku: 'DA-MI',
        description: 'Đá dăm cỡ nhỏ 5-7mm, dùng trộn bê tông mác thấp, vữa lót nền, lót đường',
        price: 380000,
        unit: 'm³',
        images: ['/images/stone-mi.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 40,
            reservedQuantity: 0,
            reorderPoint: 8,
            minStockLevel: 4
          }
        }
      }
    }),
    
    // Cát
    await prisma.product.create({
      data: {
        name: 'Cát xây dựng loại I',
        categoryId: sandCategory.id,
        sku: 'CAT-XD-I',
        description: 'Cát xây dựng sạch, hạt to đều, dùng để trộn bê tông móng, cột, dầm, sàn',
        price: 380000,
        unit: 'm³',
        images: ['/images/sand-construction.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 60,
            reservedQuantity: 0,
            reorderPoint: 12,
            minStockLevel: 6
          }
        }
      }
    }),
    await prisma.product.create({
      data: {
        name: 'Cát vàng',
        categoryId: sandCategory.id,
        sku: 'CAT-VANG',
        description: 'Cát vàng hạt mịn, dùng để xây gạch, trát tường, hoàn thiện',
        price: 320000,
        unit: 'm³',
        images: ['/images/sand-yellow.jpg'],
        isActive: true,
        inventoryItem: {
          create: {
            availableQuantity: 45,
            reservedQuantity: 0,
            reorderPoint: 10,
            minStockLevel: 5
          }
        }
      }
    })
  ]
  
  console.log(`✅ Created ${products.length} products`)

  // 6. Create Sample Customers
  console.log('\n👥 Creating sample customers...')
  const customerUsers = []
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `customer${i}@example.com`,
        name: `Khách hàng ${i}`,
        password: hashedPassword,
        role: 'CUSTOMER',
        phone: `090${String(i).padStart(7, '0')}`,
        address: `Địa chỉ ${i}, TP. HCM`,
        isActive: true
      }
    })
    
    await prisma.customer.create({
      data: {
        userId: user.id,
        customerType: i <= 5 ? 'VIP' : 'REGULAR',
        totalPurchases: Math.random() * 100000000,
        loyaltyPoints: Math.floor(Math.random() * 5000),
        creditLimit: 50000000,
        currentBalance: 0,
        loyaltyTier: i <= 3 ? 'GOLD' : (i <= 10 ? 'SILVER' : 'BRONZE'),
        referralCode: `REF${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`
      }
    })
    
    customerUsers.push(user)
  }
  console.log(`✅ Created ${customerUsers.length} customers`)

  // 7. Create Sample Orders (for analytics)
  console.log('\n📦 Creating sample orders...')
  const customers = await prisma.customer.findMany({ include: { user: true } })
  
  let orderCount = 0
  const today = new Date()
  
  // Create orders for last 6 months
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const ordersThisMonth = Math.floor(Math.random() * 15) + 10 // 10-25 orders per month
    
    for (let i = 0; i < ordersThisMonth; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const orderDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1)
      
      // Random 2-5 products per order
      const numProducts = Math.floor(Math.random() * 4) + 2
      const orderProducts = []
      let totalAmount = 0
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 20) + 1
        const price = product.price * quantity
        totalAmount += price
        
        orderProducts.push({
          productId: product.id,
          quantity,
          unitPrice: product.price,
          totalPrice: price
        })
      }
      
      const taxAmount = totalAmount * 0.1 // 10% VAT
      const netAmount = totalAmount + taxAmount
      
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${orderDate.getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`,
          customerId: customer.id,
          status: 'DELIVERED',
          totalAmount,
          taxAmount,
          shippingAmount: 0,
          discountAmount: 0,
          netAmount,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          shippingAddress: {
            address: customer.user.address || 'TP. HCM',
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
    }
  }
  console.log(`✅ Created ${orderCount} orders`)

  // 8. Create Purchase Orders (for suppliers)
  console.log('\n📋 Creating purchase orders...')
  let poCount = 0
  for (let i = 0; i < 10; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const orderDate = new Date(today.getFullYear(), today.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1)
    
    await prisma.invoice.create({
      data: {
        invoiceNumber: `PO-2024-${String(i + 1).padStart(4, '0')}`,
        invoiceType: 'PURCHASE',
        supplierId: supplier.id,
        issueDate: orderDate,
        dueDate: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: i < 8 ? 'PAID' : 'OVERDUE',
        subtotal: Math.floor(Math.random() * 50000000) + 10000000,
        taxAmount: Math.floor(Math.random() * 5000000) + 1000000,
        totalAmount: Math.floor(Math.random() * 55000000) + 11000000,
        balanceAmount: i < 8 ? 0 : Math.floor(Math.random() * 55000000) + 11000000,
        notes: 'Đơn hàng nhập vật tư xây dựng'
      }
    })
    poCount++
  }
  console.log(`✅ Created ${poCount} purchase orders`)

  // 9. Create Projects
  console.log('\n🏗️  Creating projects...')
  const projectTypes = ['Xây nhà phố', 'Xây biệt thự', 'Sửa chữa nhà', 'Xây nhà xưởng', 'Xây chung cư']
  const projectStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']
  
  let projectCount = 0
  for (let i = 0; i < 15; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)]
    const status = i < 10 ? projectStatuses[Math.floor(Math.random() * 2) + 1] : projectStatuses[3] // Most are in progress or completed
    const startDate = new Date(today.getFullYear(), today.getMonth() - Math.floor(Math.random() * 4), Math.floor(Math.random() * 28) + 1)
    const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 90) + 30) * 24 * 60 * 60 * 1000)
    
    const estimatedBudget = Math.floor(Math.random() * 500000000) + 100000000 // 100M - 600M
    const actualSpent = status === 'COMPLETED' ? estimatedBudget * (0.9 + Math.random() * 0.2) : estimatedBudget * Math.random() * 0.7
    
    const projectName = `${projectType} - ${customer.user.name}`
    
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: `Dự án ${projectType.toLowerCase()} tại ${customer.user.address}. Liên hệ: ${customer.user.name} - ${customer.user.phone}`,
        customerId: customer.id,
        status,
        startDate,
        endDate: status === 'COMPLETED' ? endDate : null,
        budget: estimatedBudget,
        actualCost: actualSpent,
        progress: status === 'COMPLETED' ? 100 : (status === 'IN_PROGRESS' ? Math.floor(Math.random() * 70) + 20 : 0),
        priority: i < 5 ? 'HIGH' : (i < 12 ? 'MEDIUM' : 'LOW'),
        notes: `Địa chỉ: ${customer.user.address || 'TP. Hồ Chí Minh'}`
      }
    })
    
    // Create tasks for each project
    const taskNames = [
      'Khảo sát và thiết kế',
      'Làm móng',
      'Xây tường',
      'Đổ sàn',
      'Làm mái',
      'Hoàn thiện'
    ]
    
    for (let j = 0; j < taskNames.length; j++) {
      const taskStatus = j < 3 ? 'COMPLETED' : (j < 5 ? 'IN_PROGRESS' : 'PENDING')
      const taskStartDate = new Date(startDate.getTime() + j * 7 * 24 * 60 * 60 * 1000)
      const taskDueDate = new Date(taskStartDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      
      const task = await prisma.projectTask.create({
        data: {
          projectId: project.id,
          name: taskNames[j],
          description: `${taskNames[j]} cho dự án ${projectName}`,
          status: taskStatus,
          priority: j < 2 ? 'HIGH' : (j < 4 ? 'MEDIUM' : 'LOW'),
          startDate: taskStartDate,
          dueDate: taskDueDate,
          completedAt: taskStatus === 'COMPLETED' ? taskDueDate : null,
          estimatedHours: 100 + j * 50,
          actualHours: taskStatus === 'COMPLETED' ? (100 + j * 50) * (0.9 + Math.random() * 0.3) : 0,
          progress: taskStatus === 'COMPLETED' ? 100 : (taskStatus === 'IN_PROGRESS' ? Math.floor(Math.random() * 70) + 20 : 0)
        }
      })
      
      // Add materials for tasks
      if (j >= 1 && j <= 4) { // Tasks that need materials
        const materialsForTask = []
        
        if (j === 1) { // Làm móng
          materialsForTask.push(
            { productId: products[1].id, quantity: Math.floor(Math.random() * 50) + 20, status: 'DELIVERED' }, // Xi măng PC40
            { productId: products[6].id, quantity: Math.floor(Math.random() * 10) + 5, status: 'DELIVERED' }, // Đá 1x2
            { productId: products[8].id, quantity: Math.floor(Math.random() * 10) + 5, status: 'DELIVERED' } // Cát
          )
        } else if (j === 2) { // Xây tường
          materialsForTask.push(
            { productId: products[0].id, quantity: Math.floor(Math.random() * 30) + 10, status: 'DELIVERED' }, // Xi măng PC30
            { productId: products[4].id, quantity: Math.floor(Math.random() * 3000) + 1000, status: 'DELIVERED' }, // Gạch đinh
            { productId: products[9].id, quantity: Math.floor(Math.random() * 5) + 2, status: 'DELIVERED' } // Cát vàng
          )
        } else if (j === 3) { // Đổ sàn
          materialsForTask.push(
            { productId: products[1].id, quantity: Math.floor(Math.random() * 40) + 15, status: taskStatus === 'COMPLETED' ? 'DELIVERED' : 'ORDERED' },
            { productId: products[6].id, quantity: Math.floor(Math.random() * 8) + 4, status: taskStatus === 'COMPLETED' ? 'DELIVERED' : 'ORDERED' },
            { productId: products[8].id, quantity: Math.floor(Math.random() * 8) + 4, status: taskStatus === 'COMPLETED' ? 'DELIVERED' : 'ORDERED' }
          )
        } else if (j === 4) { // Làm mái
          materialsForTask.push(
            { productId: products[3].id, quantity: Math.floor(Math.random() * 20) + 10, status: taskStatus === 'COMPLETED' ? 'DELIVERED' : 'REQUESTED' }
          )
        }
        
        for (const material of materialsForTask) {
          const product = products.find(p => p.id === material.productId)
          if (product) {
            await prisma.projectTaskMaterial.create({
              data: {
                taskId: task.id,
                productId: material.productId,
                quantity: material.quantity,
                unitPrice: product.price,
                totalPrice: product.price * material.quantity,
                status: material.status as any
              }
            })
          }
        }
      }
    }
    
    projectCount++
  }
  console.log(`✅ Created ${projectCount} projects with tasks and materials`)

  console.log('\n' + '=' .repeat(70))
  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Admin user: admin@smartbuild.vn / admin123`)
  console.log(`   - Categories: ${categories.length}`)
  console.log(`   - Suppliers: ${suppliers.length}`)
  console.log(`   - Products: ${products.length}`)
  console.log(`   - Customers: ${customerUsers.length}`)
  console.log(`   - Orders: ${orderCount}`)
  console.log(`   - Purchase Orders: ${poCount}`)
  console.log(`   - Projects: ${projectCount} (with ${projectCount * 6} tasks)`)
  console.log('\n🚀 You can now login and see data in admin dashboard!')
  console.log('=' .repeat(70))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
