import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const projects = await prisma.constructionProject.findMany({
        select: {
            id: true,
            title: true,
            location: true
        }
    })

    const seen = new Set<string>()
    const toDelete: string[] = []

    for (const p of projects) {
        const key = `${p.title}-${p.location}`
        if (seen.has(key)) {
            toDelete.push(p.id)
        } else {
            seen.add(key)
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicate projects...`)
        await prisma.constructionProject.deleteMany({
            where: {
                id: { in: toDelete }
            }
        })
        console.log('Done.')
    } else {
        console.log('No duplicates found.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
