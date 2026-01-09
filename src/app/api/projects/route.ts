import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware-api'
import { UserRole } from '@/lib/auth'

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request)
    if (authError) return authError


    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Get user from token for authorization check
    const { verifyTokenFromRequest } = await import('@/lib/auth-middleware-api')
    const user = verifyTokenFromRequest(request)

    // Build filter object
    const where: any = {}

    // For customers, show projects they own OR projects they are contractors for
    if (user && user.role === 'CUSTOMER') {
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
    }
    // For employees/managers, filter by customerId if provided
    else if (customerId) {
      where.customerId = customerId
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
    const user = verifyTokenFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, customerId, contractorId, startDate, endDate, budget, priority, notes } = body

    // Validate required fields
    if (!name || !startDate || !budget) {
      return NextResponse.json({ error: 'Name, start date, and budget are required' }, { status: 400 })
    }

    // For customers, use their own customer ID
    let projectCustomerId = customerId
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      projectCustomerId = customer.id
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: projectCustomerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
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
        notes: notes || ''
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

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}