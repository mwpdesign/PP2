import React, { useState } from 'react';
import { Bell, X, Shield, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'security' | 'verification' | 'system' | 'audit';
  timestamp: Date;
  isRead: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New IVR Verification Request',
      message: 'Pending verification for wound care supplies - Request #IVR-2847',
      type: 'verification',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isRead: false
    },
    {
      id: '2',
      title: 'HIPAA Compliance Audit',
      message: 'Weekly security audit completed successfully',
      type: 'security',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    },
    {
      id: '3',
      title: 'System Performance Alert',
      message: 'IVR response time exceeded threshold (2.5s)',
      type: 'system',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      isRead: true
    },
    {
      id: '4',
      title: 'Access Log Review Required',
      message: 'Monthly PHI access log review pending',
      type: 'audit',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: true
    },
    {
      id: '5',
      title: 'Verification API Status',
      message: 'Insurance verification API performance improved by 15%',
      type: 'system',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      isRead: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'security':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'verification':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'audit':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-600 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">Notifications</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-2 text-sm text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {format(notification.timestamp, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="ml-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900 text-center"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 