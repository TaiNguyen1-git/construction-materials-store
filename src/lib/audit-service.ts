/**
 * Audit Service - Layer 1 of Integrity Suite
 * 
 * Tracks all sensitive actions in the system for accountability
 * Every financial, security, and administrative action is logged
 */

import { prisma } from './prisma'
import { AuditAction, AuditSeverity } from '@prisma/client'

interface AuditContext {
    actorId?: string
    actorEmail?: string
    actorRole?: string
    actorIp?: string
    actorDevice?: string
}

interface AuditLogData {
    action: AuditAction
    entityType: string
    entityId?: string
    oldValue?: any
    newValue?: any
    changes?: any
    reason?: string
    metadata?: any
    severity?: AuditSeverity
}

export class AuditService {
    /**
     * Log an audit event
     */
    static async log(
        context: AuditContext,
        data: AuditLogData
    ): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    // Actor info
                    actorId: context.actorId,
                    actorEmail: context.actorEmail,
                    actorRole: context.actorRole,
                    actorIp: context.actorIp,
                    actorDevice: context.actorDevice,

                    // Action info
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,

                    // Change details
                    oldValue: data.oldValue,
                    newValue: data.newValue,
                    changes: data.changes,

                    // Context
                    reason: data.reason,
                    metadata: data.metadata,
                    severity: data.severity || 'INFO'
                }
            })
        } catch (error) {
            console.error('[AUDIT_LOG_ERROR]', error)
            // Don't throw - audit failures shouldn't break the main flow
        }
    }

    /**
     * Helper: Extract context from HTTP request
     */
    static extractContext(request: Request, user?: any): AuditContext {
        const headers = request.headers

        return {
            actorId: user?.id || headers.get('x-user-id') || undefined,
            actorEmail: user?.email,
            actorRole: user?.role,
            actorIp: headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || headers.get('x-real-ip')
                || undefined,
            actorDevice: headers.get('user-agent') || undefined
        }
    }

    /**
     * Log authentication events
     */
    static async logAuth(
        context: AuditContext,
        action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
        userId?: string,
        metadata?: any
    ) {
        await this.log(context, {
            action,
            entityType: 'User',
            entityId: userId,
            metadata,
            severity: action === 'LOGIN_FAILED' ? 'WARNING' : 'INFO'
        })
    }

    /**
     * Log financial actions
     */
    static async logFinancial(
        context: AuditContext,
        action: 'CREDIT_LIMIT_CHANGE' | 'CREDIT_APPROVAL' | 'CREDIT_HOLD' |
            'WALLET_DEPOSIT' | 'WALLET_WITHDRAWAL' | 'WALLET_ADJUSTMENT' |
            'ESCROW_DEPOSIT' | 'ESCROW_RELEASE',
        entityType: string,
        entityId: string,
        data: {
            oldValue?: any
            newValue?: any
            reason?: string
            amount?: number
        }
    ) {
        const severity: AuditSeverity =
            action === 'WALLET_ADJUSTMENT' ? 'WARNING' :
                action === 'CREDIT_HOLD' ? 'WARNING' : 'NOTICE'

        await this.log(context, {
            action,
            entityType,
            entityId,
            oldValue: data.oldValue,
            newValue: data.newValue,
            reason: data.reason,
            metadata: { amount: data.amount },
            severity
        })
    }

    /**
     * Log KYC/Verification events
     */
    static async logKYC(
        context: AuditContext,
        action: 'KYC_SUBMIT' | 'KYC_APPROVE' | 'KYC_REJECT' | 'VERIFICATION_CHANGE',
        customerId: string,
        data: {
            documentType?: string
            reason?: string
            previousStatus?: string
            newStatus?: string
        }
    ) {
        await this.log(context, {
            action,
            entityType: 'Customer',
            entityId: customerId,
            oldValue: data.previousStatus ? { status: data.previousStatus } : undefined,
            newValue: data.newStatus ? { status: data.newStatus } : undefined,
            reason: data.reason,
            metadata: { documentType: data.documentType },
            severity: action === 'KYC_REJECT' ? 'NOTICE' : 'INFO'
        })
    }

    /**
     * Log user restrictions/bans
     */
    static async logRestriction(
        context: AuditContext,
        action: 'USER_BAN' | 'USER_UNBAN',
        customerId: string,
        data: {
            restrictionType: string
            reason: string
            duration?: string
        }
    ) {
        await this.log(context, {
            action,
            entityType: 'Customer',
            entityId: customerId,
            reason: data.reason,
            metadata: {
                restrictionType: data.restrictionType,
                duration: data.duration
            },
            severity: 'WARNING'
        })
    }

    /**
     * Log admin override actions
     */
    static async logAdminOverride(
        context: AuditContext,
        entityType: string,
        entityId: string,
        data: {
            overrideType: string
            oldValue: any
            newValue: any
            reason: string
        }
    ) {
        await this.log(context, {
            action: 'ADMIN_OVERRIDE',
            entityType,
            entityId,
            oldValue: data.oldValue,
            newValue: data.newValue,
            reason: data.reason,
            metadata: { overrideType: data.overrideType },
            severity: 'CRITICAL'
        })
    }

    /**
     * Query audit logs with filters
     */
    static async query(filters: {
        actorId?: string
        action?: AuditAction
        entityType?: string
        entityId?: string
        severity?: AuditSeverity
        fromDate?: Date
        toDate?: Date
        limit?: number
    }) {
        return prisma.auditLog.findMany({
            where: {
                ...(filters.actorId && { actorId: filters.actorId }),
                ...(filters.action && { action: filters.action }),
                ...(filters.entityType && { entityType: filters.entityType }),
                ...(filters.entityId && { entityId: filters.entityId }),
                ...(filters.severity && { severity: filters.severity }),
                ...(filters.fromDate || filters.toDate) && {
                    createdAt: {
                        ...(filters.fromDate && { gte: filters.fromDate }),
                        ...(filters.toDate && { lte: filters.toDate })
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 100
        })
    }

    /**
     * Get audit trail for a specific entity
     */
    static async getEntityHistory(entityType: string, entityId: string) {
        return prisma.auditLog.findMany({
            where: {
                entityType,
                entityId
            },
            orderBy: { createdAt: 'desc' }
        })
    }
}

export default AuditService
