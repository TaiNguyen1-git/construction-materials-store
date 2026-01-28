import { prisma } from '@/lib/prisma'
import { Metadata, ResolvingMetadata } from 'next'
import ProductDetailClient from './ProductDetailClient'
import ProductJsonLd from '@/components/seo/ProductJsonLd'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventoryItem: {
        select: {
          availableQuantity: true
        }
      }
    }
  })
  return product
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found | SmartBuild',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | SmartBuild Materials`,
    description: (product.description || '').substring(0, 160),
    openGraph: {
      title: product.name,
      description: (product.description || '').substring(0, 160),
      images: [product.images[0], ...previousImages],
      type: 'article',
    },
    keywords: [product.name, product.category?.name || '', 'vật liệu xây dựng', 'SmartBuild'],
  }
}

export const revalidate = 3600 // revalidate at most every hour

export default async function Page({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <ProductJsonLd product={{
        name: product.name,
        description: product.description || '',
        images: product.images,
        sku: product.sku,
        price: product.price,
        unit: product.unit || 'pcs',
        category: { name: product.category?.name || 'Uncategorized' }
      }} />
      <ProductDetailClient params={Promise.resolve({ id })} />
    </>
  )
}
