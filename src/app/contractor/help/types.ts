import { LucideIcon } from 'lucide-react'

export interface FAQItem {
    question: string
    answer: string
}

export interface FAQCategory {
    title: string
    icon: React.ElementType
    color: string
    faqs: FAQItem[]
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface FinancialInvoice {
    id?: string
    invoiceNumber: string
    projectName?: string
    dueDate?: string
    amount: number
    paid?: number
    status?: string
}

export interface FinancialProject {
    id: string
    name: string
    startDate: string
    debtAmount: number
    nextDueDate: string
    daysLeft: number
    hasOverdue: boolean
}
