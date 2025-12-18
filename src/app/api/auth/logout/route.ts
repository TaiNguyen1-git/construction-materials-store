import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
    })

    // Clear auth_token cookie
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    })

    return response
}
