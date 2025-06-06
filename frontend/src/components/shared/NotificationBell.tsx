import React, { useState, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationItem {
  id: number;
  title: string;
  priority: string;
  time: string;
  priorityColor: string;
  isRead: boolean;
}

interface NotificationBellProps {
  notifications?: NotificationItem[];
}

// Mock notifications data - in a real app, this would come from props or a context
const defaultNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Skin Graft IVR Missing Clinical Photos',
    priority: 'Critical',
    time: '10 mins ago',
    priorityColor: 'red',
    isRead: false,
  },
  {
    id: 2,
    title: 'Advanced Wound Matrix Pre-Auth Denied',
    priority: 'High',
    time: '25 mins ago',
    priorityColor: 'orange',
    isRead: false,
  },
  {
    id: 3,
    title: 'Temperature-Controlled Shipment Delayed',
    priority: 'Medium',
    time: '1 hour ago',
    priorityColor: 'yellow',
    isRead: true,
  },
  {
    id: 4,
    title: 'Negative Pressure Therapy Documentation Required',
    priority: 'Medium',
    time: '2 hours ago',
    priorityColor: 'yellow',
    isRead: false,
  },
  {
    id: 5,
    title: 'Patient Insurance Verification Complete',
    priority: 'Low',
    time: '3 hours ago',
    priorityColor: 'green',
    isRead: true,
  },
];

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications = defaultNotifications
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [notificationList, setNotificationList] = useState(notifications);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notificationList.filter(n => !n.isRead).length;

  const handleBellClick = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left - 320, // Offset to align dropdown properly
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
    setSelectedNotification(null);
  };

  const handleNotificationClick = (notification: NotificationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNotification(notification);
  };

  const handleMarkAsRead = (notificationId: number) => {
    setNotificationList(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setSelectedNotification(null);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
    setSelectedNotification(null);
  };

  const handleMarkAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const recentNotifications = notificationList.slice(0, 5);

  return (
    <>
      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isDropdownOpen && !selectedNotification && (
          <div
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
            style={{
              top: '100%',
              right: 0,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                  {unreadCount} New
                </span>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      }`}
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          notification.priorityColor === 'red' ? 'bg-red-500' :
                          notification.priorityColor === 'orange' ? 'bg-orange-500' :
                          notification.priorityColor === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            } truncate`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`text-xs ${
                              notification.priorityColor === 'red' ? 'text-red-600' :
                              notification.priorityColor === 'orange' ? 'text-orange-600' :
                              notification.priorityColor === 'yellow' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {notification.priority} Priority
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // TODO: Navigate to full notifications page
                    console.log('Navigate to all notifications');
                    handleCloseDropdown();
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual Notification Dropdown */}
      {selectedNotification && (
        <NotificationDropdown
          notification={selectedNotification}
          isOpen={!!selectedNotification}
          onClose={handleCloseDropdown}
          onMarkAsRead={handleMarkAsRead}
          position={dropdownPosition}
        />
      )}
    </>
  );
};