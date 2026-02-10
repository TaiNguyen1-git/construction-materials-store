import { NextResponse } from 'next/server'

// This endpoint returns the current support team status
// In a real implementation, this would check:
// 1. Business hours
// 2. Active admin sessions
// 3. Average response time from recent chats

export async function GET() {
    try {
        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay() // 0 = Sunday

        // Business hours: Mon-Sat 8:00-18:00
        const isBusinessDay = day >= 1 && day <= 6
        const isBusinessHours = hour >= 8 && hour < 18

        let status: 'online' | 'away' | 'offline' = 'offline'

        if (isBusinessDay && isBusinessHours) {
            // During business hours, we're online
            status = 'online'
        } else if (isBusinessDay && (hour >= 7 || hour >= 18 && hour < 20)) {
            // Early morning or evening - away
            status = 'away'
        } else {
            // Outside business hours
            status = 'offline'
        }

        // In production, you might want to check:
        // - Active admin WebSocket connections
        // - Last activity timestamp
        // - Manual override setting from admin panel

        return NextResponse.json({
            status,
            businessHours: {
                start: '08:00',
                end: '18:00',
                days: 'Thứ 2 - Thứ 7'
            },
            responseTime: status === 'online' ? '~5 phút' : (status === 'away' ? '~15 phút' : 'Trong giờ làm việc'),
            timestamp: now.toISOString()
        })
    } catch (error) {
        console.error('Error getting support status:', error)
        return NextResponse.json({ status: 'online' }) // Default to online
    }
}
