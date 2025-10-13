import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'order' | 'stock' | 'loyalty';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Load notifications from storage on app start
  useEffect(() => {
    loadNotifications();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, refresh notifications
      loadNotifications();
    }
    setAppState(nextAppState);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch from an API
      // For now, we'll load from local storage
      const storedNotifications = await AsyncStorage.getItem('notifications');
      
      if (storedNotifications) {
        const parsedNotifications: Notification[] = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter(n => !n.read).length);
      } else {
        // Load mock notifications if none exist
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Low Stock Alert',
            message: 'Cement (SKU: CEM-001) is running low. Current stock: 5 units.',
            type: 'stock',
            priority: 'high',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'New Order',
            message: 'Order #ORD-2023-0012 has been placed.',
            type: 'order',
            priority: 'medium',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ];
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        await AsyncStorage.setItem('notifications', JSON.stringify(mockNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      
      // Save to storage
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
      }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Save to storage
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(unreadCount - 1);
      }
      
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      
      // Save to storage
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      
      if (!newNotification.read) {
        setUnreadCount(unreadCount + 1);
      }
      
      // Save to storage
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      return { success: true, notification: newNotification };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, error: 'Failed to add notification' };
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return 'alert-circle';
      case 'order':
        return 'cart';
      case 'payment':
        return 'currency-usd';
      case 'supplier':
        return 'truck';
      case 'project':
        return 'folder';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'stock':
        return '#F44336';
      case 'order':
        return '#2196F3';
      case 'payment':
        return '#4CAF50';
      case 'supplier':
        return '#9C27B0';
      case 'project':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    getNotificationIcon,
    getNotificationColor,
  };
};