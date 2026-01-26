import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware-api'
import { UserRole } from '@/lib/auth'

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('isPublic') === 'true'

    // Auth is only mandatory if NOT requesting public marketplace projects
    let user = null
    const { verifyTokenFromRequest } = await import('@/lib/auth-middleware-api')

    try {
      user = verifyTokenFromRequest(request)
    } catch (e) {
      if (!isPublic) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const moderationStatus = searchParams.get('moderationStatus')
    const customerId = searchParams.get('customerId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}

    if (isPublic) {
      where.isPublic = true
      where.moderationStatus = 'APPROVED'
    } else if (user && user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      // If it's a contractor, they might be either customer OR contractor for a project
      where.OR = [
        { customerId: customer.id },
        { contractorId: customer.id }
      ]
    } else if (user) {
      // MANAGER/EMPLOYEE
      if (customerId) where.customerId = customerId
      if (moderationStatus) where.moderationStatus = moderationStatus
    }

    if (status) {
      where.status = status
    }

    // Build order by clause
    const orderBy: any = { [sortBy]: sortOrder }

    const [projects, total] = await Promise.all([
      (prisma as any).project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          projectTasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      (prisma as any).project.count({ where })
    ])

    // Calculate task completion for each project
    const projectsWithCompletion = projects.map((project: any) => {
      const totalTasks = project.projectTasks.length
      const completedTasks = project.projectTasks.filter((task: any) => task.status === 'COMPLETED').length
      const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...project,
        taskCompletion,
        totalTasks,
        completedTasks
      }
    })

    return NextResponse.json({
      data: projectsWithCompletion,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const { verifyTokenFromRequest } = await import('@/lib/auth-middleware-api')
    let user = null
    try {
      user = verifyTokenFromRequest(request)
    } catch (e) {
      // Guest user
    }

    const body = await request.json()
    const {
      name, description, customerId, contractorId,
      startDate, endDate, budget, priority, notes, location,
      guestName, guestPhone, guestEmail, isPublic
    } = body

    // Validate required fields
    if (!name || !startDate || !budget) {
      return NextResponse.json({ error: 'Name, start date, and budget are required' }, { status: 400 })
    }

    let projectCustomerId = null
    let moderationStatus = 'PENDING'
    let isVerified = user ? true : false // Auto-verify if logged in
    let otpCode = null
    let otpExpiresAt = null

    if (user) {
      // For authenticated customers, link to their account
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { userId: user.userId }
        })
        if (customer) {
          projectCustomerId = customer.id
        }
      } else if (customerId) {
        // Admin creating for a customer
        projectCustomerId = customerId
      }

      // Admin/Employee posts might be auto-approved
      if (user.role === 'MANAGER' || user.role === 'EMPLOYEE') {
        moderationStatus = 'APPROVED'
      }
    } else {
      // Guest submission requirements
      otpCode = Math.floor(100000 + Math.random() * 900000).toString() // 6 digit OTP
      otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

      // In a real app, you would send this via SMS/Email
      console.log(`[VERIFICATION] OTP for project "${name}" to ${guestPhone}: ${otpCode}`)
    }

    // Create project
    const project = await (prisma as any).project.create({
      data: {
        name,
        description: description || '',
        customerId: projectCustomerId,
        contractorId: contractorId || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: parseFloat(budget),
        priority: priority || 'MEDIUM',
        notes: notes || '',
        location: location || '',
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        guestEmail: guestEmail || null,
        isPublic: isPublic || false,
        moderationStatus,
        isVerified,
        otpCode,
        otpExpiresAt
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!isVerified) {
      return NextResponse.json({
        message: 'Verification required',
        projectId: project.id,
        requiresVerification: true
      }, { status: 202 })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}