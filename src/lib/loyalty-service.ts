import { Prisma, LoyaltyTier } from '@prisma/client'

interface CustomerData {
  id: string
  userId: string
  customerType: string
  totalPurchases: number
  loyaltyPoints: number
  creditLimit: number
  currentBalance: number
  preferredPayment: string | null
  createdAt: Date
  updatedAt: Date
  // Loyalty Program Fields
  loyaltyTier?: LoyaltyTier
  loyaltyPointsToNextTier?: number
  totalPointsEarned?: number
  totalPointsRedeemed?: number
  lastPurchaseDate?: Date
  purchaseFrequency?: number
  preferredCategories?: string[]
  birthday?: Date
  anniversaryDate?: Date
  referralCode?: string
  referredBy?: string
  totalReferrals?: number
}

import { prisma } from '@/lib/prisma'

export class LoyaltyService {
  // Calculate points earned from a purchase
  static calculatePoints(amount: number, tier: LoyaltyTier = 'BRONZE'): number {
    const basePoints = Math.floor(amount / 1000) // 1 point per 1000 VND spent

    // Tier multipliers
    const multipliers = {
      'BRONZE': 1,
      'SILVER': 1.2,
      'GOLD': 1.5,
      'PLATINUM': 2,
      'DIAMOND': 2.5
    }

    return Math.floor(basePoints * multipliers[tier])
  }

  // Get points needed to reach next tier
  static getPointsToNextTier(currentTier: LoyaltyTier, totalPoints: number): number {
    const tierRequirements = {
      'BRONZE': 0,
      'SILVER': 1000,
      'GOLD': 2500,
      'PLATINUM': 5000,
      'DIAMOND': 10000
    }

    const nextTier = this.getNextTier(currentTier)
    if (!nextTier) return 0 // Already at highest tier

    const requiredPoints = tierRequirements[nextTier]
    return Math.max(0, requiredPoints - totalPoints)
  }

  // Get next tier
  static getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
    const tierOrder: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
    const currentIndex = tierOrder.indexOf(currentTier)

    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1]
    }

    return null // Already at highest tier
  }

  // Update customer loyalty status after a purchase
  static async updateCustomerLoyalty(customerId: string, purchaseAmount: number) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // Calculate points for this purchase
      const pointsEarned = this.calculatePoints(purchaseAmount, customer.loyaltyTier || 'BRONZE')

      // Update customer loyalty data
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          totalPurchases: {
            increment: purchaseAmount
          },
          loyaltyPoints: {
            increment: pointsEarned
          },
          totalPointsEarned: {
            increment: pointsEarned
          },
          lastPurchaseDate: new Date()
          // Note: We'll update the tier separately since we need to calculate it
        }
      })

      // Determine new tier based on total points
      const newTier = this.determineTier((customer.totalPointsEarned || 0) + pointsEarned)

      // Update tier
      const finalCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyTier: newTier
        }
      })

      // Update points to next tier
      const pointsToNextTier = this.getPointsToNextTier(
        finalCustomer.loyaltyTier,
        (finalCustomer.totalPointsEarned || 0) + pointsEarned
      )

      await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPointsToNextTier: pointsToNextTier
        }
      })

      return {
        pointsEarned,
        newTier: finalCustomer.loyaltyTier,
        pointsToNextTier
      }
    } catch (error) {
      console.error('Error updating customer loyalty:', error)
      throw error
    }
  }

  // Determine loyalty tier based on total points
  static determineTier(totalPoints: number): LoyaltyTier {
    if (totalPoints >= 10000) return 'DIAMOND'
    if (totalPoints >= 5000) return 'PLATINUM'
    if (totalPoints >= 2500) return 'GOLD'
    if (totalPoints >= 1000) return 'SILVER'
    return 'BRONZE'
  }

  // Redeem loyalty points
  static async redeemPoints(customerId: string, pointsToRedeem: number) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      if ((customer.loyaltyPoints || 0) < pointsToRedeem) {
        throw new Error('Insufficient loyalty points')
      }

      // Update customer points
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            decrement: pointsToRedeem
          },
          totalPointsRedeemed: {
            increment: pointsToRedeem
          }
        }
      })

      return {
        pointsRedeemed: pointsToRedeem,
        remainingPoints: updatedCustomer.loyaltyPoints
      }
    } catch (error) {
      console.error('Error redeeming loyalty points:', error)
      throw error
    }
  }

  // Get customer loyalty dashboard data
  static async getCustomerLoyaltyData(customerId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          loyaltyVouchers: {
            orderBy: {
              redeemedAt: 'desc'
            }
          }
        }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      return {
        name: customer.user.name,
        email: customer.user.email,
        currentTier: customer.loyaltyTier || 'BRONZE',
        currentPoints: customer.loyaltyPoints || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        totalPointsRedeemed: customer.totalPointsRedeemed || 0,
        pointsToNextTier: customer.loyaltyPointsToNextTier || 0,
        lastPurchaseDate: customer.lastPurchaseDate,
        totalPurchases: customer.totalPurchases,
        nextTier: this.getNextTier(customer.loyaltyTier || 'BRONZE'),
        tierBenefits: this.getTierBenefits(customer.loyaltyTier || 'BRONZE'),
        vouchers: customer.loyaltyVouchers || []
      }
    } catch (error) {
      console.error('Error getting customer loyalty data:', error)
      throw error
    }
  }

  // Get tier benefits
  static getTierBenefits(tier: LoyaltyTier) {
    const benefits = {
      'BRONZE': {
        discount: '2%',
        birthdayGift: 'None',
        freeShipping: 'Over 500,000 VND',
        prioritySupport: 'Standard'
      },
      'SILVER': {
        discount: '5%',
        birthdayGift: '100,000 VND voucher',
        freeShipping: 'Over 300,000 VND',
        prioritySupport: 'Priority'
      },
      'GOLD': {
        discount: '10%',
        birthdayGift: '200,000 VND voucher',
        freeShipping: 'Over 200,000 VND',
        prioritySupport: 'VIP'
      },
      'PLATINUM': {
        discount: '15%',
        birthdayGift: '500,000 VND voucher',
        freeShipping: 'Free shipping',
        prioritySupport: 'VIP Plus'
      },
      'DIAMOND': {
        discount: '20%',
        birthdayGift: '1,000,000 VND voucher',
        freeShipping: 'Free shipping + gift wrapping',
        prioritySupport: 'Diamond Support'
      }
    }

    return benefits[tier]
  }

  // Generate referral code for customer
  static async generateReferralCode(customerId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // If customer already has a referral code, return it
      if (customer.referralCode) {
        return customer.referralCode
      }

      // Generate unique referral code
      const baseCode = (customer.user.name.substring(0, 3).toUpperCase() +
        Math.random().toString(36).substring(2, 8).toUpperCase())

      // Ensure uniqueness
      let referralCode = baseCode
      let counter = 1

      while (await prisma.customer.findFirst({ where: { referralCode } })) {
        referralCode = baseCode + counter
        counter++
      }

      // Update customer with referral code
      await prisma.customer.update({
        where: { id: customerId },
        data: { referralCode }
      })

      return referralCode
    } catch (error) {
      console.error('Error generating referral code:', error)
      throw error
    }
  }

  // Process referral when a new customer signs up
  static async processReferral(referralCode: string, newCustomerId: string) {
    try {
      // Find the customer who provided the referral code
      const referringCustomer = await prisma.customer.findFirst({
        where: { referralCode }
      })

      if (!referringCustomer) {
        // Invalid referral code, do nothing
        return null
      }

      // Update the referring customer
      await prisma.customer.update({
        where: { id: referringCustomer.id },
        data: {
          totalReferrals: {
            increment: 1
          },
          // Award referral points (e.g., 100 points for successful referral)
          loyaltyPoints: {
            increment: 100
          },
          totalPointsEarned: {
            increment: 100
          }
        }
      })

      // Update the new customer with referredBy
      await prisma.customer.update({
        where: { id: newCustomerId },
        data: {
          referredBy: referringCustomer.id
        }
      })

      return {
        referringCustomerId: referringCustomer.id,
        pointsAwarded: 100
      }
    } catch (error) {
      console.error('Error processing referral:', error)
      throw error
    }
  }

  // Get available voucher options
  static getVoucherOptions() {
    return [
      { id: 'v50', voucherValue: 50000, pointsRequired: 500, displayName: 'Voucher 50.000đ', savings: '5%', popular: false, bestValue: false },
      { id: 'v100', voucherValue: 100000, pointsRequired: 1000, displayName: 'Voucher 100.000đ', savings: '10%', popular: false, bestValue: false },
      { id: 'v200', voucherValue: 200000, pointsRequired: 2000, displayName: 'Voucher 200.000đ', savings: '15%', popular: false, bestValue: false },
      { id: 'v500', voucherValue: 500000, pointsRequired: 5000, displayName: 'Voucher 500.000đ', savings: '20%', popular: false, bestValue: true }
    ]
  }

  // Redeem points for a specific voucher
  static async redeemPointsForVoucher(customerId: string, voucherValue: number) {
    try {
      const options = this.getVoucherOptions()
      const option = options.find(o => o.voucherValue === voucherValue)

      if (!option) {
        throw new Error('Voucher value không hợp lệ')
      }

      const pointsRequired = option.pointsRequired
      const result = await this.redeemPoints(customerId, pointsRequired)

      // Generate a dummy voucher code
      const voucherCode = 'LOYL-' + Math.random().toString(36).substring(2, 10).toUpperCase()

      // Save voucher to database
      await prisma.loyaltyVoucher.create({
        data: {
          customerId,
          code: voucherCode,
          value: voucherValue,
          pointsUsed: pointsRequired,
          status: 'UNUSED',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
        }
      })

      return {
        ...result,
        voucherCode,
        voucherValue,
        description: `Đổi ${pointsRequired} điểm lấy voucher ${voucherValue.toLocaleString('vi-VN')}đ`
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error)
      throw error
    }
  }

  // Manually adjust customer points (mainly for admin)
  static async adjustPoints(customerId: string, points: number, reason: string, adminId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // Update customer points
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: points // can be negative for decrement
          },
          totalPointsEarned: points > 0 ? { increment: points } : undefined
        }
      })

      return {
        previousPoints: customer.loyaltyPoints || 0,
        newPoints: updatedCustomer.loyaltyPoints,
        adjustment: points,
        reason
      }
    } catch (error) {
      console.error('Error adjusting points:', error)
      throw error
    }
  }

  // Get customer vouchers
  static async getCustomerVouchers(customerId: string) {
    try {
      return await prisma.loyaltyVoucher.findMany({
        where: { customerId },
        orderBy: { redeemedAt: 'desc' }
      })
    } catch (error) {
      console.error('Error fetching customer vouchers:', error)
      throw error
    }
  }
}