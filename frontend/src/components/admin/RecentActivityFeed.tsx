import React from 'react';
import { UserActivity } from '@/types/system';
import { formatDate } from '@/utils/format';
import { 
  UserPlus, Settings, Shield, FileText, AlertTriangle,
  Phone, Database, Lock, User
} from 'lucide-react';

const getActivityIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'user_created':
      return <UserPlus className="h-5 w-5 text-emerald-600" />;
    case 'settings_updated':
      return <Settings className="h-5 w-5 text-blue-600" />;
    case 'security_alert':
      return <Shield className="h-5 w-5 text-red-600" />;
    case 'compliance_check':
      return <FileText className="h-5 w-5 text-slate-600" />;
    case 'system_alert':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'ivr_call':
      return <Phone className="h-5 w-5 text-indigo-600" />;
    case 'data_sync':
      return <Database className="h-5 w-5 text-purple-600" />;
    case 'auth_event':
      return <Lock className="h-5 w-5 text-slate-600" />;
    default:
      return <User className="h-5 w-5 text-gray-600" />;
  }
};

const getActivityColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'user_created':
      return 'bg-emerald-50 text-emerald-700';
    case 'settings_updated':
      return 'bg-blue-50 text-blue-700';
    case 'security_alert':
      return 'bg-red-50 text-red-700';
    case 'compliance_check':
      return 'bg-slate-50 text-slate-700';
    case 'system_alert':
      return 'bg-amber-50 text-amber-700';
    case 'ivr_call':
      return 'bg-indigo-50 text-indigo-700';
    case 'data_sync':
      return 'bg-purple-50 text-purple-700';
    case 'auth_event':
      return 'bg-slate-50 text-slate-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

const mockActivities: UserActivity[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      name: 'John Smith',
      role: 'Admin',
      avatar: 'https://ui-avatars.com/api/?name=John+Smith'
    },
    action: 'settings_updated',
    resource: 'System Settings',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    details: {
      setting: 'IVR Timeout',
      value: '30s'
    }
  },
  {
    id: '2',
    user: {
      id: 'u2',
      name: 'Sarah Johnson',
      role: 'Security',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson'
    },
    action: 'security_alert',
    resource: 'Authentication',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    details: {
      type: 'Failed Login Attempts',
      count: 3
    }
  },
  {
    id: '3',
    user: {
      id: 'u3',
      name: 'Mike Davis',
      role: 'Compliance',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Davis'
    },
    action: 'compliance_check',
    resource: 'Patient Records',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: {
      status: 'Passed',
      records: 150
    }
  },
  {
    id: '4',
    user: {
      id: 'u4',
      name: 'System',
      role: 'System',
    },
    action: 'data_sync',
    resource: 'Database',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: {
      type: 'Scheduled Backup',
      size: '2.5GB'
    }
  }
];

export const RecentActivityFeed: React.FC = () => {
  return (
    <div className="space-y-4">
      {mockActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-4 p-4 rounded-lg bg-white border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
        >
          <div className={`p-2 rounded-lg ${getActivityColor(activity.action)}`}>
            {getActivityIcon(activity.action)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {activity.user.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(activity.timestamp)}
              </p>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {activity.action.split('_').join(' ')} - {activity.resource}
            </p>
            {activity.details && (
              <div className="mt-1 text-xs text-gray-500">
                {Object.entries(activity.details).map(([key, value]) => (
                  <span key={key} className="mr-3">
                    {key}: <span className="font-medium">{value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 