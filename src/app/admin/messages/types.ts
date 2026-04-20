import { ElementType } from 'react'

export interface TicketMessage {
    id: string
    ticketId: string
    senderId?: string
    senderType: string
    senderName?: string
    content: string
    attachments: string[]
    isInternal: boolean
    createdAt: string
}

export interface SupportTicket {
    id: string
    ticketNumber: string
    customerId?: string
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    subject: string
    description: string
    category: string
    priority: string
    status: string
    orderId?: string
    assignedTo?: string
    slaDeadline?: string
    firstResponseAt?: string
    resolution?: string
    customerRating?: number
    tags: string[]
    createdAt: string
    updatedAt: string
    messages?: TicketMessage[]
}

export type ActiveTab = 'chat' | 'tickets'

export interface StatusConfig {
    label: string
    color: string
    icon: ElementType
}

export interface PriorityConfig {
    label: string
    color: string
}
