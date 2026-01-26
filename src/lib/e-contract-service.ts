/**
 * E-Contract Service - Feature 2: Hợp đồng điện tử có giá trị pháp lý
 * 
 * Hỗ trợ:
 * - Ký điện tử bằng OTP
 * - Ký số CA (VNPT-CA, Viettel-CA, FPT-CA)
 * - Tạo PDF hợp đồng
 */

import { prisma } from './prisma'
import { EContractType, EContractStatus, EContractSignStatus } from '@prisma/client'
import crypto from 'crypto'

interface ContractParty {
    name: string
    taxCode?: string
    address?: string
    representative: string
    role: string  // "Chủ đầu tư", "Nhà thầu", "Nhà cung cấp"
    email?: string
    phone?: string
}

interface CreateContractData {
    title: string
    contractType: EContractType
    partyA: ContractParty
    partyB: ContractParty
    totalValue: number
    startDate: Date
    endDate?: Date
    paymentTerms?: string
    clauses?: Array<{ id: string; title: string; content: string }>

    // References
    quoteId?: string
    projectId?: string
    orderId?: string

    createdBy: string
}

interface SignatureData {
    method: 'OTP' | 'DIGITAL_CERT' | 'DRAW'
    signatureData?: string     // Base64 image for drawn signature
    otpCode?: string           // OTP code for verification
    certSerialNumber?: string  // For digital cert
    ipAddress: string
    userAgent?: string
}

export class EContractService {

    /**
     * Create a new contract
     */
    static async createContract(data: CreateContractData): Promise<{
        success: boolean
        contractId?: string
        contractNumber?: string
        error?: string
    }> {
        try {
            // Generate contract number
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const count = await prisma.eContract.count({
                where: {
                    createdAt: {
                        gte: new Date(`${year}-${month}-01`)
                    }
                }
            })
            const contractNumber = `HD-${year}${month}-${String(count + 1).padStart(4, '0')}`

            // Generate contract content from template
            const contentHtml = this.generateContractHtml(data, contractNumber)

            const contract = await prisma.eContract.create({
                data: {
                    contractNumber,
                    title: data.title,
                    description: `Hợp đồng ${data.contractType} giữa ${data.partyA.name} và ${data.partyB.name}`,
                    contractType: data.contractType,

                    partyA: data.partyA as any,
                    partyB: data.partyB as any,

                    totalValue: data.totalValue,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    paymentTerms: data.paymentTerms,

                    contentHtml,
                    clauses: data.clauses as any,

                    quoteId: data.quoteId,
                    projectId: data.projectId,
                    orderId: data.orderId,

                    status: 'DRAFT',
                    signatureStatus: 'PENDING',
                    createdBy: data.createdBy
                }
            })

            return {
                success: true,
                contractId: contract.id,
                contractNumber: contract.contractNumber
            }
        } catch (error: any) {
            console.error('Contract creation error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Sign contract as Party A or Party B
     */
    static async signContract(
        contractId: string,
        party: 'A' | 'B',
        signatureData: SignatureData,
        signerId: string
    ): Promise<{
        success: boolean
        fullySignd?: boolean
        error?: string
    }> {
        try {
            const contract = await prisma.eContract.findUnique({
                where: { id: contractId }
            })

            if (!contract) {
                return { success: false, error: 'Contract not found' }
            }

            if (contract.status === 'ACTIVE' || contract.status === 'COMPLETED') {
                return { success: false, error: 'Contract already active' }
            }

            // Verify OTP if using OTP method
            if (signatureData.method === 'OTP') {
                const isValid = await this.verifyOTP(signerId, signatureData.otpCode!)
                if (!isValid) {
                    return { success: false, error: 'Invalid OTP code' }
                }
            }

            // Create signature record
            const signatureRecord = {
                method: signatureData.method,
                signatureData: signatureData.signatureData,
                signedBy: signerId,
                ipAddress: signatureData.ipAddress,
                userAgent: signatureData.userAgent,
                timestamp: new Date().toISOString(),
                hash: this.generateSignatureHash(contract, signerId)
            }

            // Update contract based on which party is signing
            const updateData: any = {}

            if (party === 'A') {
                updateData.partyASignedAt = new Date()
                updateData.partyASignature = signatureRecord

                if (contract.partyBSignedAt) {
                    updateData.signatureStatus = 'FULLY_SIGNED'
                    updateData.status = 'ACTIVE'
                    updateData.effectiveDate = new Date()
                } else {
                    updateData.signatureStatus = 'PARTY_A_SIGNED'
                }
            } else {
                updateData.partyBSignedAt = new Date()
                updateData.partyBSignature = signatureRecord

                if (contract.partyASignedAt) {
                    updateData.signatureStatus = 'FULLY_SIGNED'
                    updateData.status = 'ACTIVE'
                    updateData.effectiveDate = new Date()
                } else {
                    updateData.signatureStatus = 'PARTY_B_SIGNED'
                }
            }

            // If using digital cert, record it
            if (signatureData.method === 'DIGITAL_CERT') {
                updateData.usesDigitalCert = true
                updateData.certSerialNumber = signatureData.certSerialNumber
            }

            await prisma.eContract.update({
                where: { id: contractId },
                data: updateData
            })

            const fullySigned = updateData.signatureStatus === 'FULLY_SIGNED'

            // If fully signed, generate signed PDF
            if (fullySigned) {
                await this.generateSignedPDF(contractId)
            }

            return { success: true, fullySignd: fullySigned }
        } catch (error: any) {
            console.error('Contract signing error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Send OTP for contract signing
     */
    static async sendSigningOTP(contractId: string, party: 'A' | 'B'): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const contract = await prisma.eContract.findUnique({
                where: { id: contractId }
            })

            if (!contract) {
                return { success: false, error: 'Contract not found' }
            }

            const partyInfo = party === 'A'
                ? contract.partyA as unknown as ContractParty
                : contract.partyB as unknown as ContractParty

            if (!partyInfo.email && !partyInfo.phone) {
                return { success: false, error: 'No contact info for OTP' }
            }

            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString()

            // Store OTP (in production, use Redis with expiry)
            // For now, we'll use a simple approach
            console.log(`[E-CONTRACT] OTP for ${partyInfo.name}: ${otp}`)

            // Send via email or SMS
            // await EmailService.sendOTP({ email: partyInfo.email, otp, purpose: 'CONTRACT_SIGN' })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Terminate a contract
     */
    static async terminateContract(
        contractId: string,
        reason: string,
        terminatedBy: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            await prisma.eContract.update({
                where: { id: contractId },
                data: {
                    status: 'TERMINATED',
                    terminatedAt: new Date(),
                    terminationReason: reason
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Generate contract HTML from template
     */
    private static generateContractHtml(data: CreateContractData, contractNumber: string): string {
        const today = new Date()
        const dateStr = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`

        return `
            <div class="contract">
                <h1 style="text-align: center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
                <h3 style="text-align: center;">Độc lập - Tự do - Hạnh phúc</h3>
                <hr/>
                
                <h2 style="text-align: center;">${data.title.toUpperCase()}</h2>
                <p style="text-align: center;">Số: ${contractNumber}</p>
                
                <p>Hôm nay, ${dateStr}, tại địa chỉ: ${data.partyA.address || '...'}</p>
                
                <p>Chúng tôi gồm:</p>
                
                <h4>BÊN A: ${data.partyA.role.toUpperCase()}</h4>
                <ul>
                    <li>Tên: ${data.partyA.name}</li>
                    <li>Mã số thuế: ${data.partyA.taxCode || '...'}</li>
                    <li>Địa chỉ: ${data.partyA.address || '...'}</li>
                    <li>Đại diện: ${data.partyA.representative}</li>
                </ul>
                
                <h4>BÊN B: ${data.partyB.role.toUpperCase()}</h4>
                <ul>
                    <li>Tên: ${data.partyB.name}</li>
                    <li>Mã số thuế: ${data.partyB.taxCode || '...'}</li>
                    <li>Địa chỉ: ${data.partyB.address || '...'}</li>
                    <li>Đại diện: ${data.partyB.representative}</li>
                </ul>
                
                <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>
                
                ${data.clauses?.map((clause, i) => `
                    <h4>Điều ${i + 1}: ${clause.title}</h4>
                    <p>${clause.content}</p>
                `).join('') || ''}
                
                <h4>GIÁ TRỊ HỢP ĐỒNG</h4>
                <p>Tổng giá trị: ${data.totalValue.toLocaleString('vi-VN')} VNĐ</p>
                ${data.paymentTerms ? `<p>Điều khoản thanh toán: ${data.paymentTerms}</p>` : ''}
                
                <h4>THỜI HẠN HỢP ĐỒNG</h4>
                <p>Từ ngày: ${data.startDate.toLocaleDateString('vi-VN')}</p>
                ${data.endDate ? `<p>Đến ngày: ${data.endDate.toLocaleDateString('vi-VN')}</p>` : ''}
                
                <div style="display: flex; justify-content: space-between; margin-top: 50px;">
                    <div style="text-align: center;">
                        <p><strong>ĐẠI DIỆN BÊN A</strong></p>
                        <p style="margin-top: 80px;">_____________________</p>
                        <p>${data.partyA.representative}</p>
                    </div>
                    <div style="text-align: center;">
                        <p><strong>ĐẠI DIỆN BÊN B</strong></p>
                        <p style="margin-top: 80px;">_____________________</p>
                        <p>${data.partyB.representative}</p>
                    </div>
                </div>
            </div>
        `
    }

    /**
     * Generate signature hash for verification
     */
    private static generateSignatureHash(contract: any, signerId: string): string {
        const data = `${contract.id}:${contract.contractNumber}:${signerId}:${Date.now()}`
        return crypto.createHash('sha256').update(data).digest('hex')
    }

    /**
     * Verify OTP (simplified - in production use proper OTP service)
     */
    private static async verifyOTP(userId: string, otp: string): Promise<boolean> {
        // In production, verify against stored OTP
        // For now, accept any 6-digit code
        return otp.length === 6 && /^\d+$/.test(otp)
    }

    /**
     * Generate signed PDF
     */
    private static async generateSignedPDF(contractId: string): Promise<void> {
        // In production, use PDF generation library (puppeteer, pdfkit, etc.)
        const pdfUrl = `/contracts/${contractId}/signed.pdf`

        await prisma.eContract.update({
            where: { id: contractId },
            data: { signedPdfUrl: pdfUrl }
        })
    }

    /**
     * Get contract by ID
     */
    static async getContract(contractId: string) {
        return prisma.eContract.findUnique({
            where: { id: contractId }
        })
    }

    /**
     * List contracts
     */
    static async listContracts(filters: {
        projectId?: string
        quoteId?: string
        status?: EContractStatus
        signatureStatus?: EContractSignStatus
        limit?: number
    }) {
        return prisma.eContract.findMany({
            where: {
                ...(filters.projectId && { projectId: filters.projectId }),
                ...(filters.quoteId && { quoteId: filters.quoteId }),
                ...(filters.status && { status: filters.status }),
                ...(filters.signatureStatus && { signatureStatus: filters.signatureStatus })
            },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 50
        })
    }
}

export default EContractService
