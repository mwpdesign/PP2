import React, { useState, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationItem {
  id: number;
  title: string;
  priority: string;
  time: string;
  priorityColor: string;
  isRead: boolean;
}

interface MobileNotificationBellProps {
  notifications?: NotificationItem[];
}

// Mock notifications data - same as desktop version
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

export const MobileNotificationBell: React.FC<MobileNotificationBellProps> = ({
  notifications = defaultNotifications
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationList, setNotificationList] = useState(notifications);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notificationList.filter(n => !n.isRead).length;

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAsRead = (notificationId: number) => {
    setNotificationList(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  const recentNotifications = notificationList.slice(0, 3); // Show fewer on mobile

  return (
    <>
      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className="relative p-1 rounded-full hover:bg-slate-600 transition-colors"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Mobile Notifications Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleCloseDropdown}
            />

            {/* Dropdown */}
            <div className="fixed top-16 left-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden">
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
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.priorityColor === 'red' ? 'bg-red-500' :
                            notification.priorityColor === 'orange' ? 'bg-orange-500' :
                            notification.priorityColor === 'yellow' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={`text-sm font-medium ${
                                notification.isRead ? 'text-gray-700' : 'text-gray-900'
                              } leading-tight`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                notification.priorityColor === 'red' ? 'bg-red-100 text-red-600' :
                                notification.priorityColor === 'orange' ? 'bg-orange-100 text-orange-600' :
                                notification.priorityColor === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {notification.priority}
                              </span>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
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
              <div className="p-4 border-t border-gray-200 space-y-2">
                {recentNotifications.length > 0 && (
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
                )}
                <button
                  onClick={handleCloseDropdown}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};