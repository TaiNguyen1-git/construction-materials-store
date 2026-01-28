import { prisma } from '@/lib/prisma'
import { Metadata, ResolvingMetadata } from 'next'
import ContractorDetailView from './ContractorDetailView'
import ContractorJsonLd from '@/components/seo/ContractorJsonLd'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

async function getContractor(id: string) {
    const contractor = await prisma.contractorProfile.findUnique({
        where: { id },
    })
    return contractor
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params
    const contractor = await getContractor(id)

    if (!contractor) {
        return {
            title: 'Contractor Not Found | SmartBuild',
        }
    }

    const previousImages = (await parent).openGraph?.images || []

    return {
        title: `${contractor.displayName} | Nhà thầu Uy tín SmartBuild`,
        description: (contractor.bio || `Hồ sơ nhà thầu chuyên nghiệp ${contractor.displayName} trên hệ thống SmartBuild.`).substring(0, 160),
        openGraph: {
            title: contractor.displayName,
            description: contractor.bio?.substring(0, 160),
            images: previousImages,
            type: 'profile',
        },
        keywords: [contractor.displayName, 'nhà thầu xây dựng', 'thi công', 'SmartBuild'],
    }
}

export const revalidate = 3600

export default async function Page({ params }: Props) {
    const { id } = await params
    const contractor = await getContractor(id)

    if (!contractor) {
        notFound()
    }

    return (
        <>
            <ContractorJsonLd contractor={{
                displayName: contractor.displayName,
                description: contractor.bio || undefined,
                skills: contractor.skills,
                address: contractor.city || undefined,
                // rating and reviewCount can be fetched if needed
            }} />
            <ContractorDetailView params={Promise.resolve({ id })} />
        </>
    )
}
