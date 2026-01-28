import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Fetch all products, contractors and projects for dynamic sitemap
  const [products, contractors, projects] = await Promise.all([
    prisma.product.findMany({ select: { id: true, updatedAt: true }, where: { isActive: true } }),
    prisma.contractorProfile.findMany({ select: { id: true, updatedAt: true }, where: { isVerified: true } }),
    prisma.constructionProject.findMany({ select: { id: true, updatedAt: true }, where: { status: 'OPEN' } }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contractors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marketplace/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const contractorRoutes: MetadataRoute.Sitemap = contractors.map((c) => ({
    url: `${baseUrl}/contractors/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${baseUrl}/projects/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...contractorRoutes, ...projectRoutes]
}
