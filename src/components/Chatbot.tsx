'use client'

// Re-export the new premium chatbot component
// This file is kept for backward compatibility
import ChatbotPremium from './chatbot/ChatbotPremium'

interface ChatbotProps {
  customerId?: string
}

export default function Chatbot({ customerId }: ChatbotProps) {
  return <ChatbotPremium customerId={customerId} />
}