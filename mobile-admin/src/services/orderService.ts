import apiService from './api';
import { API_ENDPOINTS } from '../constants/config';
import { ApiResponse, PaginatedResponse, Order, OrderStatus } from '../types';

class OrderService {
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    customerId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      return await apiService.get(API_ENDPOINTS.ORDERS, params);
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Không thể tải danh sách đơn hàng';
      
      return {
        success: false,
        error: {
          code: 'FETCH_ORDERS_FAILED',
          message: errorMessage || 'Không thể tải danh sách đơn hàng',
        },
      };
    }
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {
      return await apiService.get(API_ENDPOINTS.ORDER_BY_ID(id));
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Không thể tải thông tin đơn hàng';
      
      return {
        success: false,
        error: {
          code: 'FETCH_ORDER_FAILED',
          message: errorMessage || 'Không thể tải thông tin đơn hàng',
        },
      };
    }
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<ApiResponse<Order>> {
    try {
      return await apiService.put(API_ENDPOINTS.ORDER_STATUS(id), {
        status,
        trackingNumber,
      });
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Không thể cập nhật trạng thái đơn hàng';
      
      return {
        success: false,
        error: {
          code: 'UPDATE_ORDER_STATUS_FAILED',
          message: errorMessage || 'Không thể cập nhật trạng thái đơn hàng',
        },
      };
    }
  }
}

const orderServiceInstance = new OrderService();
export default orderServiceInstance;
