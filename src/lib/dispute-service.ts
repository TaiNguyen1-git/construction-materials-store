
import { prisma } from './prisma'
// @ts-ignore
import { DisputeStatus, DisputeType } from '@prisma/client'
import { RestrictionService } from './restriction-service'

export const disputeService = {
    /**
     * Open a new dispute
     */
    async openDispute(data: {
        orderId?: string,
        projectId?: string,
        customerId?: string,
        contractorId?: string,
        supplierId?: string,
        type: DisputeType,
        reason: string,
        description: string,
        evidence: string[], // Array of image URLs
        reporterId?: string
    }) {
        return await (prisma as any).dispute.create({
            data: {
                orderId: data.orderId,
                projectId: data.projectId,
                customerId: data.customerId,
                contractorId: data.contractorId,
                supplierId: data.supplierId,
                type: data.type,
                reason: data.reason,
                description: data.description,
                reporterId: data.reporterId,
                evidence: {
                    create: data.evidence.map(url => ({
                        imageUrl: url
                    }))
                }
            },
            include: {
                evidence: true,
                customer: { include: { user: true } },
                contractor: true,
                supplier: true
            }
        })
    },

    /**
     * Get disputes for a customer
     */
    async getCustomerDisputes(customerId: string) {
        return await (prisma as any).dispute.findMany({
            where: { customerId },
            include: {
                evidence: true,
                contractor: true,
                order: true,
                comments: {
                    include: { author: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    },

    /**
     * Get disputes for a contractor
     */
    async getContractorDisputes(contractorId: string) {
        return await (prisma as any).dispute.findMany({
            where: { contractorId },
            include: {
                evidence: true,
                customer: { include: { user: true } },
                order: true,
                comments: {
                    include: { author: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    },

    /**
     * Get all disputes for admin
     */
    async getAllDisputes() {
        return await (prisma as any).dispute.findMany({
            include: {
                evidence: true,
                customer: { include: { user: true } },
                contractor: true,
                supplier: true,
                order: true,
                comments: {
                    include: { author: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    },

    /**
     * Add a comment to a dispute
     */
    async addComment(data: {
        disputeId: string,
        authorId: string,
        content: string,
        attachments?: string[]
    }) {
        return await (prisma as any).disputeComment.create({
            data: {
                disputeId: data.disputeId,
                authorId: data.authorId,
                content: data.content,
                attachments: data.attachments || []
            },
            include: {
                author: true
            }
        })
    },

    /**
     * Resolve a dispute
     */
    async resolveDispute(
        disputeId: string, 
        resolution: string, 
        status: DisputeStatus, 
        adminId: string,
        options?: {
            banDuration?: number | null,
            banTarget?: 'ACCOUNT' | 'IP'
        }
    ) {
        const updatedDispute = await (prisma as any).dispute.update({
            where: { id: disputeId },
            data: {
                resolution,
                status,
                resolvedAt: new Date(),
                resolvedBy: adminId
            },
            include: {
                customer: { include: { user: true } }
            }
        })

        // Notify the reporter if exists
        if (updatedDispute.reporterId) {
            try {
                const { createDisputeUpdateNotification } = await import('./notification-service')
                const admin = await (prisma as any).user.findUnique({ where: { id: adminId }, select: { name: true } })
                
                await createDisputeUpdateNotification({
                    disputeId: updatedDispute.id,
                    status: updatedDispute.status,
                    resolution: updatedDispute.resolution,
                    adminName: admin?.name || 'Admin',
                    targetId: updatedDispute.reporterId
                })
            } catch (err) {
                console.error('Failed to send dispute notification:', err)
            }
        }

        // 3. APPLY ENFORCEMENT IF IT'S A REPORT AND RESOLVED
        if (status === 'RESOLVED' && (updatedDispute.reporterId || updatedDispute.description.includes('Báo cáo từ Chat Admin'))) {
            try {
                const targetId = updatedDispute.customerId
                const description = updatedDispute.description || ''
                // If banDuration is null (permanent), we pass undefined to use the service default or 36500
                const finalDuration = options?.banDuration === null ? undefined : (options?.banDuration ?? 36500)
                
                if (targetId) {
                    // Ban registered user
                    await RestrictionService.applyRestriction(targetId, 'FULL_BAN', {
                        reason: `[TỰ ĐỘNG] Vi phạm được xác nhận qua Khiếu nại #${updatedDispute.id.slice(-6).toUpperCase()}: ${resolution}`,
                        imposedBy: adminId,
                        durationDays: finalDuration
                    })
                } else {
                    // Try to extract Guest ID from description
                    const guestMatch = description.match(/GUEST ID: (guest_[a-f0-9]+)/)
                    if (guestMatch) {
                        const guestId = guestMatch[1]
                        
                        await RestrictionService.applyRestriction(guestId, 'FULL_BAN', {
                            reason: `[TỰ ĐỘNG] Khách vãng lai vi phạm: ${resolution}`,
                            imposedBy: adminId,
                            durationDays: finalDuration
                        })
                    }
                }
            } catch (err) {
                console.error('Failed to apply automatic enforcement on dispute resolution:', err)
            }
        }

        return updatedDispute
    }
}
