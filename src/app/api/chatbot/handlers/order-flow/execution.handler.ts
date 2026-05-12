import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import {
    type ConversationState,
    clearConversationState
} from '@/lib/chatbot/conversation-state'

export async function handleCRUDExecution(
    sessionId: string,
    state: ConversationState,
    userRole: string
) {
    try {
        const crudData = state.data
        const { executeAction } = await import('@/lib/chatbot/action-handler')
        const actionResult = await executeAction({
            action: crudData.action,
            entityType: crudData.entityType,
            entities: crudData.entityData || {},
            rawMessage: crudData.previewMessage || '',
            userId: '',
            userRole
        })
        await clearConversationState(sessionId)
        return NextResponse.json(createSuccessResponse({
            message: actionResult.message,
            suggestions: ['Tiếp tục', 'Quay lại'],
            confidence: actionResult.success ? 0.9 : 0.5, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('CRUD execution error:', error)
        return NextResponse.json(createErrorResponse(`Failed to execute action: ${errorMessage}`, 'EXECUTION_ERROR'), { status: 500 })
    }
}
