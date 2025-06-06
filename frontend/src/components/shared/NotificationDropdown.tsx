import React, { useEffect, useRef } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface NotificationItem {
  id: number;
  title: string;
  priority: string;
  time: string;
  priorityColor: string;
  isRead?: boolean;
  fullMessage?: string;
  timestamp?: Date;
}

interface NotificationDropdownProps {
  notification: NotificationItem;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  position: { top: number; left: number };
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  position
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPriorityIcon = (priorityColor: string) => {
    const baseClasses = "h-4 w-4";
    switch (priorityColor) {
      case 'red':
        return <div className={`${baseClasses} bg-red-500 rounded-full`} />;
      case 'orange':
        return <div className={`${baseClasses} bg-orange-500 rounded-full`} />;
      case 'yellow':
        return <div className={`${baseClasses} bg-yellow-500 rounded-full`} />;
      default:
        return <div className={`${baseClasses} bg-gray-500 rounded-full`} />;
    }
  };

  const getPriorityBadgeColor = (priorityColor: string) => {
    switch (priorityColor) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFullMessage = (notification: NotificationItem) => {
    // Generate detailed messages based on the notification type
    switch (notification.title) {
      case 'Skin Graft IVR Missing Clinical Photos':
        return 'The IVR request for skin graft procedure is missing required clinical photographs. Please upload high-resolution images showing the wound site, measurements, and surrounding tissue condition. This is required for insurance pre-authorization approval.';
      case 'Advanced Wound Matrix Pre-Auth Denied':
        return 'The insurance pre-authorization for Advanced Wound Matrix has been denied. Reason: Insufficient documentation of failed conventional treatments. Please provide detailed treatment history and consider submitting additional clinical evidence or peer-to-peer review.';
      case 'Temperature-Controlled Shipment Delayed':
        return 'Your temperature-controlled shipment containing bioactive wound care products has been delayed due to weather conditions. Expected delivery has been pushed back by 24-48 hours. The cold chain integrity is being maintained. You will receive tracking updates via SMS.';
      case 'Negative Pressure Therapy Documentation Required':
        return 'Additional documentation is required for the Negative Pressure Therapy (NPWT) request. Please provide: 1) Wound measurements and photos, 2) Previous treatment attempts, 3) Patient mobility assessment, 4) Home care support evaluation. Submit within 48 hours to avoid processing delays.';
      default:
        return notification.title;
    }
  };

  const formatTimestamp = (time: string) => {
    // Convert relative time to actual timestamp for display
    const now = new Date();
    let timestamp = new Date(now);

    if (time.includes('mins ago')) {
      const mins = parseInt(time.split(' ')[0]);
      timestamp = new Date(now.getTime() - mins * 60 * 1000);
    } else if (time.includes('hour ago')) {
      const hours = parseInt(time.split(' ')[0]);
      timestamp = new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (time.includes('hours ago')) {
      const hours = parseInt(time.split(' ')[0]);
      timestamp = new Date(now.getTime() - hours * 60 * 60 * 1000);
    }

    return timestamp.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 w-96 bg-white rounded-xl shadow-2xl border border-slate-200"
      style={{
        top: position.top,
        left: Math.max(16, Math.min(position.left, window.innerWidth - 400)), // Keep within viewport
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          {getPriorityIcon(notification.priorityColor)}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadgeColor(notification.priorityColor)}`}>
            {notification.priority} Priority
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-tight">
          {notification.title}
        </h3>

        <div className="text-sm text-slate-700 leading-relaxed mb-4">
          {getFullMessage(notification)}
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <span>Received: {formatTimestamp(notification.time)}</span>
          <span className="text-slate-400">•</span>
          <span>{notification.time}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
            >
              <CheckIcon className="h-4 w-4" />
              <span>Mark as Read</span>
            </button>
          )}

          {notification.isRead && (
            <span className="flex items-center space-x-2 text-sm text-slate-500">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span>Read</span>
            </span>
          )}

          <button
            onClick={onClose}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};