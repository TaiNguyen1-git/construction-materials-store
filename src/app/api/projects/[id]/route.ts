import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/projects/[id] - Get project by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await (prisma as any).project.findUnique({
      where: { id },
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
        },
        contractor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        projectMaterials: {
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

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has permission to view this project
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      if (!customer || customer.id !== project.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // CONTRACTOR can only view projects assigned to them, OR unassigned projects (open for bidding)
    if (user.role === 'CONTRACTOR') {
      const contractor = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      const isAssigned = contractor && contractor.id === project.contractorId
      const isOpenBidding = project.contractorId === null

      if (!isAssigned && !isOpenBidding) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Calculate task completion
    const totalTasks = project.projectTasks.length
    const completedTasks = project.projectTasks.filter((task: any) => task.status === 'COMPLETED').length
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Calculate material costs
    const totalMaterialCost = project.projectMaterials.reduce((sum: number, material: any) => {
      return sum + material.totalPrice
    }, 0)

    return NextResponse.json({
      ...project,
      taskCompletion,
      totalTasks,
      completedTasks,
      totalMaterialCost
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyTokenFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, status, startDate, endDate, budget, priority, notes, progress, moderationStatus, isVerified } = body

    // Check if project exists
    const existingProject = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has permission to update this project
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      if (!customer || customer.id !== existingProject.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // CONTRACTOR can only update projects assigned to them
    if (user.role === 'CONTRACTOR') {
      const contractor = await prisma.customer.findFirst({
        where: { userId: user.userId }
      })

      if (!contractor || contractor.id !== existingProject.contractorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update project
    const updatedProject = await (prisma as any).project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate === '' ? null : endDate ? new Date(endDate) : undefined,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        priority: priority !== undefined ? priority : undefined,
        notes: notes !== undefined ? notes : undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        contractorId: body.contractorId !== undefined ? body.contractorId : undefined,
        moderationStatus: moderationStatus !== undefined ? moderationStatus : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined
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

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyTokenFromRequest(request)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if project exists
    const existingProject = await (prisma as any).project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete project (cascade will delete related tasks and materials)
    await (prisma as any).project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}