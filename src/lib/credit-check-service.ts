/**
 * Credit Check Service - SME Feature 1: Quản lý Công nợ
 * 
 * Service kiểm tra và quản lý tín dụng khách hàng.
 * Tự động chặn đơn hàng nếu khách hàng vượt hạn mức hoặc có nợ quá hạn.
 */

import { prisma } from './prisma'



export interface CreditCheckResult {
  eligible: boolean
  reason?: string
  currentDebt: number
  creditLimit: number
  availableCredit: number
  overdueAmount: number
  maxOverdueDays: number
  requiresApproval: boolean
  warningMessage?: string
}

export interface DebtAgingReport {
  customerId: string
  customerName: string
  customerType: string
  totalDebt: number
  current: number      // Trong hạn
  days1to30: number    // 1-30 ngày
  days31to60: number   // 31-60 ngày
  days61to90: number   // 61-90 ngày
  over90: number       // Trên 90 ngày
  creditLimit: number
  creditHold: boolean
  maxOverdueDays: number
}

export class CreditCheckService {
  /**
   * Kiểm tra tín dụng trước khi tạo đơn hàng
   */
  static async checkCreditEligibility(
    customerId: string,
    orderAmount: number
  ): Promise<CreditCheckResult> {
    // Lấy thông tin khách hàng
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
        invoices: {
          where: {
            status: { in: ['SENT', 'OVERDUE'] },
            invoiceType: 'SALES'
          }
        }
      }
    })

    if (!customer || (customer as any).isDeleted) {
      return {
        eligible: false,
        reason: 'Không tìm thấy thông tin khách hàng hoặc tài khoản đã bị ngừng cung cấp tín dụng',
        currentDebt: 0,
        creditLimit: 0,
        availableCredit: 0,
        overdueAmount: 0,
        maxOverdueDays: 0,
        requiresApproval: false
      }
    }

    // Lấy cấu hình công nợ
    const debtConfig = await this.getDebtConfiguration(customer.customerType)

    // Tính tổng nợ hiện tại
    const currentDebt = await this.calculateCurrentDebt(customerId)

    // Tính nợ quá hạn
    const { overdueAmount, maxOverdueDays } = await this.getOverdueInfo(customerId)

    // Tín dụng khả dụng
    const creditLimit = customer.creditLimit
    const effectiveCreditLimit = creditLimit * (debtConfig.creditLimitPercent / 100)
    const availableCredit = effectiveCreditLimit - currentDebt

    // Kiểm tra các điều kiện
    let eligible = true
    let reason: string | undefined
    let requiresApproval = false
    let warningMessage: string | undefined

    // Check 1: Khách hàng đang bị khóa tín dụng
    if (customer.creditHold) {
      eligible = false
      reason = 'Tài khoản đang bị tạm khóa tín dụng. Vui lòng liên hệ kế toán.'
      requiresApproval = true
    }

    // Check 2: Có nợ quá hạn vượt ngưỡng
    if (eligible && maxOverdueDays > debtConfig.maxOverdueDays) {
      eligible = false
      reason = `Có hóa đơn quá hạn ${maxOverdueDays} ngày (vượt ngưỡng ${debtConfig.maxOverdueDays} ngày). Vui lòng thanh toán trước.`
      requiresApproval = true
    }

    // Check 3: Vượt hạn mức tín dụng
    if (eligible && (currentDebt + orderAmount) > effectiveCreditLimit) {
      eligible = false
      reason = `Vượt hạn mức tín dụng. Nợ hiện tại: ${this.formatCurrency(currentDebt)}, Đơn hàng: ${this.formatCurrency(orderAmount)}, Hạn mức: ${this.formatCurrency(effectiveCreditLimit)}`
      requiresApproval = true
    }

    // Cảnh báo nếu sắp đến hạn
    if (eligible && maxOverdueDays > 0 && maxOverdueDays <= debtConfig.warningDays) {
      warningMessage = `Có hóa đơn sắp quá hạn trong ${debtConfig.warningDays - maxOverdueDays} ngày. Vui lòng thanh toán sớm.`
    }

    // Cập nhật thông tin khách hàng
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        lastCreditCheck: new Date(),
        overdueAmount,
        maxOverdueDays
      }
    })

    return {
      eligible,
      reason,
      currentDebt,
      creditLimit,
      availableCredit,
      overdueAmount,
      maxOverdueDays,
      requiresApproval,
      warningMessage
    }
  }

  /**
   * Tính tổng nợ hiện tại của khách hàng
   */
  static async calculateCurrentDebt(customerId: string): Promise<number> {
    const result = await prisma.invoice.aggregate({
      where: {
        customerId,
        invoiceType: 'SALES',
        status: { in: ['SENT', 'OVERDUE'] }
      },
      _sum: {
        balanceAmount: true
      }
    })

    return result._sum.balanceAmount || 0
  }

  /**
   * Lấy thông tin nợ quá hạn
   */
  static async getOverdueInfo(customerId: string): Promise<{
    overdueAmount: number
    maxOverdueDays: number
    overdueInvoices: Array<{
      id: string
      invoiceNumber: string
      amount: number
      dueDate: Date
      overdueDays: number
    }>
  }> {
    const today = new Date()

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        customerId,
        invoiceType: 'SALES',
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: today }
      },
      select: {
        id: true,
        invoiceNumber: true,
        balanceAmount: true,
        dueDate: true
      }
    })

    let totalOverdue = 0
    let maxDays = 0
    const invoicesWithDays = overdueInvoices.map(inv => {
      const dueDate = new Date(inv.dueDate!)
      const diffTime = today.getTime() - dueDate.getTime()
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      totalOverdue += inv.balanceAmount
      if (overdueDays > maxDays) maxDays = overdueDays

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.balanceAmount,
        dueDate: inv.dueDate!,
        overdueDays
      }
    })

    return {
      overdueAmount: totalOverdue,
      maxOverdueDays: maxDays,
      overdueInvoices: invoicesWithDays
    }
  }

  /**
   * Tạo yêu cầu duyệt ngoại lệ
   */
  static async createCreditApprovalRequest(
    customerId: string,
    orderId: string | null,
    requestedAmount: number,
    reason: string
  ) {
    const currentDebt = await this.calculateCurrentDebt(customerId)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng')
    }

    const approval = await prisma.creditApproval.create({
      data: {
        customerId,
        orderId,
        requestedAmount,
        currentDebt,
        creditLimit: customer.creditLimit,
        reason,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
      }
    })

    return approval
  }

  /**
   * Duyệt/Từ chối yêu cầu ngoại lệ
   */
  static async processApproval(
    approvalId: string,
    approved: boolean,
    approvedBy: string,
    rejectedReason?: string
  ) {
    const approval = await prisma.creditApproval.update({
      where: { id: approvalId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedBy,
        approvedAt: new Date(),
        rejectedReason: approved ? null : rejectedReason
      }
    })

    // Nếu duyệt, tạm thời mở khóa tín dụng cho khách hàng
    if (approved) {
      await prisma.customer.update({
        where: { id: approval.customerId },
        data: { creditHold: false }
      })
    }

    return approval
  }

  /**
   * Tạo báo cáo tuổi nợ (Debt Aging Report)
   */
  static async generateDebtAgingReport(): Promise<DebtAgingReport[]> {
    const today = new Date()

    // 1. Get all customers who have ANY potential debt
    const customers = await prisma.customer.findMany({
      where: {
        isDeleted: false,
        OR: [
          { currentBalance: { gt: 0 } },
          {
            invoices: {
              some: {
                invoiceType: 'SALES',
                status: { in: ['SENT', 'OVERDUE', 'DRAFT'] }
              }
            }
          },
          {
            orders: {
              some: {
                paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
              }
            }
          }
        ]
      } as any,
      include: {
        user: true,
        invoices: {
          where: {
            invoiceType: 'SALES',
            status: { in: ['SENT', 'OVERDUE', 'DRAFT'] }
          }
        },
        orders: {
          where: {
            paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            status: { notIn: ['CANCELLED', 'RETURNED'] }
          }
        }
      }
    })

    const reports: DebtAgingReport[] = []

    for (const customer of (customers as any[])) {
      let current = 0
      let days1to30 = 0
      let days31to60 = 0
      let days61to90 = 0
      let over90 = 0

      // Track processed invoice IDs and order IDs to avoid double counting if they are linked
      const processedInvoiceIds = new Set<string>()
      const processedOrderIds = new Set<string>()

      // A. Process Invoices (Primary source of debt)
      for (const invoice of customer.invoices) {
        processedInvoiceIds.add(invoice.id)
        if (invoice.orderId) processedOrderIds.add(invoice.orderId)

        const balance = invoice.balanceAmount

        if (!invoice.dueDate) {
          current += balance
          continue
        }

        const dueDate = new Date(invoice.dueDate)
        const diffTime = today.getTime() - dueDate.getTime()
        const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (overdueDays <= 0) {
          current += balance
        } else if (overdueDays <= 30) {
          days1to30 += balance
        } else if (overdueDays <= 60) {
          days31to60 += balance
        } else if (overdueDays <= 90) {
          days61to90 += balance
        } else {
          over90 += balance
        }
      }

      // B. Process Orders (that haven't been invoiced or have remaining balance)
      for (const order of customer.orders) {
        if (processedOrderIds.has(order.id)) continue

        // Calculate unpaid amount more robustly (matching Contractor Finance logic)
        // Use || instead of ?? to handle cases where remainingAmount might be 0 but debt exists in netAmount
        const unpaidAmount = order.remainingAmount || (order.netAmount - (order.depositAmount || 0))

        if (unpaidAmount <= 0) continue

        // Use confirmedAt or createdAt + default terms (e.g. 7 days) as due date for aging
        const baseDate = order.confirmedAt || order.createdAt
        const dueDate = new Date(baseDate)
        dueDate.setDate(dueDate.getDate() + 7) // Assumed 7 days payment term if no invoice

        const diffTime = today.getTime() - dueDate.getTime()
        const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (overdueDays <= 0) {
          current += unpaidAmount
        } else if (overdueDays <= 30) {
          days1to30 += unpaidAmount
        } else if (overdueDays <= 60) {
          days31to60 += unpaidAmount
        } else if (overdueDays <= 90) {
          days61to90 += unpaidAmount
        } else {
          over90 += unpaidAmount
        }
      }

      const totalCalculatedDebt = current + days1to30 + days31to60 + days61to90 + over90

      // The final debt shown is the max of our calculated debt and the currentBalance field
      const finalTotalDebt = Math.max(totalCalculatedDebt, customer.currentBalance)

      // Sync columns: if currentBalance is higher than calculated debt, 
      // add the difference to 'current' so columns sum up to finalTotalDebt
      let finalizedCurrent = current
      if (customer.currentBalance > totalCalculatedDebt) {
        finalizedCurrent += (customer.currentBalance - totalCalculatedDebt)
      }

      if (finalTotalDebt > 0) {
        reports.push({
          customerId: customer.id,
          customerName: customer.user.name,
          customerType: customer.customerType,
          totalDebt: finalTotalDebt,
          current: finalizedCurrent,
          days1to30,
          days31to60,
          days61to90,
          over90,
          creditLimit: customer.creditLimit,
          creditHold: customer.creditHold,
          maxOverdueDays: customer.maxOverdueDays
        })
      }
    }

    // Sắp xếp theo tổng nợ giảm dần
    return reports.sort((a, b) => b.totalDebt - a.totalDebt)
  }

  /**
   * Tự động cập nhật trạng thái khóa tín dụng
   * (Chạy theo schedule, ví dụ mỗi đêm)
   */
  static async autoUpdateCreditHolds(): Promise<{
    processed: number
    locked: number
    unlocked: number
  }> {
    const customers = await prisma.customer.findMany({
      include: {
        invoices: {
          where: {
            invoiceType: 'SALES',
            status: { in: ['SENT', 'OVERDUE'] }
          }
        }
      }
    })

    let processed = 0
    let locked = 0
    let unlocked = 0

    for (const customer of customers) {
      processed++
      const config = await this.getDebtConfiguration(customer.customerType)
      const { maxOverdueDays } = await this.getOverdueInfo(customer.id)

      const shouldLock = config.autoHoldOnOverdue && maxOverdueDays > config.maxOverdueDays

      if (shouldLock && !customer.creditHold) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { creditHold: true }
        })
        locked++
      } else if (!shouldLock && customer.creditHold) {
        // Chỉ mở khóa nếu không có approved approval đang pending
        const pendingApproval = await prisma.creditApproval.findFirst({
          where: {
            customerId: customer.id,
            status: 'APPROVED',
            expiresAt: { gt: new Date() }
          }
        })

        if (!pendingApproval) {
          // Không tự động mở khóa, cần duyệt thủ công
        }
      }
    }

    return { processed, locked, unlocked }
  }

  /**
   * Lấy cấu hình công nợ - ưu tiên config hệ thống, sau đó theo loại khách hàng
   */
  private static async getDebtConfiguration(customerType: string) {
    // 1. Tìm config theo loại khách hàng hoặc Default
    let config = await prisma.debtConfiguration.findFirst({
      where: { name: customerType, isActive: true }
    })

    if (!config) {
      // Fallback to Default config
      config = await prisma.debtConfiguration.findFirst({
        where: { name: 'Default', isActive: true }
      })
    }

    if (!config) {
      // Fallback to any active config
      config = await prisma.debtConfiguration.findFirst({
        where: { isActive: true }
      })
    }

    // 2. Nếu có config trong DB, dùng nó
    if (config) {
      return {
        maxOverdueDays: config.maxOverdueDays,
        creditLimitPercent: config.creditLimitPercent,
        autoHoldOnOverdue: config.autoHoldOnOverdue,
        warningDays: config.warningDays
      }
    }

    // 3. Nếu vẫn không có, dùng giá trị mặc định cứng
    return {
      maxOverdueDays: 30,
      creditLimitPercent: 100,
      autoHoldOnOverdue: true,
      warningDays: 7
    }
  }

  private static formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ'
  }
}

export const creditCheckService = CreditCheckService
