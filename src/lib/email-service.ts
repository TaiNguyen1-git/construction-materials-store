// Barrel re-export — preserves backward compatibility with existing imports
// All existing code that imports from '@/lib/email-service' continues to work unchanged

export { EmailService } from './email/email-service'
export { EmailService as default } from './email/email-service'
export type { EmailTemplate } from './email/email-types'
