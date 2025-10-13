import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Configure axios base URL (update this to match your backend)
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'EMPLOYEE' | 'CUSTOMER';
  phone?: string;
  address?: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      return { user, token, refreshToken };
    } catch (error) {
      throw new Error((error as any).response?.data?.error || 'Login failed');
    }
  },

  // Register user
  async register(data: RegisterData): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await api.post('/auth/register', data);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      return { user, token, refreshToken };
    } catch (error) {
      throw new Error((error as any).response?.data?.error || 'Registration failed');
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear tokens
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // Notify backend about logout (optional)
      await api.post('/auth/logout');
    } catch (error) {
      // Even if backend call fails, clear local tokens
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return null;

      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      // If token is invalid, clear it
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  },

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  },
};

export default authService;