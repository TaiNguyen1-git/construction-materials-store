import React, { RefObject } from 'react';
import toast from 'react-hot-toast';
import { ChatMessage, ChatMode, LiveChatMessage, ReportData } from './types';
import WelcomeScreen from './WelcomeScreen';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LiveTypingIndicator from './LiveTypingIndicator';
import ErrorMessage from './ErrorMessage';
import ChatOCRPreview from '../ChatOCRPreview';
import ChatOrderSummary from '../ChatOrderSummary';
import ChatConfirmDialog from '../ChatConfirmDialog';

interface ChatMessagesAreaProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    isError: boolean;
    errorRetryCount: number;
    chatMode: ChatMode;
    isAdmin: boolean;
    conversationId?: string;
    myIdentity?: { id: string; name: string };
    abortController: AbortController | null;
    
    // Refs
    chatContainerRef: RefObject<HTMLDivElement | null>;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    
    // Handlers
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    handleConnectSupport: () => void;
    sendMessage: (text: string) => void;
    handleSuggestionClick: (s: string, m?: ChatMessage) => void;
    setLightboxImage: (img: string | null) => void;
    stopResponse: () => void;
    regenerateResponse: () => void;
    retryLastMessage: () => void;
    onAddToCart?: (product: import('./types').ProductRecommendation) => void;
    onDeleteMessage?: (messageId: string) => void;
    onReplyMessage?: (message: ChatMessage, isUser: boolean) => void;
    
    // Feature specific
    showOCRPreview: boolean;
    setShowOCRPreview: (val: boolean) => void;
    pendingOCRData: import('./types').OCRData | null;
    setPendingOCRData: (val: import('./types').OCRData | null) => void;
    showOrderSummary: boolean;
    setShowOrderSummary: (val: boolean) => void;
    pendingOrderData: import('./types').OrderData | null;
    setPendingOrderData: (val: import('./types').OrderData | null) => void;
    showConfirmDialog: boolean;
    setShowConfirmDialog: (val: boolean) => void;
    confirmDialogData: import('./types').ConfirmDialogData | null;
    setConfirmDialogData: (val: import('./types').ConfirmDialogData | null) => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: () => void;
}

export const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = (props) => {
    const {
        messages, isLoading, isStreaming, isError, errorRetryCount,
        chatMode, isAdmin, conversationId, myIdentity, abortController,
        chatContainerRef, messagesEndRef, handleScroll, handleConnectSupport,
        sendMessage, handleSuggestionClick, setLightboxImage,
        stopResponse, regenerateResponse, retryLastMessage, onAddToCart,
        onDeleteMessage, onReplyMessage,
        showOCRPreview, setShowOCRPreview, pendingOCRData, setPendingOCRData,
        showOrderSummary, setShowOrderSummary, pendingOrderData, setPendingOrderData,
        showConfirmDialog, setShowConfirmDialog, confirmDialogData, setConfirmDialogData,
        hasMore, isLoadingMore, loadMore
    } = props;

    const displayMessages = messages;

    return (
        <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 bg-slate-50 scroll-smooth"
        >
            {/* Load More Trigger */}
            {hasMore && displayMessages.length > 0 && (
                <div className="flex justify-center py-2">
                    <button 
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors py-1 px-4 rounded-full border border-slate-200 bg-white shadow-sm"
                    >
                        {isLoadingMore ? 'Đang tải tin cũ...' : 'Xem thêm tin nhắn cũ'}
                    </button>
                </div>
            )}
            {/* Welcome Screen */}
            {displayMessages.length === 0 && !isLoading && (
                <WelcomeScreen
                    isAdmin={isAdmin}
                    onConnectSupport={handleConnectSupport}
                    onSuggestionClick={(text: string) => sendMessage(text)}
                />
            )}

            {/* Messages */}
            {displayMessages.map((message, index) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                    isAdmin={isAdmin}
                    onSuggestionClick={handleSuggestionClick}
                    onAddToCart={onAddToCart}
                    isLoading={isLoading}
                    onImageClick={setLightboxImage}
                    onReply={onReplyMessage}
                    onDelete={onDeleteMessage}
                    isLast={index === displayMessages.length - 1}
                />
            ))}

            {/* Typing Indicators */}
            {isLoading && !isStreaming && chatMode === 'AI' && <TypingIndicator isAdmin={isAdmin} />}
            {chatMode === 'HUMAN' && conversationId && myIdentity && (
                <LiveTypingIndicator
                    conversationId={conversationId}
                    myUserId={myIdentity.id}
                />
            )}

            {/* AI Control Buttons */}
            {isLoading && chatMode === 'AI' && abortController && (
                <div className="flex justify-center sticky bottom-2 z-20 animate-fadeIn">
                    <button
                        onClick={stopResponse}
                        className="bg-white/80 backdrop-blur-md border border-red-200 text-red-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-50 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Dừng phản hồi AI
                    </button>
                </div>
            )}

            {!isLoading && chatMode === 'AI' && displayMessages.length > 0 && displayMessages[displayMessages.length - 1].botMessage && (
                <div className="flex justify-start pl-14 animate-fadeIn">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            regenerateResponse();
                        }}
                        className="text-[11px] text-blue-600 font-bold flex items-center gap-1.5 hover:text-blue-700 transition-colors opacity-80 hover:opacity-100"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                        Tạo lại câu trả lời
                    </button>
                </div>
            )}

            {/* Error & Special UIs */}
            {isError && (
                <ErrorMessage
                    onRetry={retryLastMessage}
                    isLoading={isLoading}
                    retryCount={errorRetryCount}
                />
            )}

            {showOCRPreview && pendingOCRData && (
                <div className="mt-4">
                    <ChatOCRPreview
                        invoiceNumber={pendingOCRData.invoiceNumber}
                        invoiceDate={pendingOCRData.invoiceDate ? new Date(pendingOCRData.invoiceDate) : undefined}
                        supplierName={pendingOCRData.supplierName}
                        items={pendingOCRData.items || []}
                        totalAmount={pendingOCRData.totalAmount}
                        confidence={pendingOCRData.confidence || 0}
                        onConfirm={() => {
                            sendMessage('Xác nhận lưu')
                            setShowOCRPreview(false)
                        }}
                        onEdit={() => {
                            setShowOCRPreview(false)
                            toast('Chức năng chỉnh sửa đang được phát triển')
                        }}
                        onCancel={() => {
                            sendMessage('Hủy')
                            setShowOCRPreview(false)
                            setPendingOCRData(null)
                        }}
                    />
                </div>
            )}

            {showOrderSummary && pendingOrderData && (
                <div className="mt-4">
                    <ChatOrderSummary
                        items={pendingOrderData.items || []}
                        customerInfo={pendingOrderData.customerInfo}
                        paymentMethod={pendingOrderData.paymentMethod}
                        deliveryMethod={pendingOrderData.deliveryMethod}
                        totalAmount={pendingOrderData.totalAmount}
                        onConfirm={() => {
                            sendMessage('Xác nhận đặt hàng')
                            setShowOrderSummary(false)
                        }}
                        onEdit={() => {
                            setShowOrderSummary(false)
                            toast('Chức năng chỉnh sửa đang được phát triển')
                        }}
                        onCancel={() => {
                            sendMessage('Hủy đơn hàng')
                            setShowOrderSummary(false)
                            setPendingOrderData(null)
                        }}
                    />
                </div>
            )}

            {showConfirmDialog && confirmDialogData && (
                <div className="mt-4">
                    <ChatConfirmDialog
                        type={confirmDialogData.type || 'info'}
                        title={confirmDialogData.title}
                        message={confirmDialogData.message}
                        confirmText={confirmDialogData.confirmText}
                        cancelText={confirmDialogData.cancelText}
                        onConfirm={() => {
                            if (confirmDialogData.onConfirm) confirmDialogData.onConfirm()
                            setShowConfirmDialog(false)
                            setConfirmDialogData(null)
                        }}
                        onCancel={() => {
                            if (confirmDialogData.onCancel) confirmDialogData.onCancel()
                            setShowConfirmDialog(false)
                            setConfirmDialogData(null)
                        }}
                    />
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};
