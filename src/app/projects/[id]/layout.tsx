import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params

    try {
        const project = await prisma.constructionProject.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                city: true,
                estimatedBudget: true,
                isUrgent: true,
                projectType: true
            }
        })

        if (!project) {
            return {
                title: 'Dự án không tồn tại | SmartBuild',
            }
        }

        const formatBudget = (amount: number | null) => {
            if (!amount) return 'Thương lượng'
            if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`
            if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu`
            return `${amount.toLocaleString('vi-VN')}đ`
        }

        const title = `${project.isUrgent ? '🔥 ' : ''}${project.title} | SmartBuild`
        const description = `📍 ${project.city} | 💰 ${formatBudget(project.estimatedBudget)} - ${project.description?.slice(0, 150) || 'Tìm nhà thầu uy tín cho dự án xây dựng'}`

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartbuild.vn'

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                url: `${baseUrl}/projects/${id}`,
                siteName: 'SmartBuild - Sàn kết nối nhà thầu',
                images: [
                    {
                        url: `${baseUrl}/api/og/projects/${id}`,
                        width: 1200,
                        height: 630,
                        alt: project.title
                    }
                ]
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [`${baseUrl}/api/og/projects/${id}`]
            },
            other: {
                'og:locale': 'vi_VN'
            }
        }
    } catch (error) {
        console.error('Error generating metadata:', error)
        return {
            title: 'Dự án xây dựng | SmartBuild',
        }
    }
}

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
