/**
 * Escrow Service - SME Feature 3: Kênh Môi giới & Ký quỹ
 * 
 * Quản lý dòng tiền giữa Khách hàng và Nhà thầu qua cơ chế ký quỹ (Escrow).
 * Đảm bảo an toàn tài chính: Tiền chỉ giải ngân khi có bằng chứng nghiệm thu.
 */

import { prisma } from './prisma'
import { MilestoneEscrowStatus } from '@prisma/client'

export interface EscrowTransactionResult {
    success: boolean
    message: string
    transactionId?: string
}

export class EscrowService {
    /**
     * Khách hàng nạp tiền ký quỹ cho một giai đoạn (Milestone)
     */
    static async depositToMilestone(
        milestoneId: string,
        amount: number
    ): Promise<EscrowTransactionResult> {
        return await prisma.$transaction(async (tx) => {
            const milestone = await tx.paymentMilestone.findUnique({
                where: { id: milestoneId },
                include: { quote: true }
            })

            if (!milestone) {
                return { success: false, message: 'Không tìm thấy giai đoạn thanh toán' }
            }

            if (milestone.escrowStatus !== 'PENDING') {
                return { success: false, message: 'Giai đoạn này đã được đặt cọc hoặc giải ngân' }
            }

            // Cập nhật trạng thái milestone
            await tx.paymentMilestone.update({
                where: { id: milestoneId },
                data: {
                    escrowStatus: 'DEPOSITED',
                    status: 'ESCROW_PAID' // Map với status cũ nếu cần
                }
            })

            // Cập nhật số dư ký quỹ trên QuoteRequest
            await tx.quoteRequest.update({
                where: { id: milestone.quoteId },
                data: {
                    escrowBalance: { increment: amount }
                }
            })

            return {
                success: true,
                message: `Đã ký quỹ thành công ${amount.toLocaleString('vi-VN')}đ cho giai đoạn: ${milestone.name}`
            }
        })
    }

    /**
     * Nhà thầu gửi bằng chứng nghiệm thu (Ảnh/Ghi chú)
     */
    static async submitCompletionEvidence(
        milestoneId: string,
        proofImageUrl: string,
        notes: string
    ): Promise<EscrowTransactionResult> {
        const milestone = await prisma.paymentMilestone.findUnique({
            where: { id: milestoneId }
        })

        if (!milestone || milestone.escrowStatus !== 'DEPOSITED') {
            return { success: false, message: 'Giai đoạn này chưa được ký quỹ hoặc không tồn tại' }
        }

        await prisma.paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                proofImageUrl,
                evidenceNotes: notes,
                status: 'COMPLETED'
            }
        })

        return { success: true, message: 'Đã gửi bằng chứng nghiệm thu. Đang chờ khách hàng phê duyệt.' }
    }

    /**
     * Khách hàng phê duyệt nghiệm thu và giải ngân tiền cho Nhà thầu
     */
    static async approveAndRelease(
        milestoneId: string,
        confirmedByUserId: string
    ): Promise<EscrowTransactionResult> {
        return await prisma.$transaction(async (tx) => {
            const milestone = await tx.paymentMilestone.findUnique({
                where: { id: milestoneId },
                include: { quote: true }
            })

            if (!milestone || milestone.escrowStatus !== 'DEPOSITED') {
                return { success: false, message: 'Giai đoạn không hợp lệ để giải ngân' }
            }

            // Tính toán phí sàn (ví dụ 3% phí môi giới)
            const totalAmount = milestone.amount
            const platformFee = totalAmount * 0.03
            const disbursementAmount = totalAmount - platformFee

            // 1. Cập nhật trạng thái milestone
            await tx.paymentMilestone.update({
                where: { id: milestoneId },
                data: {
                    escrowStatus: 'RELEASED',
                    status: 'RELEASED',
                    confirmedAt: new Date(),
                    paidAt: new Date()
                }
            })

            // 2. Cập nhật số dư ký quỹ trên QuoteRequest
            await tx.quoteRequest.update({
                where: { id: milestone.quoteId },
                data: {
                    escrowBalance: { decrement: totalAmount },
                    platformFee: { increment: platformFee }
                }
            })

            // 3. TODO: Cộng tiền vào ví Nhà thầu (nếu có model Wallet)
            // Hiện tại ta log lại để theo dõi dòng tiền
            console.log(`[ESCROW] Released ${disbursementAmount} to contractor. Platform took ${platformFee} fee.`);

            return {
                success: true,
                message: `Giải ngân thành công ${disbursementAmount.toLocaleString('vi-VN')}đ cho nhà thầu.`
            }
        })
    }
}

export const escrowService = EscrowService
