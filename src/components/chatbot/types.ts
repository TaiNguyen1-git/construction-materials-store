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
