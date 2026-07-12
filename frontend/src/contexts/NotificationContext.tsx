import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Notification } from '../types';
import { notificationsService } from '../services/notifications.service';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const prevUnreadCount = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsService.list({ page: 1, page_size: 10 });
      setNotifications(data.items);
      
      const countData = await notificationsService.getUnreadCount();
      setUnreadCount(countData.count);

      // If we have new unread notifications compared to the last check
      if (countData.count > prevUnreadCount.current && prevUnreadCount.current !== 0) {
        const latest = data.items.find(n => !n.is_read);
        if (latest) {
          toast.success(latest.title + ': ' + latest.message, {
            duration: 5000,
            position: 'top-right',
            icon: '🔔',
          });
        }
      }
      prevUnreadCount.current = countData.count;
    } catch (error) {
      console.error('Failed to poll notifications:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));

      // Setup 30s polling for real-time notifications drawer updates
      const timer = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(timer);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadCount.current = 0;
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      prevUnreadCount.current = Math.max(0, prevUnreadCount.current - 1);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      prevUnreadCount.current = 0;
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
