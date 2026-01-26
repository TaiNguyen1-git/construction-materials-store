'use client'

import { useEffect, useState } from 'react'
import { getAllPendingReports, deletePendingReport, PendingReport } from '@/lib/offline-db'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'
import { Wifi, WifiOff, CloudUpload, Loader2 } from 'lucide-react'

export default function OfflineSyncManager() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const [syncing, setSyncing] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            toast.success('Đã khôi phục kết nối mạng!')
            syncReports()
        }
        const handleOffline = () => {
            setIsOnline(false)
            toast.error('Mất kết nối mạng. Bạn đang ở chế độ Offline.')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Initial check
        checkPending()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const checkPending = async () => {
        const reports = await getAllPendingReports()
        setPendingCount(reports.length)
        if (reports.length > 0 && navigator.onLine) {
            syncReports()
        }
    }

    const syncReports = async () => {
        if (syncing) return
        const reports = await getAllPendingReports()
        if (reports.length === 0) {
            setPendingCount(0)
            return
        }

        setSyncing(true)
        toast.loading(`Đang đồng bộ ${reports.length} báo cáo offline...`, { id: 'sync-toast' })

        let successCount = 0
        for (const report of reports) {
            try {
                // 1. Upload File
                const formData = new FormData()
                const file = new File([report.fileBlob], report.fileName, { type: report.fileType })
                formData.append('file', file)

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                const uploadData = await uploadRes.json()

                if (!uploadData.success) throw new Error('Upload failed')

                // 2. Post Report
                const reportRes = await fetchWithAuth('/api/contractors/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: report.projectId,
                        photoUrl: uploadData.data.url,
                        notes: report.notes + ' (Đã đồng bộ từ chế độ Offline)',
                        workerName: report.workerName
                    })
                })

                if (reportRes.ok) {
                    await deletePendingReport(report.id!)
                    successCount++
                }
            } catch (err) {
                console.error('Sync failed for report', report.id, err)
            }
        }

        setSyncing(false)
        setPendingCount(reports.length - successCount)

        if (successCount > 0) {
            toast.success(`Đã đồng bộ thành công ${successCount} báo cáo!`, { id: 'sync-toast' })
        } else {
            toast.dismiss('sync-toast')
        }
    }

    if (pendingCount === 0 && isOnline) return null

    return (
        <div className="fixed bottom-20 right-6 z-[90] flex flex-col items-end gap-2 animate-in slide-in-from-right duration-500">
            {!isOnline && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm">
                    <WifiOff className="w-4 h-4" />
                    Đang Offline
                </div>
            )}

            {pendingCount > 0 && (
                <button
                    onClick={syncReports}
                    disabled={syncing || !isOnline}
                    className={`${isOnline ? 'bg-blue-600 shadow-blue-200' : 'bg-gray-400'} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transition-all active:scale-95`}
                >
                    {syncing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <CloudUpload className="w-5 h-5" />
                    )}
                    <div className="text-left">
                        <p className="text-xs font-black uppercase leading-none">{syncing ? 'Đang gửi...' : 'Đợi đồng bộ'}</p>
                        <p className="text-[10px] font-bold opacity-80">{pendingCount} báo cáo chờ gửi</p>
                    </div>
                </button>
            )}
        </div>
    )
}
