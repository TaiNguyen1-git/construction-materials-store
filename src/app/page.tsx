import { prisma } from '@/lib/prisma'
import HomeClient from './HomeClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartBuild | Hệ thống Cung ứng Vật tư & Nhà thầu Xây dựng Công nghệ',
  description: 'SmartBuild - Nền tảng thương mại điện tử vật liệu xây dựng hàng đầu. Kết nối nhà công cấp uy tín, đội ngũ nhà thầu chuyên nghiệp và giải pháp tính toán vật tư thông minh AI.',
}

export const revalidate = 1800 // Revalidate every 30 minutes

async function getInitialData() {
  try {
    const [featuredProducts, categories, productCount, customerCount, orderCount, banners, contractors] = await Promise.all([
      // 1. Featured Products
      prisma.product.findMany({
        where: { isFeatured: true, isActive: true },
        take: 8,
        include: {
          category: { select: { id: true, name: true } },
          inventoryItem: { select: { availableQuantity: true } }
        },
        orderBy: { createdAt: 'desc' }
      }).then(p => p.length > 0 ? p : prisma.product.findMany({
        where: { isActive: true },
        take: 8,
        include: {
          category: { select: { id: true, name: true } },
          inventoryItem: { select: { availableQuantity: true } }
        },
        orderBy: { createdAt: 'desc' }
      })),

      // 2. Categories
      prisma.category.findMany({
        take: 8,
        orderBy: { name: 'asc' }
      }),

      // 3. Stats
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),

      // 4. Banners
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      }),

      // 5. Featured Contractors
      prisma.contractorProfile.findMany({
        where: { isVerified: true },
        take: 5,
        orderBy: { avgRating: 'desc' }
      })
    ])

    return {
      featuredProducts: JSON.parse(JSON.stringify(featuredProducts)),
      categories: JSON.parse(JSON.stringify(categories)),
      stats: {
        totalProducts: productCount,
        totalCustomers: customerCount,
        activeOrders: orderCount
      },
      banners: banners.map(b => ({
        image: b.imageUrl,
        tag: b.tag,
        title: b.title,
        sub: b.description,
        link: b.link
      })),
      featuredContractors: JSON.parse(JSON.stringify(contractors))
    }
  } catch (error) {
    console.error('Error pre-fetching home data:', error)
    return null
  }
}

export default async function Page() {
  const initialData = await getInitialData()

  return <HomeClient
    initialFeaturedProducts={initialData?.featuredProducts}
    initialCategories={initialData?.categories}
    initialStats={initialData?.stats}
    initialBanners={initialData?.banners}
    initialFeaturedContractors={initialData?.featuredContractors}
  />
}