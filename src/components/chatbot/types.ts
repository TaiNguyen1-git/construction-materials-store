// Chatbot Types - Shared type definitions for all chatbot components

export interface ProductRecommendation {
    name: string;
    price?: number;
    unit?: string;
    description?: string;
    imageUrl?: string;
    slug?: string;
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

export interface OCRData {
    invoiceNumber?: string;
    invoiceDate?: string;
    supplierName?: string;
    items?: InvoiceItem[];
    totalAmount?: number;
    confidence?: number;
}

export interface OrderItem {
    productName: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    totalPrice?: number;
}

export interface OrderData {
    orderNumber?: string;
    trackingUrl?: string;
    items?: OrderItem[];
    customerInfo?: { name: string; phone: string; address: string };
    paymentMethod?: string;
    deliveryMethod?: string;
    totalAmount?: number;
}

export interface ReportData {
    dateRange?: { from: string | Date; to: string | Date };
    totalRevenue?: number;
    totalOrders?: number;
    orders?: Array<Record<string, unknown>>;
    topProducts?: Array<Record<string, unknown>>;
}

export interface ChatMessage {
    id: string;
    userMessage: string;
    userImage?: string;
    botMessage: string;
    suggestions: string[];
    productRecommendations?: ProductRecommendation[];
    confidence: number;
    timestamp: string;
    ocrData?: OCRData;
    calculationData?: Record<string, unknown>;
    orderData?: OrderData;
    data?: ReportData;
    requiresConfirmation?: boolean;
}

export interface ChatbotProps {
    customerId?: string;
    onClose?: () => void; // Optional: For embedded mode in FloatingWidgetsContainer
}

export interface ConfirmDialogData {
    type?: 'info' | 'warning' | 'success';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

// ============================================================
// HYBRID CHAT TYPES - AI <-> Live Agent switching
// ============================================================

export type ChatMode = 'AI' | 'HUMAN';

export interface LiveChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    createdAt: string;
    isRead: boolean;
    isSending?: boolean;
    tempId?: string;
}

export interface GuestIdentity {
    id: string;          // guest_xxxxx
    name: string;        // "Khách #xxxxx" 
    createdAt: string;
}

export interface CustomerContext {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    totalSpent: number;
    totalOrders: number;
    recentOrders: CustomerOrder[];
    isGuest: boolean;
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    itemCount: number;
}

export interface HybridChatState {
    mode: ChatMode;
    conversationId: string | null;
    isConnecting: boolean;
    agentName: string | null;
    agentAvatar: string | null;
    waitingPosition?: number;
}
