import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { LoyaltyService } from '@/lib/loyalty-service'

const loyaltyActionSchema = z.object({
  action: z.enum(['get-dashboard', 'redeem-points', 'generate-referral']),
  pointsToRedeem: z.number().optional(),
  referralCode: z.string().optional()
})

// GET /api/loyalty - Get customer loyalty dashboard
export async function GET(request: NextRequest) {
  try {
    // Get customer ID from headers (in real implementation, this would come from auth middleware)
    const customerId = request.headers.get('x-customer-id')
    
    if (!customerId) {
      return NextResponse.json(
        createErrorResponse('Customer ID required', 'MISSING_CUSTOMER_ID'),
        { status: 400 }
      )
    }

    const loyaltyData = await LoyaltyService.getCustomerLoyaltyData(customerId)
    
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
    const customerId = request.headers.get('x-customer-id')
    
    if (!customerId) {
      return NextResponse.json(
        createErrorResponse('Customer ID required', 'MISSING_CUSTOMER_ID'),
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