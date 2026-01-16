import { useState, useEffect } from 'react';

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

  // Load notifications from API on component mount
  useEffect(() => {
    loadNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Try to fetch from API
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userId = user ? JSON.parse(user).id : null;

      if (userId || token) {
        try {
          const response = await fetch('/api/notifications?limit=20', {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'x-user-id': userId })
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.notifications) {
              const apiNotifications: Notification[] = data.data.notifications.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: mapNotificationType(n.type),
                priority: mapPriority(n.priority),
                read: n.isRead,
                createdAt: n.createdAt,
                data: n.data
              }));
              setNotifications(apiNotifications);
              setUnreadCount(apiNotifications.filter(n => !n.read).length);
              return;
            }
          }
        } catch (apiError) {
          console.warn('Could not fetch notifications from API, using local storage:', apiError);
        }
      }

      // Fallback to local storage for guests or when API fails
      if (typeof window !== 'undefined') {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
          const parsedNotifications: Notification[] = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
          setUnreadCount(parsedNotifications.filter(n => !n.read).length);
        } else {
          // Empty state for new users - no mock data
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to map API types to hook types
  function mapNotificationType(type: string): Notification['type'] {
    const typeMap: Record<string, Notification['type']> = {
      'ORDER_NEW': 'order',
      'ORDER_UPDATE': 'order',
      'STOCK_LOW': 'stock',
      'STOCK_CRITICAL': 'stock',
      'LOYALTY_POINTS': 'loyalty',
      'LOYALTY_TIER_UP': 'loyalty',
      'SYSTEM': 'info',
      'PROMOTION': 'info'
    };
    return typeMap[type] || 'info';
  }

  function mapPriority(priority: string): Notification['priority'] {
    const priorityMap: Record<string, Notification['priority']> = {
      'CRITICAL': 'high',
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low'
    };
    return priorityMap[priority] || 'medium';
  }

  const markAsRead = async (id: string) => {
    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);

      // Try to call API first
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userId = user ? JSON.parse(user).id : null;

      if (token || userId) {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'x-user-id': userId })
            },
            body: JSON.stringify({ action: 'markAsRead', notificationId: id })
          });
        } catch (e) {
          console.warn('Could not mark notification as read via API');
        }
      }

      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }

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

      // Try to call API first
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userId = user ? JSON.parse(user).id : null;

      if (token || userId) {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'x-user-id': userId })
            },
            body: JSON.stringify({ action: 'markAllAsRead' })
          });
        } catch (e) {
          console.warn('Could not mark all notifications as read via API');
        }
      }

      // Also save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }

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

      // Try to delete via API
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userId = user ? JSON.parse(user).id : null;

      if (token || userId) {
        try {
          await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'x-user-id': userId })
            }
          });
        } catch (e) {
          console.warn('Could not delete notification via API');
        }
      }

      // Also save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }

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

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }

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