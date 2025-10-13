import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addSampleData() {
  try {
    console.log('🌱 Adding comprehensive sample data to database...')

    // Create sample categories
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

    console.log('✅ Categories created/updated:', categories.length)

    // Create sample suppliers
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

    console.log('✅ Suppliers created/updated:', suppliers.length)

    // Create more sample products
    const productData = [
      // Cement & Concrete
      {
        name: 'Xi măng Portland PCB40',
        description: 'Xi măng Portland thường PC40 chất lượng cao, phù hợp cho mọi công trình xây dựng',
        categoryId: categories[0].id,
        sku: 'XM-PCB40-001',
        price: 145000,
        costPrice: 120000,
        unit: 'bao',
        weight: 50,
        dimensions: '40x20x10',
        tags: ['Xi măng', 'Xám'],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Bê tông tươi M250',
        description: 'Bê tông tươi mác 250, đổ tại công trình, thi công nhanh chóng',
        categoryId: categories[0].id,
        sku: 'BTN-M250-001',
        price: 1150000,
        costPrice: 950000,
        unit: 'm³',
        weight: 2400,
        dimensions: 'N/A',
        tags: ['Bê tông', 'Mác 250'],
        isFeatured: true,
        isActive: true
      },
      
      // Steel
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
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Thép hộp 40x20x1.2',
        description: 'Thép hộp mạ kẽm 40x20x1.2mm, dùng cho xây dựng, nội thất',
        categoryId: categories[1].id,
        sku: 'THEP-HOP-4020',
        price: 45000,
        costPrice: 38000,
        unit: 'cây',
        weight: 4.5,
        dimensions: '6000x40x20x1.2',
        tags: ['Thép hộp', 'Mạ kẽm'],
        isFeatured: false,
        isActive: true
      },
      
      // Bricks & Tiles
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
        isFeatured: true,
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
        isFeatured: true,
        isActive: true
      },
      
      // Paint & Chemicals
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
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Chống thấm gốc bitum',
        description: 'Sơn chống thấm gốc bitum, chống thấm tuyệt đối cho công trình',
        categoryId: categories[3].id,
        sku: 'CT-GOC-BITUM',
        price: 350000,
        costPrice: 280000,
        unit: 'thùng',
        weight: 20,
        dimensions: '30x30x40',
        tags: ['Chống thấm', 'Bitum'],
        isFeatured: false,
        isActive: true
      },
      
      // Electrical & Plumbing
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
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Dây điện Cadivi 2x1.5',
        description: 'Dây điện Cadivi 2 ruột tiết diện 1.5mm², cách điện PVC',
        categoryId: categories[4].id,
        sku: 'DAY-CADIVI-2X15',
        price: 12000,
        costPrice: 9500,
        unit: 'mét',
        weight: 0.15,
        dimensions: 'N/A',
        tags: ['Đồng', '2 ruột'],
        isFeatured: false,
        isActive: true
      }
    ]

    // Create products and inventory items
    const products = []
    for (const productInfo of productData) {
      const existing = await prisma.product.findFirst({
        where: { sku: productInfo.sku }
      })
      if (!existing) {
        const product = await prisma.product.create({ data: productInfo })
        products.push(product)
        
        // Create inventory item
        await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            quantity: Math.floor(Math.random() * 200) + 50, // Random stock 50-250
            availableQuantity: Math.floor(Math.random() * 200) + 50,
            reservedQuantity: 0,
            minStockLevel: 20,
            reorderPoint: 30
          }
        })
      } else {
        products.push(existing)
      }
      
      console.log(`✅ Product created/updated: ${existing ? existing.name : productInfo.name}`)
    }

    // Create a sample customer
    const customerPassword = await bcrypt.hash('customer123', 10)
    let customerUser = await prisma.user.findFirst({
      where: { email: 'khachhang@test.com' }
    })
    
    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          name: 'Khách hàng test',
          email: 'khachhang@test.com',
          phone: '0987654321',
          role: 'CUSTOMER',
          password: customerPassword,
          address: '123 Đường ABC, Quận XYZ, TP.HCM'
        }
      })
    }

    // Create customer record if not exists
    let customer = await prisma.customer.findFirst({
      where: { userId: customerUser.id }
    })
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: customerUser.id,
          customerType: 'REGULAR'
        }
      })
    }

    console.log('✅ Sample customer created/updated:', customerUser.email)

    // Create sample orders
    let order = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-001' }
    })
    
    if (!order) {
      order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-001',
          customerId: customer.id,
          customerType: 'REGISTERED',
          status: 'CONFIRMED',
          totalAmount: 2500000,
          taxAmount: 250000,
          netAmount: 2750000,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PAID',
          notes: 'Đơn hàng mẫu cho demo'
        }
      })
    }

    // Add order items
    const sampleProducts = await prisma.product.findMany({
      take: 3
    })

    for (let i = 0; i < sampleProducts.length; i++) {
      // Check if order item already exists
      const existingOrderItem = await prisma.orderItem.findFirst({
        where: {
          orderId: order.id,
          productId: sampleProducts[i].id
        }
      })
      
      if (!existingOrderItem) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: sampleProducts[i].id,
            quantity: i + 1,
            unitPrice: sampleProducts[i].price,
            totalPrice: (i + 1) * sampleProducts[i].price
          }
        })
      }
    }

    console.log('✅ Sample order created/updated:', order.orderNumber)

    console.log('🎉 Comprehensive sample data added successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${suppliers.length} suppliers`)
    console.log(`   - ${products.length} products`)
    console.log(`   - 1 customer`)
    console.log(`   - 1 order with items`)
    console.log('')
    console.log('🔑 Login credentials:')
    console.log('   Customer: khachhang@test.com / customer123')

  } catch (error) {
    console.error('❌ Error adding sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleData()