import { NextRequest, NextResponse } from 'next/server'
import { BillingReminderService } from '@/lib/services/billing-reminder-service'

export async function GET(req: NextRequest) {
    // Simple security check using CRON_SECRET
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const results = await BillingReminderService.processBillingReminders()
        return NextResponse.json({ success: true, data: results })
    } catch (error: any) {
        console.error('[Cron Billing Reminders] Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
