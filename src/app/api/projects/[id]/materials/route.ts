import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('access_token')?.value

    if (!token) return null

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        return decoded
    } catch {
        return null
    }
}

// GET /api/projects/[id]/materials - Get all materials for a project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const materials = await (prisma as any).projectMaterial.findMany({
            where: { projectId: id },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                        price: true
                    }
                }
            },
            orderBy: {
                requestedAt: 'desc'
            }
        })

        return NextResponse.json(materials)
    } catch (error) {
        console.error('Error fetching project materials:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/projects/[id]/materials - Add material to a project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyToken(request)
        if (!user || user.role === 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { productId, quantity, unitPrice, notes, status } = body

        if (!productId || !quantity) {
            return NextResponse.json({ error: 'Product and quantity are required' }, { status: 400 })
        }

        // Get product to get current price if not provided
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const price = unitPrice !== undefined ? parseFloat(unitPrice) : product.price
        const totalPrice = price * parseFloat(quantity)

        const material = await (prisma as any).projectMaterial.create({
            data: {
                projectId: id,
                productId,
                quantity: parseFloat(quantity),
                unitPrice: price,
                totalPrice,
                status: status || 'REQUESTED',
                notes: notes || ''
            },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                        price: true
                    }
                }
            }
        })

        // Update project actualCost
        await (prisma as any).project.update({
            where: { id },
            data: {
                actualCost: {
                    increment: totalPrice
                }
            }
        })

        return NextResponse.json(material, { status: 201 })
    } catch (error) {
        console.error('Error adding project material:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
