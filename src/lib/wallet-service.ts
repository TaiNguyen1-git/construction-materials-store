import { prisma } from './prisma'
import { WalletTransactionType } from '@prisma/client'

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
     * Cộng hoa hồng cho người giới thiệu
     * @param orderId ID đơn hàng vừa hoàn tất
     */
    static async awardCommission(orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        })

        // Chỉ tính hoa hồng nếu có người giới thiệu
        if (!order || !order.customer || !order.customer.referredBy) {
            return
        }

        const referrerId = order.customer.referredBy

        // Tính hoa hồng (VD: 2% giá trị đơn hàng)
        const commissionRate = 0.02
        const commissionAmount = order.totalAmount * commissionRate

        if (commissionAmount <= 0) return

        return await prisma.$transaction(async (tx) => {
            // Đảm bảo người giới thiệu có ví
            let wallet = await tx.wallet.findUnique({
                where: { customerId: referrerId }
            })

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { customerId: referrerId, balance: 0 }
                })
            }

            // Cập nhật số dư ví
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: commissionAmount },
                    totalEarned: { increment: commissionAmount }
                }
            })

            // Lưu lịch sử giao dịch
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: commissionAmount,
                    type: 'COMMISSION' as WalletTransactionType,
                    description: `Hoa hồng giới thiệu từ đơn hàng #${order.orderNumber} của ${(order.customer as { companyName?: string; userId?: string })?.companyName || order.customer?.userId || 'Khách hàng'}`,
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

    /**
     * Lấy thông tin ví và lịch sử giao dịch
     */
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
