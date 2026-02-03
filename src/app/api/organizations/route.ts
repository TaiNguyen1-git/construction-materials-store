
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(req: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, taxCode, address } = body

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
        }

        // Create organization and add the creator as OWNER
        const organization = await (prisma as any).organization.create({
            data: {
                name,
                taxCode,
                address,
                members: {
                    create: {
                        userId,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                members: true
            }
        })

        // Also link the customer profile if it exists and isn't linked yet
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (customer && !(customer as any).organizationId) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: { organizationId: organization.id } as any
            })
        }

        return NextResponse.json({ success: true, data: organization })
    } catch (error: any) {
        console.error('Error creating organization:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const memberships = await (prisma as any).organizationMember.findMany({
            where: { userId },
            include: {
                organization: {
                    include: {
                        _count: {
                            select: { members: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: memberships.map((m: any) => ({
                ...m.organization,
                userRole: m.role,
                memberCount: m.organization._count.members
            }))
        })
    } catch (error: any) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
