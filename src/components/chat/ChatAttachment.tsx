import { useState, useEffect, useRef } from 'react'
import { Paperclip, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { ChatThemeColor, THEME } from './types'

function CustomAudioPlayer({ src, isMe, themeColor }: { src: string; isMe: boolean; themeColor: ChatThemeColor }) {
    const theme = THEME[themeColor]
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        const audio = new Audio(src)
        audioRef.current = audio

        const onLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
                setDuration(audio.duration)
            }
        }
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }
        const onEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.addEventListener('loadedmetadata', onLoadedMetadata)
        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('ended', onEnded)

        if (audio.readyState >= 1) {
            onLoadedMetadata()
        }

        return () => {
            audio.pause()
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('ended', onEnded)
        }
    }, [src])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume
        }
    }, [volume, isMuted])

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play().catch(err => console.error(err))
            setIsPlaying(true)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return
        const val = parseFloat(e.target.value)
        audioRef.current.currentTime = val
        setCurrentTime(val)
    }

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return '0:00'
        const mins = Math.floor(time / 60)
        const secs = Math.floor(time % 60)
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    // Map themes to non-me state
    const btnColorMap = {
        indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600',
        blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
        green: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-50 hover:bg-amber-100 text-amber-600'
    }
    const btnColor = isMe ? 'bg-white/20 hover:bg-white/30 text-white' : (btnColorMap[themeColor] || btnColorMap.indigo)

    const accentColorMap = {
        indigo: 'accent-indigo-600',
        blue: 'accent-blue-600',
        green: 'accent-emerald-600',
        amber: 'accent-amber-500'
    }
    const accentColor = accentColorMap[themeColor] || accentColorMap.indigo

    return (
        <div className="flex items-center gap-3 py-1 px-1.5 w-[240px] select-none">
            <button 
                onClick={togglePlay} 
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm active:scale-95 ${btnColor}`}
            >
                {isPlaying ? (
                    <Pause size={13} fill="currentColor" />
                ) : (
                    <Play size={13} fill="currentColor" className="ml-0.5" />
                )}
            </button>
            
            <div className="flex-1 flex flex-col gap-1">
                <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${accentColor} bg-slate-200/60 dark:bg-slate-700/50`}
                    style={{ outline: 'none' }}
                />
                <div className={`flex justify-between items-center text-[9px] font-semibold ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    
                    {/* Hover Volume Controls */}
                    <div className="flex items-center gap-0.5 group/volume relative">
                        <button 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                isMe 
                                ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX size={11} />
                            ) : (
                                <Volume2 size={11} />
                            )}
                        </button>
                        
                        <input 
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                setVolume(val)
                                if (val > 0) setIsMuted(false)
                            }}
                            className={`w-0 opacity-0 group-hover/volume:w-10 group-hover/volume:opacity-100 transition-all duration-200 h-0.5 rounded-lg appearance-none cursor-pointer ${accentColor} bg-slate-300 dark:bg-slate-600`}
                            style={{ outline: 'none' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

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
            <div className={`p-1.5 rounded-xl border ${isMe ? 'bg-black/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                <CustomAudioPlayer src={attachment.fileUrl} isMe={isMe} themeColor={themeColor} />
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
