import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

// GET /api/v1/developer/tokens - Lấy danh sách tokens của user
export async function GET(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await prisma.apiToken.findMany({
    where: { userId: user.userId, isActive: true },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tokens })
}

// POST /api/v1/developer/tokens - Tạo API token mới
export async function POST(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, scopes } = await req.json()

  // Tạo raw token (chỉ hiển thị 1 lần duy nhất)
  const rawToken = `sk_live_${crypto.randomBytes(24).toString('hex')}`
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const tokenPrefix = rawToken.slice(0, 16)

  const token = await prisma.apiToken.create({
    data: {
      userId: user.userId,
      name: name || 'API Token',
      tokenHash,
      tokenPrefix,
      scopes: scopes || ['read:orders', 'read:products'],
    },
  })

  return NextResponse.json({
    success: true,
    token: {
      id: token.id,
      name: token.name,
      // Chỉ trả raw token 1 lần duy nhất khi tạo
      rawToken,
      tokenPrefix,
      scopes: token.scopes,
      createdAt: token.createdAt,
    },
    warning: 'Lưu lại token này ngay! Bạn sẽ không thể xem lại token sau khi đóng trang.',
  })
}

// DELETE /api/v1/developer/tokens?id=xxx - Xoá token
export async function DELETE(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.apiToken.updateMany({
    where: { id, userId: user.userId },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
