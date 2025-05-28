import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'System Alert',
    message: 'High CPU usage detected on primary server',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Security Warning',
    message: 'Multiple failed login attempts detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Backup Complete',
    message: 'Daily system backup completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'System Update',
    message: 'New security patches available for installation',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return 'bg-red-50 border-red-100';
    case 'warning':
      return 'bg-amber-50 border-amber-100';
    case 'success':
      return 'bg-emerald-50 border-emerald-100';
    case 'info':
      return 'bg-blue-50 border-blue-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
  userRole,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Recent Notifications
          </span>
        </div>
        <button
          className="text-xs text-slate-600 hover:text-slate-800 transition-colors"
          onClick={() => {/* Mark all as read */}}
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative p-4 rounded-lg border ${getNotificationColor(
              notification.type
            )} ${notification.read ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <button
                    onClick={() => {/* Dismiss notification */}}
                    className="ml-2 text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(notification.timestamp)}
                </p>
              </div>
            </div>
            {!notification.read && (
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-600" />
            )}
          </div>
        ))}
      </div>

      <button
        className="w-full mt-4 text-sm text-slate-600 hover:text-slate-800 transition-colors"
        onClick={() => {/* View all notifications */}}
      >
        View All Notifications
      </button>
    </div>
  );
}; 