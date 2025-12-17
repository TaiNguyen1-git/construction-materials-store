/**
 * API endpoint for credit risk analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { CreditRiskService } from '@/lib/credit-risk-service'
import { requireManager } from '@/lib/auth-middleware-api'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/credit-risk?customerId=xxx - Analyze specific customer
// GET /api/credit-risk - Analyze all contractors
export async function GET(request: NextRequest) {
    try {
        const authError = requireManager(request)
        if (authError) {
            return authError
        }

        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')

        if (customerId) {
            // Analyze specific customer
            const result = await CreditRiskService.analyzeCustomer(customerId)

            if (!result) {
                return NextResponse.json(
                    createErrorResponse('Customer not found', 'NOT_FOUND'),
                    { status: 404 }
                )
            }

            return NextResponse.json(
                createSuccessResponse(result, 'Credit risk analysis complete'),
                { status: 200 }
            )
        } else {
            // Analyze all contractors
            const results = await CreditRiskService.analyzeAllContractors()

            return NextResponse.json(
                createSuccessResponse({
                    total: results.length,
                    byRiskLevel: {
                        critical: results.filter(r => r.riskLevel === 'CRITICAL').length,
                        high: results.filter(r => r.riskLevel === 'HIGH').length,
                        medium: results.filter(r => r.riskLevel === 'MEDIUM').length,
                        low: results.filter(r => r.riskLevel === 'LOW').length
                    },
                    customers: results
                }, `Analyzed ${results.length} contractors`),
                { status: 200 }
            )
        }
    } catch (error) {
        console.error('Credit risk analysis failed:', error)
        return NextResponse.json(
            createErrorResponse('Failed to analyze credit risk', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
