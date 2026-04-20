import { redirect } from 'next/navigation'

/**
 * admin/tickets đã được gộp vào admin/messages (tab Tickets).
 * Mọi truy cập sẽ được chuyển hướng tự động.
 */
export default function AdminTicketsRedirectPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const id = searchParams?.id
    const target = id
        ? `/admin/messages?tab=tickets&id=${id}`
        : '/admin/messages?tab=tickets'
    redirect(target)
}
