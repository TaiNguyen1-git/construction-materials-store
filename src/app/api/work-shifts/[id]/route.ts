import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-shifts/[id] - Get work shift by ID
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const shift = await prisma.workShift.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            }
        })

        if (!shift) {
            return NextResponse.json({ error: 'Work shift not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: shift })
    } catch (error) {
        console.error('Error fetching work shift:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/work-shifts/[id] - Update work shift
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const body = await request.json()

        const existingShift = await prisma.workShift.findUnique({ where: { id } })
        if (!existingShift) {
            return NextResponse.json({ error: 'Work shift not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (body.date !== undefined) updateData.date = new Date(body.date)
        if (body.startTime !== undefined) updateData.startTime = body.startTime
        if (body.endTime !== undefined) updateData.endTime = body.endTime
        if (body.status !== undefined) updateData.status = body.status
        if (body.notes !== undefined) updateData.notes = body.notes

        const shift = await prisma.workShift.update({
            where: { id },
            data: updateData,
            include: {
                employee: {
                    include: { user: { select: { name: true } } }
                }
            }
        })

        return NextResponse.json({ success: true, data: shift })
    } catch (error) {
        console.error('Error updating work shift:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/work-shifts/[id] - Delete work shift
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const existingShift = await prisma.workShift.findUnique({ where: { id } })
        if (!existingShift) {
            return NextResponse.json({ error: 'Work shift not found' }, { status: 404 })
        }

        await prisma.workShift.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'Work shift deleted successfully' })
    } catch (error) {
        console.error('Error deleting work shift:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
