import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/analytics-service'
import jwt from 'jsonwebtoken'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value
    
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | undefined
    const limit = parseInt(searchParams.get('limit') || '10')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    let data: any

    switch (type) {
      case 'sales':
        data = await AnalyticsService.getSalesData(start, end, period)
        break
      case 'products':
        data = await AnalyticsService.getTopSellingProducts(limit)
        break
      case 'customers':
        data = await AnalyticsService.getCustomerSegments()
        break
      case 'inventory':
        data = await AnalyticsService.getInventoryTurnover()
        break
      case 'financial':
        const financialPeriod = searchParams.get('financialPeriod') as 'month' | 'quarter' | 'year' || 'month'
        data = await AnalyticsService.getFinancialSummary(financialPeriod)
        break
      default:
        // Return summary data
        const [salesData, topProducts, customerSegments, inventoryTurnover, financialSummary] = await Promise.all([
          AnalyticsService.getSalesData(start, end, 'day'),
          AnalyticsService.getTopSellingProducts(5),
          AnalyticsService.getCustomerSegments(),
          AnalyticsService.getInventoryTurnover(),
          AnalyticsService.getFinancialSummary('month')
        ])
        
        data = {
          salesData,
          topProducts,
          customerSegments,
          inventoryTurnover: inventoryTurnover.slice(0, 5),
          financialSummary
        }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}