import React from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

interface RecentActivityFeedProps {
  activities: ActivityLog[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const getSeverityIcon = (severity: ActivityLog['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityClass = (severity: ActivityLog['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      default:
        return 'bg-green-50';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`p-4 rounded-lg ${getSeverityClass(activity.severity)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getSeverityIcon(activity.severity)}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {activity.user}
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {activity.action}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activity.details}
              </p>
            </div>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-6">
          <Activity className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No recent activity</h3>
          <p className="mt-1 text-sm text-slate-500">
            New activities will appear here as they occur
          </p>
        </div>
      )}

      {activities.length > 0 && (
        <button
          className="mt-4 w-full px-4 py-2 bg-slate-50 text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          View All Activity
        </button>
      )}
    </div>
  );
}; 