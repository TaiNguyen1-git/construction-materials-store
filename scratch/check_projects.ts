import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const projects = await prisma.constructionProject.findMany({
        select: {
            id: true,
            title: true,
            location: true,
            status: true
        }
    })

    console.log(`Total projects: ${projects.length}`)
    
    const groups: Record<string, string[]> = {}
    projects.forEach(p => {
        const key = `${p.title}-${p.location}`
        if (!groups[key]) groups[key] = []
        groups[key].push(p.id)
    })

    console.log('Project Groups:')
    for (const [key, ids] of Object.entries(groups)) {
        if (ids.length > 1) {
            console.log(`- ${key}: ${ids.length} copies`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
