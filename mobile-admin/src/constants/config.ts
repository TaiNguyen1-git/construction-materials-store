// API Configuration
// Thay đổi địa chỉ này khi deploy production
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' // Development (local)
  : 'https://your-production-domain.com'; // Production

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  
  // Inventory
  INVENTORY: '/api/inventory',
  INVENTORY_BY_ID: (id: string) => `/api/inventory/${id}`,
  
  // Customers  
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  
  // Employees
  EMPLOYEES: '/api/employees',
  EMPLOYEE_BY_ID: (id: string) => `/api/employees/${id}`,
  
  // Categories
  CATEGORIES: '/api/categories',
  
  // Analytics
  ANALYTICS: '/api/analytics',
  ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
};

export const APP_CONFIG = {
  APP_NAME: 'SmartBuild Admin',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  REQUEST_TIMEOUT: 30000, // 30 seconds
};
