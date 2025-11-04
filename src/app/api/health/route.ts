import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Health check - Redis removed

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  checks: {
    database: {
      status: 'ok' | 'error'
      message?: string
    }
    redis: {
      status: 'ok' | 'unavailable' | 'error'
      message?: string
    }
    system: {
      status: 'ok'
      uptime: number
      memory: {
        used: number
        total: number
        percentage: number
      }
    }
  }
}

export async function GET(request: NextRequest) {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'ok'
      },
      redis: {
        status: 'unavailable'
      },
      system: {
        status: 'ok',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        }
      }
    }
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database.status = 'ok'
  } catch (error: any) {
    health.checks.database.status = 'error'
    health.checks.database.message = error.message
    health.status = 'error'
  }

  // Redis removed - using in-memory cache
  health.checks.redis.status = 'unavailable'
  health.checks.redis.message = 'Using in-memory cache'

  // Return appropriate status code
  const statusCode = health.status === 'error' ? 503 : 200

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}
