// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'CUSTOMER';
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  costPrice?: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  category: Category;
  inventoryItem?: InventoryItem;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  availableQuantity: number;
  minStockLevel: number;
  reorderPoint: number;
  lastRestocked?: string;
}

// Order Types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  orderItems: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress?: string;
  paymentMethod: string;
  trackingNumber?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingOrders: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Employee Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position?: string;
  department?: string;
  salary?: number;
  hireDate: string;
  isActive: boolean;
}
