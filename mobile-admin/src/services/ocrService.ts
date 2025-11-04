import { API_BASE_URL } from '../constants/config';

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData?: {
    invoiceNumber?: string;
    date?: string;
    total?: number;
    items?: Array<{
      name: string;
      quantity?: number;
      price?: number;
      total?: number;
    }>;
    supplier?: string;
  };
}

export interface OCRResponse {
  success: boolean;
  data?: OCRResult;
  error?: {
    code: string;
    message: string;
  };
}

class OCRService {
  async processImage(imageUri: string, type: 'invoice' | 'general' = 'general'): Promise<OCRResponse> {
    try {
      // Create form data
      const formData = new FormData();
      
      // Get file extension
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as unknown as Blob);

      const endpoint = type === 'invoice' ? '/api/ocr/invoice' : '/api/ocr/scan';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OCR processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xử lý hình ảnh';
      
      return {
        success: false,
        error: {
          code: 'OCR_FAILED',
          message: errorMessage,
        },
      };
    }
  }

  async processInvoice(imageUri: string): Promise<OCRResponse> {
    return this.processImage(imageUri, 'invoice');
  }

  async scanText(imageUri: string): Promise<OCRResponse> {
    return this.processImage(imageUri, 'general');
  }
}

const ocrServiceInstance = new OCRService();
export default ocrServiceInstance;
