import apiService from './api';
import { API_ENDPOINTS } from '../constants/config';
import { ApiResponse, DashboardStats } from '../types';

class DashboardService {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      return await apiService.get(API_ENDPOINTS.ANALYTICS_DASHBOARD);
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Không thể tải thống kê dashboard';
      
      return {
        success: false,
        error: {
          code: 'FETCH_DASHBOARD_STATS_FAILED',
          message: errorMessage || 'Không thể tải thống kê dashboard',
        },
      };
    }
  }
}

const dashboardServiceInstance = new DashboardService();
export default dashboardServiceInstance;
