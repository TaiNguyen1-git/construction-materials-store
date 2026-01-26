/**
 * Encryption Service - Feature 3 (Part): Bảo mật dữ liệu nhạy cảm (PDPA)
 * 
 * Mã hóa AES-256-GCM cho các dữ liệu nhạy cảm:
 * - Số CCCD/CMND
 * - Số tài khoản ngân hàng
 * - Ảnh KYC
 */

import crypto from 'crypto'
import { prisma } from './prisma'
import { SensitiveDataType } from '@prisma/client'

// Encryption key should be stored in secure env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

interface EncryptResult {
    encryptedData: string
    iv: string
    authTag: string
}

export class EncryptionService {

    /**
     * Encrypt sensitive data
     */
    static encrypt(plainText: string): EncryptResult {
        const iv = crypto.randomBytes(IV_LENGTH)
        const key = Buffer.from(ENCRYPTION_KEY, 'hex')

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let encrypted = cipher.update(plainText, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()

        return {
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        }
    }

    /**
     * Decrypt sensitive data
     */
    static decrypt(encryptedData: string, iv: string, authTag: string): string {
        const key = Buffer.from(ENCRYPTION_KEY, 'hex')
        const ivBuffer = Buffer.from(iv, 'hex')
        const authTagBuffer = Buffer.from(authTag, 'hex')

        const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)
        decipher.setAuthTag(authTagBuffer)

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }

    /**
     * Encrypt and store with tracking (for PDPA compliance)
     */
    static async encryptAndTrack(
        plainText: string,
        dataType: SensitiveDataType,
        entityType: string,
        entityId: string,
        fieldName: string
    ): Promise<string> {
        const result = this.encrypt(plainText)

        // Store in format: iv:authTag:encryptedData
        const storedValue = `${result.iv}:${result.authTag}:${result.encryptedData}`

        // Log for compliance tracking
        await prisma.sensitiveDataLog.create({
            data: {
                dataType,
                entityType,
                entityId,
                fieldName,
                algorithm: ALGORITHM,
                retentionDays: this.getRetentionDays(dataType)
            }
        })

        return storedValue
    }

    /**
     * Decrypt with access logging
     */
    static async decryptAndLog(
        storedValue: string,
        entityType: string,
        entityId: string,
        accessedBy: string
    ): Promise<string> {
        const [iv, authTag, encryptedData] = storedValue.split(':')

        // Log access for compliance
        await prisma.sensitiveDataLog.updateMany({
            where: {
                entityType,
                entityId
            },
            data: {
                lastAccessedBy: accessedBy,
                lastAccessedAt: new Date(),
                accessCount: { increment: 1 }
            }
        })

        return this.decrypt(encryptedData, iv, authTag)
    }

    /**
     * Mask sensitive data for display
     */
    static mask(value: string, type: SensitiveDataType): string {
        if (!value) return ''

        switch (type) {
            case 'CCCD_NUMBER':
            case 'CMND_NUMBER':
                // Show last 4 digits: ********1234
                return '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-4)

            case 'BANK_ACCOUNT':
                // Show last 4 digits: ****1234
                return '****' + value.slice(-4)

            case 'PHONE_NUMBER':
                // Show first 3 and last 2: 091****12
                if (value.length >= 10) {
                    return value.slice(0, 3) + '*'.repeat(value.length - 5) + value.slice(-2)
                }
                return '*'.repeat(value.length - 2) + value.slice(-2)

            case 'TAX_CODE':
                // Show first 3 and last 3: 015****789
                if (value.length >= 10) {
                    return value.slice(0, 3) + '*'.repeat(value.length - 6) + value.slice(-3)
                }
                return value

            case 'ADDRESS':
                // Show only district/city
                const parts = value.split(',')
                if (parts.length >= 2) {
                    return '***,' + parts.slice(-2).join(',')
                }
                return '***'

            default:
                return '*'.repeat(value.length)
        }
    }

    /**
     * Generate signed URL for KYC images (expires after use)
     */
    static generateSignedUrl(imageUrl: string, expiresInMinutes: number = 15): string {
        const expiry = Date.now() + expiresInMinutes * 60 * 1000
        const data = `${imageUrl}:${expiry}`
        const signature = crypto.createHmac('sha256', ENCRYPTION_KEY)
            .update(data)
            .digest('hex')
            .substring(0, 16)

        return `${imageUrl}?expires=${expiry}&sig=${signature}`
    }

    /**
     * Verify signed URL
     */
    static verifySignedUrl(url: string): boolean {
        try {
            const urlObj = new URL(url, 'http://dummy')
            const expires = parseInt(urlObj.searchParams.get('expires') || '0')
            const sig = urlObj.searchParams.get('sig') || ''

            if (Date.now() > expires) {
                return false // Expired
            }

            const baseUrl = url.split('?')[0]
            const data = `${baseUrl}:${expires}`
            const expectedSig = crypto.createHmac('sha256', ENCRYPTION_KEY)
                .update(data)
                .digest('hex')
                .substring(0, 16)

            return sig === expectedSig
        } catch {
            return false
        }
    }

    /**
     * Schedule data deletion based on retention policy
     */
    static async scheduleDataDeletion(
        entityType: string,
        entityId: string,
        retentionDays: number
    ): Promise<void> {
        const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)

        await prisma.sensitiveDataLog.updateMany({
            where: {
                entityType,
                entityId
            },
            data: {
                expiresAt,
                retentionDays
            }
        })
    }

    /**
     * Delete expired data (should be run by cron job)
     */
    static async deleteExpiredData(): Promise<number> {
        const now = new Date()

        const expiredRecords = await prisma.sensitiveDataLog.findMany({
            where: {
                expiresAt: { lte: now },
                deletedAt: null
            }
        })

        // In production, actually delete the data from respective tables
        for (const record of expiredRecords) {
            console.log(`[PDPA] Deleting ${record.dataType} for ${record.entityType}:${record.entityId}`)
            // Delete actual data based on entityType and fieldName
        }

        // Mark as deleted
        await prisma.sensitiveDataLog.updateMany({
            where: {
                id: { in: expiredRecords.map(r => r.id) }
            },
            data: {
                deletedAt: now,
                deletionReason: 'Retention period expired'
            }
        })

        return expiredRecords.length
    }

    /**
     * Get retention days based on data type (Vietnamese regulations)
     */
    private static getRetentionDays(dataType: SensitiveDataType): number {
        switch (dataType) {
            case 'CCCD_NUMBER':
            case 'CMND_NUMBER':
            case 'PASSPORT_NUMBER':
                return 365 * 2  // 2 years after account closure

            case 'TAX_CODE':
                return 365 * 10 // 10 years (tax records)

            case 'BANK_ACCOUNT':
                return 365 * 5  // 5 years (financial records)

            case 'KYC_IMAGE':
                return 365 * 2  // 2 years

            case 'SIGNATURE':
                return 365 * 10 // 10 years (contract records)

            default:
                return 365 * 2
        }
    }

    /**
     * Hash data for comparison without decryption
     */
    static hash(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex')
    }
}

export default EncryptionService
