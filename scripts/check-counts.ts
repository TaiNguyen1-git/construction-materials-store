
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const id = '6938df186c00d27e66d26931' // Xi măng
    console.log(`Inspecting Category ID: ${id}`)

    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            products: true, // Fetch all products regardless of active status
            _count: {
                select: { products: true }
            }
        }
    })

    if (!category) {
        console.log('Category not found!')
        return
    }

    console.log(`Category: ${category.name}`)
    console.log(`Total Products Linked: ${category.products.length}`)
    console.log(`Prisma Count: ${category._count.products}`)

    console.log('--- Product Details ---')
    category.products.forEach(p => {
        console.log(`- ${p.name} (Active: ${p.isActive})`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
