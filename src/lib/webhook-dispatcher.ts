/**
 * Webhook Dispatcher - Fire & Forget pattern
 * Không block Vercel Serverless function - dispatch in background
 */
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type WebhookEvent =
  | 'order.created'
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'payment.received'
  | 'quote.accepted'
  | 'quote.replied'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

/**
 * Ký payload bằng HMAC-SHA256 để bên nhận verify
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Gửi webhook đến 1 endpoint cụ thể (timeout 5s)
 */
async function sendWebhook(
  url: string,
  secretKey: string,
  payload: WebhookPayload
): Promise<boolean> {
  const body = JSON.stringify(payload)
  const signature = signPayload(body, secretKey)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SmartBuild-Signature': signature,
        'X-SmartBuild-Event': payload.event,
        'X-SmartBuild-Timestamp': payload.timestamp,
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Dispatch webhook đến tất cả endpoints của user đăng ký event này
 * Chạy bất đồng bộ, không block main request
 */
export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Fire and forget - không await, không block
  void (async () => {
    try {
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: {
          userId,
          isActive: true,
          events: { has: event },
        },
      })

      if (endpoints.length === 0) return

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      }

      const results = await Promise.allSettled(
        endpoints.map((ep) => sendWebhook(ep.url, ep.secretKey, payload))
      )

      // Cập nhật stats (failureCount, lastTriggeredAt) không block
      for (let i = 0; i < endpoints.length; i++) {
        const result = results[i]
        const success = result.status === 'fulfilled' && result.value
        await prisma.webhookEndpoint.update({
          where: { id: endpoints[i].id },
          data: {
            lastTriggeredAt: new Date(),
            failureCount: success
              ? 0
              : { increment: 1 },
          },
        })
      }
    } catch {
      // Silent fail - không crash main request
    }
  })()
}
