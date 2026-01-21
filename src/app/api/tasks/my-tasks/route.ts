import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TaskStatus } from '@prisma/client'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getUserIdFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // Find employee record for this user
        const employee = await prisma.employee.findUnique({
            where: { userId }
        })

        if (!employee) {
            return NextResponse.json(createErrorResponse('Employee profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const tasks = await prisma.employeeTask.findMany({
            where: { employeeId: employee.id },
            orderBy: [
                { status: 'asc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(createSuccessResponse(tasks), { status: 200 })
    } catch (error: any) {
        console.error('Error fetching my-tasks:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { taskId, proofUrl, proofNotes } = body

        if (!taskId) {
            return NextResponse.json(createErrorResponse('Task ID is required', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Verify task belongs to this employee
        const employee = await prisma.employee.findUnique({
            where: { userId }
        })

        if (!employee) {
            return NextResponse.json(createErrorResponse('Employee profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const task = await prisma.employeeTask.findUnique({
            where: { id: taskId }
        })

        if (!task || task.employeeId !== employee.id) {
            return NextResponse.json(createErrorResponse('Task not found or unauthorized', 'NOT_FOUND'), { status: 404 })
        }

        // Update task with proof
        const updatedTask = await prisma.employeeTask.update({
            where: { id: taskId },
            data: {
                status: 'AWAITING_REVIEW' as any,
                proofUrl: proofUrl as any,
                proofNotes: proofNotes as any,
                submittedAt: new Date()
            } as any
        })

        // Create notification for Manager
        const managers = await prisma.user.findMany({
            where: { role: 'MANAGER' },
            select: { id: true }
        })

        for (const manager of managers) {
            await prisma.notification.create({
                data: {
                    userId: manager.id,
                    title: 'Minh chứng công việc mới',
                    message: `Nhân viên ${employee.employeeCode} đã nộp minh chứng cho task: ${task.title}`,
                    type: 'INFO',
                    priority: 'MEDIUM',
                    referenceId: task.id,
                    referenceType: 'EMPLOYEE_TASK'
                }
            })
        }

        return NextResponse.json(createSuccessResponse(updatedTask, 'Proof submitted successfully'), { status: 200 })
    } catch (error: any) {
        console.error('Error submitting proof:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'SERVER_ERROR'), { status: 500 })
    }
}
