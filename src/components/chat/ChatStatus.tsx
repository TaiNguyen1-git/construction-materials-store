import { Clock, Check, CheckCheck, AlertCircle } from 'lucide-react'

export default function ChatStatus({ status }: { status?: string }) {
    if (status === 'sending') return <Clock className="w-3 h-3 opacity-60 animate-pulse" />
    if (status === 'sent') return <Check className="w-3 h-3 opacity-60" />
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 opacity-60" />
    if (status === 'seen') return <CheckCheck className="w-3 h-3 text-blue-300" />
    if (status === 'error') return <AlertCircle className="w-3 h-3 text-red-400" />
    return null
}
