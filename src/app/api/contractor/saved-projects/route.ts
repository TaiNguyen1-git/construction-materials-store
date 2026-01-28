import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

/**
 * GET /api/contractor/saved-projects
 * Returns list of saved project IDs for the current contractor.
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = AuthService.verifyAccessToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        // Get Contractor Profile
        const contractor = await prisma.contractorProfile.findFirst({
            where: { customer: { userId: payload.userId } }
        })

        if (!contractor) {
            return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 })
        }

        // Fetch saved projects
        const saved = await prisma.savedProject.findMany({
            where: { contractorId: contractor.id },
            select: { projectId: true }
        })

        return NextResponse.json({
            success: true,
            data: saved.map((s) => s.projectId)
        })

    } catch (error) {
        console.error('[Get Saved Projects] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

/**
 * POST /api/contractor/saved-projects
 * Toggle save status for a project.
 * Body: { projectId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = AuthService.verifyAccessToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const body = await request.json()
        const { projectId } = body

        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        // Get Contractor Profile
        const contractor = await prisma.contractorProfile.findFirst({
            where: { customer: { userId: payload.userId } }
        })

        if (!contractor) {
            return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 })
        }

        // Check if already saved
        const existing = await prisma.savedProject.findUnique({
            where: {
                contractorId_projectId: {
                    contractorId: contractor.id,
                    projectId: projectId
                }
            }
        })

        if (existing) {
            // Unsave
            await prisma.savedProject.delete({
                where: { id: existing.id }
            })
            return NextResponse.json({ success: true, isSaved: false, message: 'Removed from saved projects' })
        } else {
            // Save
            await prisma.savedProject.create({
                data: {
                    contractorId: contractor.id,
                    projectId: projectId
                }
            })
            return NextResponse.json({ success: true, isSaved: true, message: 'Added to saved projects' })
        }

    } catch (error) {
        console.error('[Toggle Info] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
