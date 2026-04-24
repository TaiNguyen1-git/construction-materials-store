import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ webhooks })
}

export async function POST(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, events, description } = await req.json()

  if (!url || !events?.length) {
    return NextResponse.json({ error: 'Missing url or events' }, { status: 400 })
  }

  // Tự động tạo secret key HMAC cho endpoint này
  const secretKey = `whsec_${crypto.randomBytes(20).toString('hex')}`

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      userId: user.userId,
      url,
      secretKey,
      events,
      description: description || '',
    },
  })

  return NextResponse.json({
    success: true,
    webhook: { ...webhook, secretKey }, // Trả về secret 1 lần duy nhất
  })
}

export async function DELETE(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.webhookEndpoint.deleteMany({
    where: { id, userId: user.userId },
  })

  return NextResponse.json({ success: true })
}
