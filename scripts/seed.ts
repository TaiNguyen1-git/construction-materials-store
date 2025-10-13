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

    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@smartbuild.vn',
        phone: '0123456789',
        role: 'MANAGER' as any,
        password: hashedPassword
      }
    })

    console.log('✅ Admin user created:', adminUser.email)

    // Create sample customer if not exists
    const customerPassword = await bcrypt.hash('customer123', 10)
    const existingCustomerUser = await prisma.user.findFirst({
      where: { email: 'customer@test.com' }
    })

    let customerUser
    if (!existingCustomerUser) {
      customerUser = await prisma.user.create({
        data: {
          name: 'Nguyễn Văn A',
          email: 'customer@test.com',
          phone: '0987654321',
          role: 'CUSTOMER' as any,
          password: customerPassword,
          address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM'
        }
      })

      const customer = await prisma.customer.create({
        data: {
          userId: customerUser.id
        }
      })
      console.log('✅ Sample customer created:', customerUser.email)
    } else {
      customerUser = existingCustomerUser
      console.log('✅ Sample customer already exists:', customerUser.email)
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${suppliers.length} suppliers`) 
    console.log(`   - ${createdProducts.length} products`)
    console.log(`   - 2 users (admin + customer)`)
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