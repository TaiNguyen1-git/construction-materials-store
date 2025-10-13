import apiService from './api';
import { API_ENDPOINTS } from '../constants/config';
import { ApiResponse, DashboardStats } from '../types';

class DashboardService {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      return await apiService.get(API_ENDPOINTS.ANALYTICS_DASHBOARD);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_DASHBOARD_STATS_FAILED',
          message: error.response?.data?.error?.message || 'Không thể tải thống kê dashboard',
        },
      };
    }
  }
}

export default new DashboardService();
