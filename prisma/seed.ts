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
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeCode: 'EMP001',
      department: 'Management',
      position: 'Store Manager',
      baseSalary: 5000,
      hireDate: new Date(),
    },
  })

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

  console.log('Database seeded successfully!')
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