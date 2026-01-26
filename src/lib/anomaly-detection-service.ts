/**
 * Anomaly Detection Service - Layer 3 of Integrity Suite
 * 
 * Detects suspicious patterns:
 * - Multi-account detection (same IP/device)
 * - Collusion in bidding
 * - Fake reviews
 * - Unusual transactions
 */

import { prisma } from './prisma'
import { SuspiciousActivityType, AlertSeverity, AlertStatus } from '@prisma/client'
import { AuditService } from './audit-service'

interface DetectionContext {
    userId?: string
    customerId?: string
    ipAddress?: string
    deviceFingerprint?: string
    sessionId?: string
}

export class AnomalyDetectionService {

    // Thresholds for detection
    private static THRESHOLDS = {
        SAME_IP_ACCOUNTS: 3,           // Max accounts from same IP
        RAPID_WITHDRAWAL_COUNT: 5,      // Max withdrawals in 24h
        RAPID_WITHDRAWAL_AMOUNT: 50000000, // 50M VND in 24h
        SAME_BANK_DIFFERENT_NAMES: 2,   // Same bank account, different users
        BIDDING_PATTERN_SIMILARITY: 0.8, // 80% similar bidding patterns
        LOGIN_DISTANCE_KM: 500,         // Suspicious if login from >500km away in short time
        LOGIN_TIME_WINDOW_HOURS: 1      // Within 1 hour
    }

    /**
     * Track device session for fingerprinting
     */
    static async trackDeviceSession(context: DetectionContext, data: {
        userAgent: string
        platform?: string
        browser?: string
        city?: string
        country?: string
    }): Promise<void> {
        if (!context.ipAddress) return

        const fingerprint = context.deviceFingerprint ||
            this.generateFingerprint(context.ipAddress, data.userAgent)

        await prisma.deviceSession.upsert({
            where: { id: fingerprint }, // Use fingerprint as pseudo-unique
            create: {
                userId: context.userId,
                customerId: context.customerId,
                fingerprint,
                userAgent: data.userAgent,
                platform: data.platform,
                browser: data.browser,
                ipAddress: context.ipAddress,
                city: data.city,
                country: data.country,
                sessionToken: context.sessionId
            },
            update: {
                lastActiveAt: new Date(),
                userId: context.userId || undefined,
                customerId: context.customerId || undefined
            }
        }).catch(() => {
            // If upsert fails (duplicate), try create with auto-id
            return prisma.deviceSession.create({
                data: {
                    userId: context.userId,
                    customerId: context.customerId,
                    fingerprint,
                    userAgent: data.userAgent,
                    platform: data.platform,
                    browser: data.browser,
                    ipAddress: context.ipAddress!,
                    city: data.city,
                    country: data.country,
                    sessionToken: context.sessionId
                }
            })
        })
    }

    /**
     * Detect multi-account from same IP/device
     */
    static async detectMultiAccount(context: DetectionContext): Promise<boolean> {
        if (!context.ipAddress) return false

        // Find other users registered from same IP
        const recentSessions = await prisma.deviceSession.findMany({
            where: {
                ipAddress: context.ipAddress,
                userId: { not: context.userId },
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            },
            select: { userId: true, customerId: true }
        })

        const uniqueUsers = [...new Set(recentSessions.map(s => s.userId).filter(Boolean))]

        if (uniqueUsers.length >= this.THRESHOLDS.SAME_IP_ACCOUNTS) {
            await this.createAlert({
                context,
                type: 'MULTI_ACCOUNT',
                description: `${uniqueUsers.length + 1} tài khoản khác nhau từ cùng IP ${context.ipAddress}`,
                evidence: { linkedUserIds: uniqueUsers, ipAddress: context.ipAddress },
                linkedUserIds: uniqueUsers as string[],
                linkedIps: [context.ipAddress],
                riskScore: Math.min(100, 30 + (uniqueUsers.length * 15)),
                severity: uniqueUsers.length >= 5 ? 'HIGH' : 'MEDIUM'
            })
            return true
        }

        return false
    }

    /**
     * Detect rapid/unusual withdrawals
     */
    static async detectRapidWithdrawals(customerId: string): Promise<boolean> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const recentWithdrawals = await prisma.walletTransaction.findMany({
            where: {
                wallet: { customerId },
                type: 'WITHDRAWAL',
                createdAt: { gte: twentyFourHoursAgo }
            },
            select: { amount: true }
        })

        const totalAmount = recentWithdrawals.reduce((sum, w) => sum + Math.abs(w.amount), 0)
        const count = recentWithdrawals.length

        if (count >= this.THRESHOLDS.RAPID_WITHDRAWAL_COUNT ||
            totalAmount >= this.THRESHOLDS.RAPID_WITHDRAWAL_AMOUNT) {

            await this.createAlert({
                context: { customerId },
                type: 'RAPID_WITHDRAWALS',
                description: `${count} lần rút tiền trong 24h, tổng ${totalAmount.toLocaleString()}đ`,
                evidence: {
                    withdrawalCount: count,
                    totalAmount,
                    period: '24h'
                },
                riskScore: Math.min(100, 40 + (count * 5) + (totalAmount / 1000000)),
                severity: totalAmount >= this.THRESHOLDS.RAPID_WITHDRAWAL_AMOUNT * 2 ? 'CRITICAL' : 'HIGH'
            })
            return true
        }

        return false
    }

    /**
     * Detect collusion in bidding/negotiation
     */
    static async detectCollusionBidding(
        projectId: string,
        quotes: Array<{ contractorId: string; ipAddress?: string; amount: number }>
    ): Promise<boolean> {
        // Check for same IP submissions
        const ipGroups = new Map<string, string[]>()
        for (const quote of quotes) {
            if (quote.ipAddress) {
                const existing = ipGroups.get(quote.ipAddress) || []
                existing.push(quote.contractorId)
                ipGroups.set(quote.ipAddress, existing)
            }
        }

        // Find IPs with multiple contractors
        const suspiciousIps = [...ipGroups.entries()].filter(([_, contractors]) => contractors.length > 1)

        if (suspiciousIps.length > 0) {
            const allLinkedContractors = suspiciousIps.flatMap(([_, c]) => c)
            const allLinkedIps = suspiciousIps.map(([ip]) => ip)

            await this.createAlert({
                context: {},
                type: 'COLLUSION_BIDDING',
                description: `${allLinkedContractors.length} nhà thầu báo giá từ cùng IP trong dự án`,
                evidence: {
                    projectId,
                    suspiciousIps: Object.fromEntries(suspiciousIps),
                    quotes: quotes.map(q => ({ contractorId: q.contractorId, amount: q.amount }))
                },
                relatedEntityType: 'ConstructionProject',
                relatedEntityId: projectId,
                linkedUserIds: allLinkedContractors,
                linkedIps: allLinkedIps,
                riskScore: 70,
                severity: 'HIGH'
            })
            return true
        }

        // Check for price manipulation patterns (quotes too similar)
        if (quotes.length >= 3) {
            const sortedAmounts = quotes.map(q => q.amount).sort((a, b) => a - b)
            const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)]
            const tightRange = sortedAmounts.filter(a => Math.abs(a - median) / median < 0.05)

            if (tightRange.length >= 3) {
                await this.createAlert({
                    context: {},
                    type: 'PRICE_MANIPULATION',
                    description: `${tightRange.length} báo giá có giá trị gần giống nhau (chênh lệch <5%)`,
                    evidence: {
                        projectId,
                        similarPrices: tightRange,
                        medianPrice: median
                    },
                    relatedEntityType: 'ConstructionProject',
                    relatedEntityId: projectId,
                    riskScore: 50,
                    severity: 'MEDIUM'
                })
            }
        }

        return false
    }

    /**
     * Detect fake reviews (self-review, review bombing)
     */
    static async detectFakeReviews(
        contractorId: string,
        reviewerId: string,
        reviewerIp?: string
    ): Promise<boolean> {
        // Check if reviewer and contractor share IP history
        if (reviewerIp) {
            const contractorSessions = await prisma.deviceSession.findMany({
                where: {
                    customerId: contractorId,
                    ipAddress: reviewerIp
                },
                take: 1
            })

            if (contractorSessions.length > 0) {
                await this.createAlert({
                    context: { customerId: reviewerId, ipAddress: reviewerIp },
                    type: 'FAKE_REVIEWS',
                    description: 'Đánh giá từ IP trùng với nhà thầu - nghi ngờ tự đánh giá',
                    evidence: {
                        contractorId,
                        reviewerId,
                        sharedIp: reviewerIp
                    },
                    relatedEntityType: 'ContractorProfile',
                    relatedEntityId: contractorId,
                    riskScore: 80,
                    severity: 'HIGH'
                })
                return true
            }
        }

        // Check for review bombing (many reviews in short time)
        const recentReviews = await prisma.contractorReview.count({
            where: {
                contractorId,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        })

        if (recentReviews >= 10) {
            await this.createAlert({
                context: {},
                type: 'FAKE_REVIEWS',
                description: `${recentReviews} đánh giá trong 24h - nghi ngờ review bombing`,
                evidence: { contractorId, reviewCount: recentReviews },
                relatedEntityType: 'ContractorProfile',
                relatedEntityId: contractorId,
                riskScore: 60,
                severity: 'MEDIUM'
            })
        }

        return false
    }

    /**
     * Create a suspicious activity alert
     */
    private static async createAlert(data: {
        context: DetectionContext
        type: SuspiciousActivityType
        description: string
        evidence: any
        relatedEntityType?: string
        relatedEntityId?: string
        linkedUserIds?: string[]
        linkedIps?: string[]
        riskScore: number
        severity: AlertSeverity
    }): Promise<void> {
        await prisma.suspiciousActivity.create({
            data: {
                userId: data.context.userId,
                customerId: data.context.customerId,
                sessionId: data.context.sessionId,
                ipAddress: data.context.ipAddress,
                deviceFingerprint: data.context.deviceFingerprint,
                activityType: data.type,
                description: data.description,
                evidence: data.evidence,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                linkedUserIds: data.linkedUserIds || [],
                linkedIps: data.linkedIps || [],
                riskScore: data.riskScore,
                severity: data.severity,
                status: 'OPEN'
            }
        })

        // Log to audit as well
        await AuditService.log(
            { actorId: 'SYSTEM' },
            {
                action: 'ADMIN_OVERRIDE', // Using existing enum
                entityType: 'SuspiciousActivity',
                metadata: { type: data.type, description: data.description },
                severity: data.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
            }
        )

        console.log(`[ANOMALY_DETECTED] ${data.type}: ${data.description}`)
    }

    /**
     * Get pending alerts for admin dashboard
     */
    static async getPendingAlerts(filters?: {
        severity?: AlertSeverity
        type?: SuspiciousActivityType
        limit?: number
    }) {
        return prisma.suspiciousActivity.findMany({
            where: {
                status: { in: ['OPEN', 'INVESTIGATING'] },
                ...(filters?.severity && { severity: filters.severity }),
                ...(filters?.type && { activityType: filters.type })
            },
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' }
            ],
            take: filters?.limit || 50
        })
    }

    /**
     * Resolve an alert
     */
    static async resolveAlert(
        alertId: string,
        resolvedBy: string,
        resolution: string,
        status: AlertStatus = 'RESOLVED'
    ) {
        return prisma.suspiciousActivity.update({
            where: { id: alertId },
            data: {
                status,
                resolvedBy,
                resolvedAt: new Date(),
                resolution
            }
        })
    }

    /**
     * Generate device fingerprint hash
     */
    private static generateFingerprint(ip: string, userAgent: string): string {
        const crypto = require('crypto')
        return crypto.createHash('sha256')
            .update(`${ip}::${userAgent}`)
            .digest('hex')
            .substring(0, 32)
    }
}

export default AnomalyDetectionService
