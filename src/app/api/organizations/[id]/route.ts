import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = req.headers.get('x-user-id')
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Check if user is a member
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: params.id,
                    userId
                }
            }
        })

        if (!membership) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
        }

        const organization = await prisma.organization.findUnique({
            where: { id: params.id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: { orders: true }
                }
            }
        })

        return NextResponse.json({ success: true, data: organization })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = req.headers.get('x-user-id')
        const body = await req.json()

        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: params.id,
                    userId: userId || ''
                }
            }
        })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        const updated = await prisma.organization.update({
            where: { id: params.id },
            data: {
                name: body.name,
                taxCode: body.taxCode,
                address: body.address,
                logo: body.logo
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = req.headers.get('x-user-id')
        const body = await req.json()
        const { action, targetUserId, role } = body

        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: params.id,
                    userId: userId || ''
                }
            }
        })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        if (action === 'invite') {
            const { email } = body
            const userToInvite = await prisma.user.findUnique({ where: { email } })

            if (!userToInvite) {
                return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
            }

            const newMember = await prisma.organizationMember.create({
                data: {
                    organizationId: params.id,
                    userId: userToInvite.id,
                    role: role || 'BUYER'
                }
            })
            return NextResponse.json({ success: true, data: newMember })
        }

        if (action === 'update-role') {
            const updated = await prisma.organizationMember.update({
                where: {
                    organizationId_userId: {
                        organizationId: params.id,
                        userId: targetUserId
                    }
                },
                data: { role }
            })
            return NextResponse.json({ success: true, data: updated })
        }

        if (action === 'remove') {
            await prisma.organizationMember.delete({
                where: {
                    organizationId_userId: {
                        organizationId: params.id,
                        userId: targetUserId
                    }
                }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
