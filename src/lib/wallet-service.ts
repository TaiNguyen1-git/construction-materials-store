import { prisma } from './prisma'
import { WalletTransactionType, Prisma } from '@prisma/client'
import { logger } from './logger'
import { redis } from './redis'

export class WalletService {
    /**
     * Khởi tạo ví cho khách hàng nếu chưa có
     */
    static async ensureWallet(customerId: string) {
        const wallet = await prisma.wallet.findUnique({
            where: { customerId }
        })

        if (!wallet) {
            return await prisma.wallet.create({
                data: {
                    customerId,
                    balance: 0,
                    holdBalance: 0
                }
            })
        }

        return wallet
    }

    /**
     * Kiểm tra tính trùng lặp cho các giao dịch ví
     */
    static async checkIdempotency(key: string, action: string): Promise<boolean> {
        if (!key) return true
        const redisKey = `idempotency:wallet:${action}:${key}`
        try {
            const result = await redis.set(redisKey, 'processing', { nx: true, ex: 300 })
            return result === 'OK'
        } catch (error) {
            logger.error('Wallet Idempotency Error', { error, key })
            return true
        }
    }

    /**
     * Rút tiền từ ví (Có bảo vệ Double Spending & Idempotency)
     */
    static async withdraw(
        customerId: string, 
        amount: number, 
        idempotencyKey: string, 
        description: string = 'Rút tiền từ ví'
    ) {
        if (amount <= 0) throw new Error('Số tiền rút phải lớn hơn 0')

        if (idempotencyKey) {
            const isNew = await this.checkIdempotency(idempotencyKey, 'withdraw')
            if (!isNew) throw new Error('Yêu cầu đang được xử lý hoặc đã hoàn tất')
        }

        try {
            return await prisma.$transaction(async (tx) => {
                const updateResult = await tx.wallet.updateMany({
                    where: { 
                        customerId,
                        balance: { gte: amount }
                    },
                    data: {
                        balance: { decrement: amount }
                    }
                })

                if (updateResult.count === 0) {
                    throw new Error('Số dư ví không đủ')
                }

                const wallet = await tx.wallet.findUnique({ where: { customerId } })
                if (!wallet) throw new Error('Không tìm thấy ví')

                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: -amount,
                        type: 'WITHDRAWAL' as WalletTransactionType,
                        description,
                        status: 'COMPLETED'
                    } as any
                })

                return wallet
            })
        } catch (error) {
            if (idempotencyKey) await redis.del(`idempotency:wallet:withdraw:${idempotencyKey}`)
            throw error
        }
    }

    /**
     * Cộng hoa hồng cho người giới thiệu
     */
    static async awardCommission(orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        })

        if (!order || !order.customer || !order.customer.referredBy) {
            return
        }

        const referrerId = order.customer.referredBy
        const commissionRate = 0.02
        const commissionAmount = order.totalAmount * commissionRate

        if (commissionAmount <= 0) return

        return await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({
                where: { customerId: referrerId }
            })

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { customerId: referrerId, balance: 0 }
                })
            }

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: commissionAmount },
                    totalEarned: { increment: commissionAmount }
                }
            })

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: commissionAmount,
                    type: 'COMMISSION' as WalletTransactionType,
                    description: `Hoa hồng từ đơn hàng #${order.orderNumber}`,
                    relatedOrderId: orderId
                }
            })

            return updatedWallet
        })
    }

    /**
     * Giải ngân từ ký quỹ (Escrow) vào ví Nhà thầu
     */
    static async releaseEscrowToWallet(customerId: string, amount: number, orderId?: string, description?: string) {
        return await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({
                where: { customerId }
            })

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { customerId, balance: 0 }
                })
            }

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    totalEarned: { increment: amount }
                }
            })

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: 'ESCROW_RELEASE' as WalletTransactionType,
                    description: description || 'Giải ngân từ hợp đồng thi công',
                    relatedOrderId: orderId
                }
            })

            return updatedWallet
        })
    }

    static async getWalletData(customerId: string) {
        return await prisma.wallet.findUnique({
            where: { customerId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        })
    }
}

export const walletService = WalletService
