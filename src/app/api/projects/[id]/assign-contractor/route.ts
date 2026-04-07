import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyTokenFromRequest(request)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const { contractorId } = await request.json()

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 400 })
    }

    // 1. Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 444 })
    }

    // 2. Verify contractor exists and is actually a contractor
    const contractor = await prisma.customer.findUnique({
      where: { id: contractorId },
      include: { user: true }
    })

    if (!contractor || contractor.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Invalid contractor' }, { status: 400 })
    }

    // 3. Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        contractorId: contractorId,
        status: 'IN_PROGRESS' // Auto-start the project when assigned
      }
    })

    // 4. (Optional) Reject other applications or mark chosen one as SELECTED
    await prisma.projectApplication.updateMany({
      where: { 
        projectId, 
        contractorId: contractorId 
      },
      data: { status: 'SELECTED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Contractor assigned successfully',
      project: updatedProject
    })

  } catch (error) {
    console.error('Error assigning contractor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
