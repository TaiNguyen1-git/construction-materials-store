'use client'

import { useRef, useEffect, useState } from 'react'
import { Send, Image as ImageIcon, X, Headphones, Mic, Trash2, StopCircle, ChevronRight, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatInputProps {
    currentMessage: string;
    setCurrentMessage: (message: string) => void;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    isLoading: boolean;
    onSendMessage: () => void;
    isAdmin: boolean;
    onConnectSupport?: () => void;
    isHumanMode?: boolean;
    onTyping?: () => void;
}

export default function ChatInput({
    currentMessage,
    setCurrentMessage,
    selectedImage,
    setSelectedImage,
    isLoading,
    onSendMessage,
    isAdmin,
    onConnectSupport,
    isHumanMode = false,
    onTyping
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isFocused, setIsFocused] = useState(false)
    const [showUtils, setShowUtils] = useState(true)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Reset height when message is cleared
    useEffect(() => {
        if (currentMessage === '' && textareaRef.current) {
            textareaRef.current.style.height = ''
        }
    }, [currentMessage])

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        }
    }, [])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSendMessage()
        }
    }

    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) { // Allow up to 10MB but we will compress
            toast.error('File quá lớn. Hệ thống chỉ xử lý file tối đa 10MB.')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const result = event.target?.result as string;

            // If it's an image, compress it with Canvas
            if (file.type.startsWith('image/')) {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    const base64 = canvas.toDataURL(file.type, 0.7)
                    setSelectedImage(base64)
                }
                img.src = result
            } else {
                // For PDFs and other documents
                setSelectedImage(result)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        processFile(file)
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('application/pdf') !== -1) {
                const file = items[i].getAsFile()
                if (file) {
                    processFile(file)
                    e.preventDefault() // Prevent pasting the image name/URL as text
                    break
                }
            }
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    // Set as selectedImage so user can preview/send
                    setSelectedImage(base64String);
                };
                
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone error:", err);
            toast.error("Không thể truy cập Micro. Vui lòng cấp quyền trên trình duyệt.");
        }
    };

    const stopRecording = (cancel = false) => {
        if (mediaRecorderRef.current && isRecording) {
            if (cancel) {
                mediaRecorderRef.current.onstop = () => {
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                };
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (cancel) {
                toast("Đã hủy ghi âm", { icon: '🗑️' });
            }
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="flex-shrink-0 p-4 border-t border-neutral-200 bg-white">
            <div className="flex gap-2 items-end">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <div className="flex gap-1.5 mb-0.5 items-end">
                    {/* Toggle Button (appears when utils are hidden) */}
                    {(!showUtils && !isRecording) && (
                        <button 
                            onClick={() => setShowUtils(true)}
                            className="flex-shrink-0 text-neutral-400 p-1.5 mb-1 rounded-lg hover:bg-neutral-200/60 hover:text-neutral-700 transition-all active:scale-95 animate-fadeIn"
                            title="Mở rộng công cụ"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                    <div
                        className={`flex gap-1.5 overflow-hidden transition-all duration-300 ease-in-out ${
                            !showUtils && !isRecording
                                ? 'w-0 opacity-0 pointer-events-none'
                                : 'w-auto opacity-100'
                        }`}
                    >
                        {/* Connect to Support Button */}
                        {!isAdmin && !isHumanMode && onConnectSupport && !isRecording && (
                            <button
                                onClick={onConnectSupport}
                                disabled={isLoading}
                                className="flex-shrink-0 text-neutral-400 p-2.5 rounded-xl hover:bg-neutral-100 hover:text-neutral-700 transition-all active:scale-95"
                                title="Gặp nhân viên hỗ trợ"
                            >
                                <Headphones className="w-5 h-5" />
                            </button>
                        )}

                    {/* Voice Recording Button */}
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            disabled={isLoading}
                            className="flex-shrink-0 text-neutral-400 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
                            title="Ghi âm tin nhắn thoại"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => stopRecording(true)}
                            className="flex-shrink-0 text-red-500 bg-red-50 p-2.5 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                            title="Hủy ghi âm"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    </div>
                </div>

                {isRecording ? (
                    <div className="flex-1 min-w-0 flex items-center justify-between bg-red-50 rounded-2xl px-4 py-3 border border-red-200 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex items-center justify-center flex-shrink-0">
                                <span className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
                                <span className="relative w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                            </div>
                            <span className="text-red-600 font-bold tracking-widest flex-shrink-0 text-sm">{formatTime(recordingTime)}</span>
                            <span className="text-red-500 text-xs font-medium truncate">Đang ghi âm...</span>
                        </div>
                        <button 
                            onClick={() => stopRecording(false)}
                            className="flex-shrink-0 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1 px-3 ml-2"
                        >
                            <StopCircle className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Xong</span>
                        </button>
                    </div>
                ) : (
                    <div className={`flex-1 min-w-0 flex flex-col rounded-2xl transition-all duration-300 ease-out border shadow-sm ${
                        isFocused 
                            ? 'bg-white border-blue-400 ring-4 ring-blue-50' 
                            : 'bg-neutral-100 border-transparent hover:bg-neutral-200/50'
                    }`}>
                        {selectedImage && (
                            <div className="p-3 pb-0 relative animate-fadeIn">
                                {selectedImage.startsWith('data:image/') ? (
                                    <div className="relative inline-block group">
                                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-neutral-200 shadow-sm transition-transform group-hover:scale-105" />
                                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : selectedImage.startsWith('data:audio/') ? (
                                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-200 shadow-sm pr-6 inline-block relative group">
                                        <audio controls src={selectedImage} className="h-8 w-40" />
                                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : (
                                    <div className="h-16 w-16 flex flex-col items-center justify-center bg-blue-50 rounded-xl border border-blue-200 shadow-sm inline-flex relative group">
                                        <span className="text-xl">📄</span>
                                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-end">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={currentMessage}
                                onChange={(e) => {
                                    setCurrentMessage(e.target.value);
                                    if (onTyping) onTyping();
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={handleKeyPress}
                                onPaste={handlePaste}
                                onFocus={() => {
                                    setIsFocused(true)
                                    setShowUtils(false)
                                }}
                                onBlur={() => {
                                    if (!currentMessage.trim() && !selectedImage) {
                                        setIsFocused(false)
                                        setShowUtils(true)
                                    }
                                }}
                                disabled={isLoading}
                                placeholder={selectedImage ? "Thêm chú thích..." : "Nhập tin nhắn..."}
                                className={`w-full bg-transparent border-none px-4 text-sm text-neutral-900 leading-relaxed focus:ring-0 outline-none placeholder-neutral-400 transition-all max-h-40 min-h-[24px] resize-none overflow-y-auto ${selectedImage ? 'py-2' : 'py-3'}`}
                            />
                            {!isRecording && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="flex-shrink-0 text-neutral-400 p-2 mb-1.5 mr-1.5 rounded-full hover:bg-neutral-200 hover:text-neutral-700 transition-all active:scale-95 disabled:opacity-50"
                                    title="Đính kèm ảnh/tài liệu"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        if (isRecording) {
                            stopRecording(false);
                        } else {
                            onSendMessage();
                            setIsFocused(false);
                            setShowUtils(true);
                        }
                    }}
                    disabled={isLoading || (!currentMessage.trim() && !selectedImage && !isRecording)}
                    className={`
                        flex-shrink-0 p-2.5 rounded-xl text-white transition-all shadow-sm mb-0.5 active:scale-95
                        ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}
                        disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none
                    `}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </button>
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 text-center font-medium">
                {isHumanMode ? 'Đang chat trực tiếp với nhân viên' : 'AI có thể phản hồi không chính xác. Xin vui lòng kiểm tra thông tin bổ sung.'}
            </div>
        </div>
    )
}
