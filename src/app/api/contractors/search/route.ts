import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')?.trim()

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, results: { projects: [], orders: [], products: [] } })
        }

        // Parallel search execution
        const [projects, orders, products] = await Promise.all([
            // 1. Search Marketplace Projects (ConstructionProject model)
            prisma.constructionProject.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { city: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ],
                    status: 'OPEN' // Only find open projects
                },
                take: 3,
                select: { id: true, title: true, city: true, estimatedBudget: true }
            }),

            // 2. Search My Orders (Personal)
            prisma.order.findMany({
                where: {
                    customerId: userId,
                    OR: [
                        { orderNumber: { contains: query, mode: 'insensitive' } } // Fix: Search by orderNumber
                    ]
                },
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true }
            }),

            // 3. Search Products (For buying)
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ],
                    isActive: true
                },
                take: 3,
                select: { id: true, name: true, price: true, images: true } // Fix: Select images array
            })
        ])

        return NextResponse.json({
            success: true,
            results: {
                projects: projects.map(p => ({
                    id: p.id,
                    type: 'project',
                    title: p.title,
                    subtitle: `${p.city} • ${p.estimatedBudget ? new Intl.NumberFormat('vi-VN').format(p.estimatedBudget) + 'đ' : 'Thỏa thuận'}`,
                    url: `/projects/${p.id}`
                })),
                orders: orders.map(o => ({
                    id: o.id,
                    type: 'order',
                    title: `Đơn hàng #${o.orderNumber}`,
                    subtitle: `${new Intl.NumberFormat('vi-VN').format(o.totalAmount)}đ • ${o.status}`,
                    url: `/contractor/orders/${o.id}`
                })),
                products: products.map(p => ({
                    id: p.id,
                    type: 'product',
                    title: p.name,
                    subtitle: `${new Intl.NumberFormat('vi-VN').format(p.price)}đ`,
                    url: `/products/${p.id}`,
                    image: p.images && p.images.length > 0 ? p.images[0] : null // Fix: Get first image
                }))
            }
        })

    } catch (error: any) {
        console.error('Search API error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
