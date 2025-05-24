import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />
};

const Notification: React.FC<NotificationProps> = ({ type, message, description }) => {
  return (
    <div className="flex items-start p-4 min-w-[320px] bg-white rounded-lg shadow-lg border border-gray-100">
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
};

// Configure toast container
export const NotificationContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

// Helper functions for showing notifications
export const showNotification = {
  success: (message: string, description?: string) => {
    toast.success(<Notification type="success" message={message} description={description} />);
  },
  error: (message: string, description?: string) => {
    toast.error(<Notification type="error" message={message} description={description} />);
  },
  warning: (message: string, description?: string) => {
    toast.warning(<Notification type="warning" message={message} description={description} />);
  },
  info: (message: string, description?: string) => {
    toast.info(<Notification type="info" message={message} description={description} />);
  }
};

export default Notification; 