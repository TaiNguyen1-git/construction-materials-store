import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET() {
  try {
    // Try to connect to database and get user count
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    
    return NextResponse.json(
      createSuccessResponse({
        database: 'connected',
        users: userCount,
        categories: categoryCount,
        status: userCount > 0 ? 'initialized' : 'empty'
      }, 'Database status check successful'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json(
      createErrorResponse('Database connection failed', 'DB_ERROR', error),
      { status: 500 }
    )
  }
}