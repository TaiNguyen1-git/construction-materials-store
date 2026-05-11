import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductJsonLd from '@/components/seo/ProductJsonLd'
import ProductDetailClient from './ProductDetailClient'
import { getProductById } from '@/lib/products'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    return { title: 'Product Not Found | SmartBuild' }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | SmartBuild Materials`,
    description: (product.description || `Mua ${product.name} chính hãng tại SmartBuild. Cam kết chất lượng, giá tốt nhất thị trường, giao hàng nhanh chóng.`).substring(0, 160),
    openGraph: {
      title: `${product.name} - Vật liệu xây dựng SmartBuild`,
      description: (product.description || `Giá tốt cho ${product.name} tại SmartBuild.`).substring(0, 160),
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 800,
          alt: product.name,
        },
        ...previousImages.map(img => typeof img === 'string' ? { url: img } : img)
      ],
      type: 'website',
      siteName: 'SmartBuild',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: (product.description || '').substring(0, 160),
      images: [product.images[0]],
    },
    keywords: [product.name, (product as any).category?.name || '', 'vật liệu xây dựng', 'giá tốt', 'chính hãng', 'SmartBuild'],
  }
}

// Generate static params for the top 100 products for faster loading
export async function generateStaticParams() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        take: 100,
        select: { id: true }
    })
    return products.map((p) => ({ id: p.id }))
}

export const revalidate = 3600 // revalidate at most every hour

export default async function Page({ params }: Props) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  // Fetch similar products on the server
  const similarProducts = await prisma.product.findMany({
      where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true
      },
      include: { category: true },
      take: 6
  })

  // Format similar products for the client side recommendation component
  const recommendations = similarProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit || 'pcs',
      images: p.images,
      category: p.category?.name || '',
      inStock: true, // simplified for recommendations
      rating: 5,
      reviewCount: 0,
      reason: 'Cùng danh mục',
      badge: 'Gợi ý'
  }))

  return (
    <>
      <ProductJsonLd product={{
        name: product.name,
        description: product.description || '',
        images: product.images,
        sku: product.sku,
        price: product.price,
        unit: product.unit || 'pcs',
        category: { name: (product as any).category?.name || 'Uncategorized' }
      }} />
      <ProductDetailClient 
        initialProduct={product as any} 
        initialSimilarProducts={recommendations}
      />
    </>
  )
}
