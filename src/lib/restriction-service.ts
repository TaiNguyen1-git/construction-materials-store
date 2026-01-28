/**
 * Restriction Service - Layer 4 of Integrity Suite
 * 
 * Manages granular user restrictions:
 * - FULL_BAN: Complete account suspension
 * - MARKETPLACE_BAN: Can't bid on projects
 * - WALLET_HOLD: Can't withdraw money
 * - CREDIT_FREEZE: Can't use credit
 * - REVIEW_BAN: Can't post reviews
 * - BIDDING_BAN: Can't submit quotes
 * - PROBATION: Under watch
 */

import { prisma } from './prisma'
import { RestrictionType, AppealStatus } from '@prisma/client'
import { AuditService } from './audit-service'

interface RestrictionCheck {
    isRestricted: boolean
    type?: RestrictionType
    reason?: string
    endDate?: Date | null
    canAppeal?: boolean
}

export class RestrictionService {

    /**
     * Apply a restriction to a user/customer
     */
    static async applyRestriction(
        customerId: string,
        type: RestrictionType,
        data: {
            reason: string
            evidence?: import('@prisma/client').Prisma.InputJsonValue


            imposedBy: string
            imposedByName?: string
            durationDays?: number // null = permanent
        },
        context?: { actorIp?: string }
    ): Promise<void> {
        const endDate = data.durationDays
            ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
            : null

        await prisma.userRestriction.create({
            data: {
                customerId,
                type,
                reason: data.reason,
                evidence: data.evidence,
                isActive: true,
                endDate,
                imposedBy: data.imposedBy,
                imposedByName: data.imposedByName,
                appealStatus: 'NONE'
            }
        })

        // Log to audit
        await AuditService.logRestriction(
            { actorId: data.imposedBy, actorIp: context?.actorIp },
            'USER_BAN',
            customerId,
            {
                restrictionType: type,
                reason: data.reason,
                duration: data.durationDays ? `${data.durationDays} ngày` : 'Vĩnh viễn'
            }
        )

        // Update customer flags based on restriction type
        await this.updateCustomerFlags(customerId)
    }

    /**
     * Lift (remove) a restriction
     */
    static async liftRestriction(
        restrictionId: string,
        liftedBy: string,
        liftReason: string
    ): Promise<void> {
        const restriction = await prisma.userRestriction.findUnique({
            where: { id: restrictionId }
        })

        if (!restriction) throw new Error('Restriction not found')

        await prisma.userRestriction.update({
            where: { id: restrictionId },
            data: {
                isActive: false,
                liftedAt: new Date(),
                liftedBy,
                liftReason
            }
        })

        // Log to audit
        await AuditService.logRestriction(
            { actorId: liftedBy },
            'USER_UNBAN',
            restriction.customerId,
            {
                restrictionType: restriction.type,
                reason: liftReason
            }
        )

        // Update customer flags
        await this.updateCustomerFlags(restriction.customerId)
    }

    /**
     * Check if user has a specific restriction
     */
    static async checkRestriction(
        customerId: string,
        type: RestrictionType
    ): Promise<RestrictionCheck> {
        const restriction = await prisma.userRestriction.findFirst({
            where: {
                customerId,
                type,
                isActive: true,
                OR: [
                    { endDate: null }, // Permanent
                    { endDate: { gt: new Date() } } // Not expired
                ]
            }
        })

        if (!restriction) {
            return { isRestricted: false }
        }

        return {
            isRestricted: true,
            type: restriction.type,
            reason: restriction.reason,
            endDate: restriction.endDate,
            canAppeal: restriction.appealStatus === 'NONE' || restriction.appealStatus === 'REJECTED'
        }
    }

    /**
     * Check multiple restriction types at once
     */
    static async checkRestrictions(
        customerId: string,
        types: RestrictionType[]
    ): Promise<Map<RestrictionType, RestrictionCheck>> {
        const results = new Map<RestrictionType, RestrictionCheck>()

        for (const type of types) {
            results.set(type, await this.checkRestriction(customerId, type))
        }

        return results
    }

    /**
     * Get all active restrictions for a customer
     */
    static async getActiveRestrictions(customerId: string) {
        return prisma.userRestriction.findMany({
            where: {
                customerId,
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    /**
     * Check if user can perform marketplace actions
     */
    static async canAccessMarketplace(customerId: string): Promise<{
        allowed: boolean
        restriction?: RestrictionCheck
    }> {
        const blockingTypes: RestrictionType[] = ['FULL_BAN', 'MARKETPLACE_BAN']

        for (const type of blockingTypes) {
            const check = await this.checkRestriction(customerId, type)
            if (check.isRestricted) {
                return { allowed: false, restriction: check }
            }
        }

        return { allowed: true }
    }

    /**
     * Check if user can withdraw from wallet
     */
    static async canWithdraw(customerId: string): Promise<{
        allowed: boolean
        restriction?: RestrictionCheck
    }> {
        const blockingTypes: RestrictionType[] = ['FULL_BAN', 'WALLET_HOLD']

        for (const type of blockingTypes) {
            const check = await this.checkRestriction(customerId, type)
            if (check.isRestricted) {
                return { allowed: false, restriction: check }
            }
        }

        return { allowed: true }
    }

    /**
     * Check if user can submit quotes/bids
     */
    static async canBid(customerId: string): Promise<{
        allowed: boolean
        restriction?: RestrictionCheck
    }> {
        const blockingTypes: RestrictionType[] = ['FULL_BAN', 'MARKETPLACE_BAN', 'BIDDING_BAN']

        for (const type of blockingTypes) {
            const check = await this.checkRestriction(customerId, type)
            if (check.isRestricted) {
                return { allowed: false, restriction: check }
            }
        }

        return { allowed: true }
    }

    /**
     * Check if user can post reviews
     */
    static async canReview(customerId: string): Promise<{
        allowed: boolean
        restriction?: RestrictionCheck
    }> {
        const blockingTypes: RestrictionType[] = ['FULL_BAN', 'REVIEW_BAN']

        for (const type of blockingTypes) {
            const check = await this.checkRestriction(customerId, type)
            if (check.isRestricted) {
                return { allowed: false, restriction: check }
            }
        }

        return { allowed: true }
    }

    /**
     * Submit appeal for a restriction
     */
    static async submitAppeal(
        restrictionId: string,
        appealReason: string
    ): Promise<void> {
        const restriction = await prisma.userRestriction.findUnique({
            where: { id: restrictionId }
        })

        if (!restriction || !restriction.isActive) {
            throw new Error('Restriction not found or already lifted')
        }

        if (restriction.appealStatus === 'PENDING' || restriction.appealStatus === 'UNDER_REVIEW') {
            throw new Error('Appeal already pending')
        }

        await prisma.userRestriction.update({
            where: { id: restrictionId },
            data: {
                appealStatus: 'PENDING',
                appealReason
            }
        })
    }

    /**
     * Review an appeal
     */
    static async reviewAppeal(
        restrictionId: string,
        reviewedBy: string,
        approved: boolean
    ): Promise<void> {
        const restriction = await prisma.userRestriction.findUnique({
            where: { id: restrictionId }
        })

        if (!restriction) throw new Error('Restriction not found')

        if (approved) {
            // Approve appeal = lift restriction
            await this.liftRestriction(restrictionId, reviewedBy, 'Appeal approved')
        }

        await prisma.userRestriction.update({
            where: { id: restrictionId },
            data: {
                appealStatus: approved ? 'APPROVED' : 'REJECTED',
                appealReviewedBy: reviewedBy,
                appealReviewedAt: new Date()
            }
        })
    }

    /**
     * Expire restrictions that have passed their end date
     * Should be called by a scheduled job
     */
    static async expireRestrictions(): Promise<number> {
        const result = await prisma.userRestriction.updateMany({
            where: {
                isActive: true,
                endDate: { lte: new Date() }
            },
            data: {
                isActive: false,
                liftedAt: new Date(),
                liftReason: 'Auto-expired'
            }
        })

        return result.count
    }

    /**
     * Update customer model flags based on active restrictions
     */
    private static async updateCustomerFlags(customerId: string): Promise<void> {
        const activeRestrictions = await this.getActiveRestrictions(customerId)
        const restrictionTypes = activeRestrictions.map(r => r.type)

        // Update creditHold flag
        const shouldHoldCredit = restrictionTypes.includes('CREDIT_FREEZE') ||
            restrictionTypes.includes('FULL_BAN')

        await prisma.customer.update({
            where: { id: customerId },
            data: {
                creditHold: shouldHoldCredit
            }
        }).catch(() => {
            // Customer might not exist, ignore
        })
    }

    /**
     * Get pending appeals for admin
     */
    static async getPendingAppeals() {
        return prisma.userRestriction.findMany({
            where: {
                isActive: true,
                appealStatus: { in: ['PENDING', 'UNDER_REVIEW'] }
            },
            orderBy: { updatedAt: 'asc' }
        })
    }
}

export default RestrictionService
