import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest, UserRole } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { role } = await req.json()

        if (!role || !Object.values(UserRole).includes(role)) {
            return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
        }

        const userId = decoded.userId

        // 2. Update User role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: role as UserRole },
            include: {
                customer: true,
                supplier: true
            }
        })

        // 3. Create profile if it doesn't exist
        if (role === UserRole.CONTRACTOR || role === UserRole.CUSTOMER) {
            if (!updatedUser.customer) {
                const referralCode = 'REF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
                await prisma.customer.create({
                    data: {
                        userId: userId,
                        customerType: role === UserRole.CONTRACTOR ? 'REGULAR' : 'REGULAR', // Default
                        contractorVerified: role === UserRole.CONTRACTOR,
                        referralCode: referralCode
                    }
                })
            } else if (role === UserRole.CONTRACTOR) {
                // Update existing customer to be a contractor
                await prisma.customer.update({
                    where: { userId: userId },
                    data: { contractorVerified: true }
                })
            }
        } else if (role === UserRole.SUPPLIER) {
            if (!updatedUser.supplier) {
                await prisma.supplier.create({
                    data: {
                        userId: userId,
                        name: updatedUser.name,
                        email: updatedUser.email,
                        isActive: true,
                        // Add defaults for supplier fields
                        phone: updatedUser.phone || '',
                        address: updatedUser.address || ''
                    }
                })
            }
        }

        logger.info('User onboarding completed', { userId, role })

        return NextResponse.json({
            success: true,
            message: 'Role updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role
            }
        })

    } catch (error: any) {
        logger.error('Onboarding API Error:', { error: error.message })
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
