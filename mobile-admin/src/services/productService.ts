import apiService from './api';
import { API_ENDPOINTS } from '../constants/config';
import { ApiResponse, PaginatedResponse, Product } from '../types';

class ProductService {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      return await apiService.get(API_ENDPOINTS.PRODUCTS, params);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_PRODUCTS_FAILED',
          message: error.response?.data?.error?.message || 'Không thể tải danh sách sản phẩm',
        },
      };
    }
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    try {
      return await apiService.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_PRODUCT_FAILED',
          message: error.response?.data?.error?.message || 'Không thể tải thông tin sản phẩm',
        },
      };
    }
  }

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      return await apiService.post(API_ENDPOINTS.PRODUCTS, data);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_PRODUCT_FAILED',
          message: error.response?.data?.error?.message || 'Không thể tạo sản phẩm',
        },
      };
    }
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      return await apiService.put(API_ENDPOINTS.PRODUCT_BY_ID(id), data);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PRODUCT_FAILED',
          message: error.response?.data?.error?.message || 'Không thể cập nhật sản phẩm',
        },
      };
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_PRODUCT_FAILED',
          message: error.response?.data?.error?.message || 'Không thể xóa sản phẩm',
        },
      };
    }
  }
}

export default new ProductService();
