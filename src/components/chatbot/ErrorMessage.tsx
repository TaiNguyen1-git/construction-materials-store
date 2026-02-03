'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
    onRetry: () => void;
    isLoading: boolean;
    retryCount: number;
}

export default function ErrorMessage({ onRetry, isLoading, retryCount }: ErrorMessageProps) {
    return (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-900">Lỗi Kết Nối</h3>
                    <p className="text-xs text-red-700 mt-1">
                        Không thể kết nối đến máy chủ. Vui lòng thử lại.
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                        <button
                            onClick={onRetry}
                            disabled={isLoading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-full shadow-sm text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Thử lại
                        </button>
                        {retryCount > 0 && (
                            <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                                Lần thử {retryCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
