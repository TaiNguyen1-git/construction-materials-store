import { z } from 'zod';

/**
 * AI Material Estimator Response Schema
 * Validates the JSON output from Gemini for material estimation
 */
export const RoomDimensionSchema = z.object({
  name: z.string(),
  length: z.number().describe('Chiều dài (m)'),
  width: z.number().describe('Chiều rộng (m)'),
  area: z.number().optional(),
  x: z.number().optional().describe('Tọa độ X tương đối từ tâm nhà (m)'),
  z: z.number().optional().describe('Tọa độ Z tương đối từ tâm nhà (m)'),
  height: z.number().default(3.2)
});

export const EstimatorAIResponseSchema = z.object({
  buildingStyle: z.enum(['nhà_cấp_4', 'nhà_phố', 'biệt_thự']),
  roofType: z.string().default('bê_tông'),
  rooms: z.array(RoomDimensionSchema),
  totalArea: z.number(),
  wallPerimeter: z.number().optional(),
  confidence: z.number(),
  notes: z.string().optional()
});

/**
 * Chatbot Analysis Result Schema
 * Validates the output from the main chatbot AI logic
 */
export const ChatbotResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()).default([]),
  productRecommendations: z.array(z.object({
    name: z.string(),
    price: z.number().optional(),
    unit: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  confidence: z.number().min(0).max(1).default(1),
  intent: z.string().optional(),
  ocrData: z.object({
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    supplierName: z.string().optional(),
    items: z.array(z.unknown()).optional(),
    totalAmount: z.number().optional(),
    confidence: z.number().optional(),
  }).optional(),
  orderData: z.unknown().optional(),
  calculationData: z.record(z.unknown()).optional(),
  data: z.unknown().optional(),
});

export const InvoiceDataSchema = z.object({
  invoiceNumber: z.string().nullable().optional(),
  invoiceDate: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  items: z.array(z.object({
    name: z.string().nullable().optional(),
    quantity: z.number().nullable().optional(),
    unit: z.string().nullable().optional(),
    unitPrice: z.number().nullable().optional(),
    totalPrice: z.number().nullable().optional()
  })).optional().default([]),
  totalAmount: z.number().nullable().optional(),
  taxAmount: z.number().nullable().optional(),
  confidence: z.number().optional().default(0.9),
  rawText: z.string().optional()
});

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  guestId: z.string().optional(),
  role: z.enum(['CUSTOMER', 'CONTRACTOR', 'EMPLOYEE', 'MANAGER']).optional().default('CUSTOMER'),
  referralCode: z.string().optional(),
});

/**
 * Common request validation helper
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  } else {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return { success: false, data: null, errors };
  }
}

/**
 * Sanitize strings to prevent basic XSS
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
}

export type EstimatorAIResponse = z.infer<typeof EstimatorAIResponseSchema>;
export type ChatbotAIResponse = z.infer<typeof ChatbotResponseSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;
