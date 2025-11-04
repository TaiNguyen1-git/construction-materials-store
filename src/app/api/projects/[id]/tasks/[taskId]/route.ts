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

// GET /api/projects/[id]/tasks/[taskId] - Get task by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, taskId } = await params

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

    const task = await (prisma as any).projectTask.findUnique({
      where: { 
        id: taskId,
        projectId: id
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
        },
        taskMaterials: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching project task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/tasks/[taskId] - Update task
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, taskId } = await params

    // Check if project exists
    const project = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has permission to update this project
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.id }
      })
      
      if (!customer || customer.id !== project.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { name, description, status, priority, assigneeId, startDate, dueDate, estimatedHours, actualHours, progress, notes, completedAt } = body

    // Check if task exists
    const existingTask = await (prisma as any).projectTask.findUnique({
      where: { 
        id: taskId,
        projectId: id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
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

    // Update task
    const updatedTask = await (prisma as any).projectTask.update({
      where: { 
        id: taskId,
        projectId: id
      },
      data: {
        name,
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        notes,
        completedAt: completedAt ? new Date(completedAt) : null
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

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating project task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, taskId } = await params

    // Check if project exists
    const project = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if task exists
    const existingTask = await (prisma as any).projectTask.findUnique({
      where: { 
        id: taskId,
        projectId: id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task (cascade will delete related materials)
    await (prisma as any).projectTask.delete({
      where: { 
        id: taskId,
        projectId: id
      }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting project task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}