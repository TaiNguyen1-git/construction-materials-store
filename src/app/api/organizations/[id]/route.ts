import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import crypto from 'crypto'
import { EmailService } from '@/lib/email-service'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Check if user is a member or a system administrator
        const isAdmin = payload?.role === 'MANAGER' || payload?.role === 'EMPLOYEE'

        if (!isAdmin) {
            const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: id,
                        userId
                    }
                }
            })

            if (!membership) {
                return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
            }
        }

        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                role: true,
                                customer: {
                                    include: {
                                        contractorProfile: true
                                    }
                                }
                            }
                        }
                    }
                },
                invitations: {
                    where: { status: 'PENDING' },
                    include: {
                        invitedBy: {
                            select: { name: true }
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()

        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: id,
                    userId
                }
            }
        })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        const updated = await prisma.organization.update({
            where: { id },
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { action, targetUserId, role } = body

        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: id,
                    userId
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
                // Check if already invited
                const existingInvite = await prisma.organizationInvitation.findUnique({
                    where: { organizationId_email: { organizationId: id, email } }
                })

                if (existingInvite && existingInvite.status === 'PENDING') {
                    return NextResponse.json({ success: false, error: 'Lời mời đã được gửi trước đó' }, { status: 400 })
                }

                // Create Invitation
                const token = crypto.randomBytes(32).toString('hex')
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

                const invitation = await prisma.organizationInvitation.create({
                    data: {
                        organizationId: id,
                        email,
                        role: role || 'BUYER',
                        intendedUserRole: body.intendedUserRole || 'CUSTOMER',
                        invitedById: userId,
                        token,
                        expiresAt
                    },
                    include: { organization: true, invitedBy: true }
                })

                // Send Email
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
                const registerLink = `${baseUrl}/register?invitation=${token}`

                await EmailService.sendOrganizationInvitation({
                    email,
                    organizationName: invitation.organization.name,
                    inviterName: invitation.invitedBy.name,
                    registerLink,
                    role: role || 'BUYER'
                })

                return NextResponse.json({
                    success: true,
                    message: 'Đã gửi lời mời tham gia qua email cho thành viên mới',
                    data: invitation
                })
            }

            // Existing user logic
            const existingMember = await prisma.organizationMember.findUnique({
                where: { organizationId_userId: { organizationId: id, userId: userToInvite.id } }
            })

            if (existingMember) {
                return NextResponse.json({ success: false, error: 'Người dùng đã là thành viên' }, { status: 400 })
            }

            const newMember = await prisma.organizationMember.create({
                data: {
                    organizationId: id,
                    userId: userToInvite.id,
                    role: role || 'BUYER'
                }
            })
            return NextResponse.json({ success: true, data: newMember })
        }

        if (action === 'revoke-invitation') {
            const { invitationId } = body
            await prisma.organizationInvitation.delete({
                where: { id: invitationId }
            })
            return NextResponse.json({ success: true, message: 'Đã thu hồi lời mời' })
        }

        if (action === 'confirm-contractor') {
            const { profileId, status } = body // VERIFIED or REJECTED
            await prisma.contractorProfile.update({
                where: { id: profileId },
                data: { onboardingStatus: status }
            })
            return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái hồ sơ' })
        }

        if (action === 'update-role') {
            const updated = await prisma.organizationMember.update({
                where: {
                    organizationId_userId: {
                        organizationId: id,
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
                        organizationId: id,
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
