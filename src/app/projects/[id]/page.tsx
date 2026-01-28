import { prisma } from '@/lib/prisma'
import { Metadata, ResolvingMetadata } from 'next'
import ProjectDetailClient from './ProjectDetailClient'
import ProjectJsonLd from '@/components/seo/ProjectJsonLd'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

async function getProject(id: string) {
    const project = await prisma.constructionProject.findUnique({
        where: { id },
    })
    return project
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
        return {
            title: 'Project Not Found | SmartBuild',
        }
    }

    const previousImages = (await parent).openGraph?.images || []

    return {
        title: `${project.title} | Dự án Marketplace SmartBuild`,
        description: (project.description || '').substring(0, 160),
        openGraph: {
            title: project.title,
            description: (project.description || '').substring(0, 160),
            images: previousImages,
            type: 'website',
        },
        keywords: [project.title, 'dự án xây dựng', 'tìm thầu', 'SmartBuild', project.city],
    }
}

export const revalidate = 1800 // projects update more frequently (30 mins)

export default async function Page({ params }: Props) {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
        notFound()
    }

    return (
        <>
            <ProjectJsonLd project={{
                title: project.title,
                description: project.description || '',
                location: project.city,
                datePosted: project.createdAt.toISOString(),
                budget: project.estimatedBudget || undefined
            }} />
            <ProjectDetailClient params={Promise.resolve({ id })} />
        </>
    )
}
