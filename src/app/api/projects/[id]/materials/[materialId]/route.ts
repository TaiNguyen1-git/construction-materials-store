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

// DELETE /api/projects/[id]/materials/[materialId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, materialId: string }> }
) {
    try {
        const user = await verifyToken(request)
        if (!user || user.role === 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, materialId } = await params

        const material = await (prisma as any).projectMaterial.findUnique({
            where: { id: materialId }
        })

        if (!material || material.projectId !== id) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 })
        }

        // Update project actualCost (subtract)
        await (prisma as any).project.update({
            where: { id },
            data: {
                actualCost: {
                    decrement: material.totalPrice
                }
            }
        })

        await (prisma as any).projectMaterial.delete({
            where: { id: materialId }
        })

        return NextResponse.json({ message: 'Material removed from project' })
    } catch (error) {
        console.error('Error deleting project material:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
