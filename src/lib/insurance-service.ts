/**
 * Insurance Service - Feature 3: Bảo hiểm công trình
 * 
 * Quản lý bảo hiểm cho các dự án xây dựng:
 * - Bảo hiểm mọi rủi ro xây dựng (CAR)
 * - Bảo hiểm trách nhiệm dân sự
 * - Bảo hiểm tai nạn lao động
 */

import { prisma } from './prisma'
import { InsuranceType, InsuranceStatus, ClaimStatus } from '@prisma/client'

interface CreateInsuranceData {
    projectId?: string
    quoteId?: string
    contractId?: string

    insurerName: string
    insurerCode?: string

    insuranceType: InsuranceType
    coverageAmount: number
    deductible?: number
    premium: number

    effectiveDate: Date
    expiryDate: Date

    insuredName: string
    insuredTaxCode?: string
    insuredAddress?: string

    beneficiaryName?: string
    beneficiaryInfo?: any

    policyDocUrl?: string
}

interface CreateClaimData {
    insuranceId: string

    incidentDate: Date
    description: string
    damageType: string
    estimatedLoss: number
    claimAmount: number

    photos?: string[]
    documents?: string[]
    witnessInfo?: any
}

export class InsuranceService {

    /**
     * Calculate suggested premium based on project value and type
     */
    static calculatePremium(
        projectValue: number,
        insuranceType: InsuranceType,
        durationMonths: number
    ): {
        premium: number
        coverageAmount: number
        rate: number
    } {
        // Base rates per insurance type (per year, as % of coverage)
        const baseRates: Record<InsuranceType, number> = {
            CONSTRUCTION_ALL_RISK: 0.25,       // 0.25% of project value
            LIABILITY: 0.15,                    // 0.15%
            WORKERS_COMPENSATION: 0.30,         // 0.30%
            EQUIPMENT: 0.50,                    // 0.50%
            MATERIAL_TRANSIT: 0.20,             // 0.20%
            PROFESSIONAL_INDEMNITY: 0.35        // 0.35%
        }

        const rate = baseRates[insuranceType] || 0.25
        const coverageAmount = projectValue  // 100% coverage by default

        // Prorate for duration
        const annualPremium = coverageAmount * (rate / 100)
        const premium = annualPremium * (durationMonths / 12)

        return {
            premium: Math.round(premium),
            coverageAmount,
            rate
        }
    }

    /**
     * Create insurance policy
     */
    static async createPolicy(data: CreateInsuranceData): Promise<{
        success: boolean
        policyId?: string
        policyNumber?: string
        error?: string
    }> {
        try {
            // Generate policy number
            const year = new Date().getFullYear()
            const count = await prisma.projectInsurance.count({
                where: {
                    createdAt: {
                        gte: new Date(`${year}-01-01`)
                    }
                }
            })
            const typeCode = data.insuranceType.substring(0, 3).toUpperCase()
            const policyNumber = `BH-${typeCode}-${year}-${String(count + 1).padStart(5, '0')}`

            const policy = await prisma.projectInsurance.create({
                data: {
                    projectId: data.projectId,
                    quoteId: data.quoteId,
                    contractId: data.contractId,

                    policyNumber,
                    insurerName: data.insurerName,
                    insurerCode: data.insurerCode,

                    insuranceType: data.insuranceType,
                    coverageAmount: data.coverageAmount,
                    deductible: data.deductible || 0,
                    premium: data.premium,

                    effectiveDate: data.effectiveDate,
                    expiryDate: data.expiryDate,

                    insuredName: data.insuredName,
                    insuredTaxCode: data.insuredTaxCode,
                    insuredAddress: data.insuredAddress,

                    beneficiaryName: data.beneficiaryName,
                    beneficiaryInfo: data.beneficiaryInfo,

                    policyDocUrl: data.policyDocUrl,
                    status: 'PENDING'
                }
            })

            return {
                success: true,
                policyId: policy.id,
                policyNumber: policy.policyNumber
            }
        } catch (error: any) {
            console.error('Create insurance error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Activate insurance policy
     */
    static async activatePolicy(policyId: string): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const policy = await prisma.projectInsurance.findUnique({
                where: { id: policyId }
            })

            if (!policy) {
                return { success: false, error: 'Policy not found' }
            }

            if (new Date() < policy.effectiveDate) {
                return { success: false, error: 'Policy not yet effective' }
            }

            await prisma.projectInsurance.update({
                where: { id: policyId },
                data: {
                    status: 'ACTIVE',
                    approvedAt: new Date()
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * File an insurance claim
     */
    static async fileClaim(data: CreateClaimData): Promise<{
        success: boolean
        claimId?: string
        claimNumber?: string
        error?: string
    }> {
        try {
            const policy = await prisma.projectInsurance.findUnique({
                where: { id: data.insuranceId }
            })

            if (!policy) {
                return { success: false, error: 'Insurance policy not found' }
            }

            if (policy.status !== 'ACTIVE') {
                return { success: false, error: 'Policy is not active' }
            }

            if (data.incidentDate < policy.effectiveDate || data.incidentDate > policy.expiryDate) {
                return { success: false, error: 'Incident date outside policy period' }
            }

            if (data.claimAmount > policy.coverageAmount - policy.totalClaimAmount) {
                return { success: false, error: 'Claim amount exceeds remaining coverage' }
            }

            // Generate claim number
            const year = new Date().getFullYear()
            const count = await prisma.insuranceClaim.count()
            const claimNumber = `CLM-${year}-${String(count + 1).padStart(6, '0')}`

            const claim = await prisma.insuranceClaim.create({
                data: {
                    insuranceId: data.insuranceId,
                    claimNumber,
                    incidentDate: data.incidentDate,
                    description: data.description,
                    damageType: data.damageType,
                    estimatedLoss: data.estimatedLoss,
                    claimAmount: data.claimAmount,
                    photos: data.photos || [],
                    documents: data.documents || [],
                    witnessInfo: data.witnessInfo,
                    status: 'SUBMITTED'
                }
            })

            // Update policy claim count
            await prisma.projectInsurance.update({
                where: { id: data.insuranceId },
                data: {
                    claimCount: { increment: 1 },
                    status: 'CLAIMED'
                }
            })

            return {
                success: true,
                claimId: claim.id,
                claimNumber: claim.claimNumber
            }
        } catch (error: any) {
            console.error('File claim error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Review and approve/reject claim
     */
    static async reviewClaim(
        claimId: string,
        reviewedBy: string,
        decision: 'APPROVED' | 'REJECTED',
        data: {
            approvedAmount?: number
            reviewNotes?: string
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const claim = await prisma.insuranceClaim.findUnique({
                where: { id: claimId },
                include: { insurance: true }
            })

            if (!claim) {
                return { success: false, error: 'Claim not found' }
            }

            await prisma.insuranceClaim.update({
                where: { id: claimId },
                data: {
                    status: decision,
                    approvedAmount: decision === 'APPROVED' ? data.approvedAmount : null,
                    reviewedBy,
                    reviewedAt: new Date(),
                    reviewNotes: data.reviewNotes
                }
            })

            // If approved, update total claim amount on policy
            if (decision === 'APPROVED' && data.approvedAmount) {
                await prisma.projectInsurance.update({
                    where: { id: claim.insuranceId },
                    data: {
                        totalClaimAmount: { increment: data.approvedAmount }
                    }
                })
            }

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark claim as paid
     */
    static async markClaimPaid(claimId: string): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            await prisma.insuranceClaim.update({
                where: { id: claimId },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get active policies for a project
     */
    static async getProjectPolicies(projectId: string) {
        return prisma.projectInsurance.findMany({
            where: {
                projectId,
                status: { in: ['ACTIVE', 'CLAIMED'] }
            },
            include: { claims: true }
        })
    }

    /**
     * Get policy details
     */
    static async getPolicy(policyId: string) {
        return prisma.projectInsurance.findUnique({
            where: { id: policyId },
            include: { claims: true }
        })
    }

    /**
     * Check and expire outdated policies
     */
    static async expirePolicies(): Promise<number> {
        const result = await prisma.projectInsurance.updateMany({
            where: {
                status: 'ACTIVE',
                expiryDate: { lt: new Date() }
            },
            data: { status: 'EXPIRED' }
        })

        return result.count
    }

    /**
     * Get insurance options for a project
     */
    static getInsuranceOptions(projectValue: number, durationMonths: number): Array<{
        type: InsuranceType
        name: string
        description: string
        premium: number
        coverageAmount: number
        recommended: boolean
    }> {
        const types: Array<{
            type: InsuranceType
            name: string
            description: string
            recommended: boolean
        }> = [
                {
                    type: 'CONSTRUCTION_ALL_RISK',
                    name: 'Bảo hiểm mọi rủi ro xây dựng (CAR)',
                    description: 'Bảo vệ công trình khỏi thiệt hại vật chất do thiên tai, hỏa hoạn, sụp đổ',
                    recommended: true
                },
                {
                    type: 'LIABILITY',
                    name: 'Bảo hiểm trách nhiệm dân sự',
                    description: 'Bồi thường cho bên thứ ba nếu công trình gây thiệt hại',
                    recommended: true
                },
                {
                    type: 'WORKERS_COMPENSATION',
                    name: 'Bảo hiểm tai nạn lao động',
                    description: 'Bảo vệ công nhân trong quá trình thi công',
                    recommended: true
                },
                {
                    type: 'EQUIPMENT',
                    name: 'Bảo hiểm thiết bị máy móc',
                    description: 'Bảo vệ máy móc, thiết bị thi công',
                    recommended: false
                },
                {
                    type: 'MATERIAL_TRANSIT',
                    name: 'Bảo hiểm vận chuyển vật liệu',
                    description: 'Bảo vệ vật liệu trong quá trình vận chuyển',
                    recommended: false
                }
            ]

        return types.map(t => {
            const calc = this.calculatePremium(projectValue, t.type, durationMonths)
            return {
                ...t,
                premium: calc.premium,
                coverageAmount: calc.coverageAmount
            }
        })
    }
}

export default InsuranceService
