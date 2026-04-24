import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Middleware helper: Xác thực Bearer token cho Open API
 */
async function authenticateApiToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawToken = authHeader.slice(7)
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash, isActive: true },
  })

  if (!token) return null

  // Kiểm tra expiry
  if (token.expiresAt && token.expiresAt < new Date()) return null

  // Cập nhật lastUsedAt non-blocking
  void prisma.apiToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  })

  return token
}

// GET /api/v1/orders - Lấy danh sách đơn hàng qua API key
export async function GET(req: NextRequest) {
  const token = await authenticateApiToken(req)
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  // Kiểm tra scope
  if (!token.scopes.includes('read:orders')) {
    return NextResponse.json(
      { error: 'Insufficient scope. Required: read:orders' },
      { status: 403 }
    )
  }

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const status = searchParams.get('status')
  const from = searchParams.get('from') // ISO date
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { userId: token.userId }
  if (status) where['status'] = status
  if (from || to) {
    where['createdAt'] = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: token.userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        netAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        actualDelivery: true,
        orderItems: {
          select: {
            product: { select: { name: true, sku: true } },
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: { customerId: token.userId } }),
  ])

  return NextResponse.json({
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    _api_version: 'v1',
    _generated_at: new Date().toISOString(),
  })
}
