import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value
    
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/projects/[id]/tasks - Get all tasks for a project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if project exists
    const project = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has permission to view this project
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.id }
      })
      
      if (!customer || customer.id !== project.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    
    // Build filter object
    const where: any = { projectId: id }
    
    if (status) {
      where.status = status
    }
    
    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    const tasks = await (prisma as any).projectTask.findMany({
      where,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/tasks - Create task for a project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if project exists
    const project = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, status, priority, assigneeId, startDate, dueDate, estimatedHours, notes } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 })
    }

    // Validate assignee exists if provided
    if (assigneeId) {
      const assignee = await prisma.employee.findUnique({
        where: { id: assigneeId }
      })
      
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
      }
    }

    // Create task
    const task = await (prisma as any).projectTask.create({
      data: {
        projectId: id,
        name,
        description: description || '',
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        assigneeId: assigneeId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        notes: notes || ''
      },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating project task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}