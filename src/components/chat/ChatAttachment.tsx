import { Paperclip } from 'lucide-react'
import { ChatThemeColor, THEME } from './types'

interface ChatAttachmentProps {
    attachment: { fileName: string; fileUrl: string; fileType: string }
    isMe: boolean
    themeColor: ChatThemeColor
    onImageClick?: (url: string) => void
    onFileClick?: (att: any) => void
}

export default function ChatAttachment({
    attachment,
    isMe,
    themeColor,
    onImageClick,
    onFileClick
}: ChatAttachmentProps) {
    const theme = THEME[themeColor]
    const isImg = attachment.fileType?.startsWith('image/')
    const isAudio = attachment.fileType?.startsWith('audio/') || attachment.fileUrl?.startsWith('data:audio/')

    if (isAudio) {
        return (
            <div className={`p-1.5 rounded-xl border ${isMe ? 'bg-black/10 border-white/20' : 'bg-slate-50 border-slate-200'} min-w-[220px]`}>
                <audio controls src={attachment.fileUrl} className="h-9 w-full outline-none block" />
            </div>
        )
    }
    
    if (isImg) {
        return (
            <img
                src={attachment.fileUrl}
                alt={attachment.fileName}
                className="max-w-[180px] rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => onImageClick ? onImageClick(attachment.fileUrl) : window.open(attachment.fileUrl, '_blank')}
            />
        )
    }

    const handleSafePreview = () => {
        const isBase64 = attachment.fileUrl.startsWith('data:')
        let finalUrl = attachment.fileUrl

        if (isBase64) {
            try {
                const parts = attachment.fileUrl.split(',')
                const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
                const b64Data = parts[1]
                const byteCharacters = atob(b64Data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: mime })
                finalUrl = URL.createObjectURL(blob)
            } catch (e) {
                console.error('Blob conversion failed', e)
            }
        }

        const isPdf = attachment.fileName.toLowerCase().endsWith('.pdf')
        const viewerUrl = (isPdf || isBase64)
            ? finalUrl 
            : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(finalUrl)}`
        
        window.open(viewerUrl, '_blank')
    }

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={() => onFileClick ? onFileClick(attachment) : window.open(attachment.fileUrl, '_blank')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMe ? theme.attach : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
                <Paperclip className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{attachment.fileName || 'Tệp đính kèm'}</span>
            </button>
            
            {(attachment.fileName.toLowerCase().endsWith('.docx') || 
              attachment.fileName.toLowerCase().endsWith('.doc') || 
              attachment.fileName.toLowerCase().endsWith('.xlsx') || 
              attachment.fileName.toLowerCase().endsWith('.pptx') ||
              attachment.fileName.toLowerCase().endsWith('.pdf')) && (
                <button
                    onClick={handleSafePreview}
                    className={`flex items-center gap-1 px-1.5 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md border border-dashed transition-all ${
                        isMe 
                        ? 'border-white/30 text-white/80 hover:bg-white/10' 
                        : 'border-blue-200 text-blue-500 hover:bg-blue-50'
                    }`}
                >
                    Xem trước an toàn
                </button>
            )}
        </div>
    )
}
