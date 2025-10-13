import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse } from '@/lib/api-types'

export async function GET() {
  return NextResponse.json(
    createSuccessResponse({ message: 'API is working!' }, 'Test successful'),
    { status: 200 }
  )
}