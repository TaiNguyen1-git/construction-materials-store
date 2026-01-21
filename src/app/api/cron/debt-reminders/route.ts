/**
 * Debt Reminders Cron API
 * Endpoint for scheduled job to process debt reminders
 * Can be triggered by Vercel Cron, external scheduler, or manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { debtReminderService } from '@/lib/debt-reminder-service'

// GET /api/cron/debt-reminders - Process all debt reminders
export async function GET(request: NextRequest) {
    try {
        // Optional: Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        // If CRON_SECRET is set, require authorization
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[CRON] Starting debt reminder processing...')
        const startTime = Date.now()

        // Process all reminders
        const result = await debtReminderService.processAllReminders()

        const duration = Date.now() - startTime
        console.log('[CRON] Debt reminder processing complete:', result, `Duration: ${duration}ms`)

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                processedAt: new Date().toISOString(),
                durationMs: duration
            }
        })

    } catch (error: any) {
        console.error('[CRON] Debt reminder error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                processedAt: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}

// POST /api/cron/debt-reminders - Manual trigger with options
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const { action } = body

        if (action === 'check-locks-only') {
            // Only check and lock overdue accounts, don't send reminders
            const result = await debtReminderService.checkAndLockOverdueAccounts()
            return NextResponse.json({
                success: true,
                action: 'check-locks-only',
                data: result
            })
        }

        // Default: full processing
        const result = await debtReminderService.processAllReminders()
        return NextResponse.json({
            success: true,
            action: 'full',
            data: result
        })

    } catch (error: any) {
        console.error('Manual debt reminder error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
