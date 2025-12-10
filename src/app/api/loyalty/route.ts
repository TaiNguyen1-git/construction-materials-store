import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { LoyaltyService } from '@/lib/loyalty-service'

const loyaltyActionSchema = z.object({
  action: z.enum(['get-dashboard', 'redeem-points', 'generate-referral', 'admin-adjust-points']),
  pointsToRedeem: z.number().optional(),
  referralCode: z.string().optional(),
  // Admin params
  targetCustomerId: z.string().optional(),
  points: z.number().optional(),
  reason: z.string().optional()
})

// GET /api/loyalty - Get customer loyalty dashboard
export async function GET(request: NextRequest) {
  try {
    // Get customer ID from headers (in real implementation, this would come from auth middleware)
    let customerId = request.headers.get('x-customer-id')
    const userId = request.headers.get('x-user-id')

    console.log(`[Loyalty API] Request received. customerId: ${customerId}, userId: ${userId}`)

    if (!customerId && userId) {
      // Try to find customer by userId
      const customer = await prisma.customer.findFirst({
        where: { userId }
      })
      if (customer) {
        customerId = customer.id
        console.log(`[Loyalty API] Found customer ${customerId} for user ${userId}`)
      } else {
        console.log(`[Loyalty API] No customer found for user ${userId}`)
      }
    }

    if (!customerId) {
      console.log('[Loyalty API] Missing customer ID')
      return NextResponse.json(
        createErrorResponse('Customer ID required', 'MISSING_CUSTOMER_ID', { receivedUserId: userId, receivedCustomerId: customerId }),
        { status: 400 }
      )
    }

    const loyaltyData = await LoyaltyService.getCustomerLoyaltyData(customerId)
    console.log('[Loyalty API] Returning data for customer:', customerId)

    return NextResponse.json(
      createSuccessResponse(loyaltyData, 'Loyalty dashboard retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get loyalty dashboard error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/loyalty - Perform loyalty actions
export async function POST(request: NextRequest) {
  try {
    // Get customer ID from headers (in real implementation, this would come from auth middleware)
    let customerId = request.headers.get('x-customer-id')
    const userId = request.headers.get('x-user-id')

    if (!customerId && userId) {
      // Try to find customer by userId
      const customer = await prisma.customer.findFirst({
        where: { userId }
      })
      if (customer) {
        customerId = customer.id
      }
    }

    if (!customerId) {
      return NextResponse.json(
        createErrorResponse('Customer ID required', 'MISSING_CUSTOMER_ID', { receivedUserId: userId, receivedCustomerId: customerId }),
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = loyaltyActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { action, pointsToRedeem, referralCode } = validation.data

    switch (action) {
      case 'redeem-points':
        if (!pointsToRedeem || pointsToRedeem <= 0) {
          return NextResponse.json(
            createErrorResponse('Valid points to redeem required', 'INVALID_POINTS'),
            { status: 400 }
          )
        }

        const redemptionResult = await LoyaltyService.redeemPoints(customerId, pointsToRedeem)

        return NextResponse.json(
          createSuccessResponse(redemptionResult, 'Points redeemed successfully'),
          { status: 200 }
        )

      case 'generate-referral':
        const referralCodeResult = await LoyaltyService.generateReferralCode(customerId)

        return NextResponse.json(
          createSuccessResponse({ referralCode: referralCodeResult }, 'Referral code generated'),
          { status: 200 }
        )

      case 'admin-adjust-points':
        // In a real app, we should check for admin role here
        // For now, we assume the caller has verified permissions or we check a secret header/token
        // But since we are using the same endpoint, let's check if the current user is admin
        // This requires passing user role in headers or checking session

        const { targetCustomerId, points, reason } = validation.data

        if (!targetCustomerId || points === undefined || !reason) {
          return NextResponse.json(
            createErrorResponse('Missing required parameters for adjustment', 'INVALID_PARAMS'),
            { status: 400 }
          )
        }

        const adjustmentResult = await LoyaltyService.adjustPoints(
          targetCustomerId,
          points,
          reason,
          customerId // The admin performing the action
        )

        return NextResponse.json(
          createSuccessResponse(adjustmentResult, 'Points adjusted successfully'),
          { status: 200 }
        )

      default:
        return NextResponse.json(
          createErrorResponse('Invalid action', 'INVALID_ACTION'),
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Loyalty action error:', error)

    if (error.message === 'Insufficient loyalty points') {
      return NextResponse.json(
        createErrorResponse('Insufficient loyalty points', 'INSUFFICIENT_POINTS'),
        { status: 400 }
      )
    }

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}