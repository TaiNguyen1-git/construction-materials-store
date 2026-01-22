
import { prisma } from './prisma'
// @ts-ignore
import { DisputeStatus, DisputeType } from '@prisma/client'

export const disputeService = {
    /**
     * Open a new dispute
     */
    async openDispute(data: {
        orderId?: string,
        projectId?: string,
        customerId?: string,
        contractorId?: string,
        type: DisputeType,
        reason: string,
        description: string,
        evidence: string[] // Array of image URLs
    }) {
        return await (prisma as any).dispute.create({
            data: {
                orderId: data.orderId,
                projectId: data.projectId,
                customerId: data.customerId,
                contractorId: data.contractorId,
                type: data.type,
                reason: data.reason,
                description: data.description,
                evidence: {
                    create: data.evidence.map(url => ({
                        imageUrl: url
                    }))
                }
            },
            include: {
                evidence: true,
                customer: { include: { user: true } },
                contractor: true
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
    async resolveDispute(disputeId: string, resolution: string, status: DisputeStatus, adminId: string) {
        return await (prisma as any).dispute.update({
            where: { id: disputeId },
            data: {
                resolution,
                status,
                resolvedAt: new Date(),
                resolvedBy: adminId
            }
        })
    }
}
