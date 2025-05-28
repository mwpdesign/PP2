import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Clock, AlertTriangle } from 'lucide-react';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const initialCategories: NotificationCategory[] = [
  {
    id: 'ivr',
    name: 'IVR Updates',
    description: 'Notifications about submissions, approvals, denials, and communications',
    channels: {
      inApp: true,
      email: true,
      sms: false,
      push: true,
    },
  },
  {
    id: 'orders',
    name: 'Order Status',
    description: 'Order confirmations, shipping updates, and delivery notifications',
    channels: {
      inApp: true,
      email: true,
      sms: true,
      push: true,
    },
  },
  {
    id: 'patients',
    name: 'Patient Updates',
    description: 'New patient registrations and profile changes',
    channels: {
      inApp: true,
      email: false,
      sms: false,
      push: false,
    },
  },
  {
    id: 'system',
    name: 'System Alerts',
    description: 'Maintenance, security alerts, and policy updates',
    channels: {
      inApp: true,
      email: true,
      sms: false,
      push: false,
    },
  },
  {
    id: 'admin',
    name: 'Administrative',
    description: 'User role changes and facility updates',
    channels: {
      inApp: true,
      email: true,
      sms: false,
      push: false,
    },
  },
];

const NotificationSection: React.FC = () => {
  const [categories, setCategories] = useState<NotificationCategory[]>(initialCategories);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '07:00',
  });

  const handleChannelToggle = (categoryId: string, channel: keyof NotificationCategory['channels']) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, channels: { ...cat.channels, [channel]: !cat.channels[channel] } }
          : cat
      )
    );
  };

  const handleQuietHoursToggle = () => {
    setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleQuietHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuietHours((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Notification Categories */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Notification Preferences</h3>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
              <div className="mb-4">
                <h4 className="font-medium text-slate-800">{category.name}</h4>
                <p className="text-sm text-slate-600">{category.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${category.id}-inApp`}
                    checked={category.channels.inApp}
                    onChange={() => handleChannelToggle(category.id, 'inApp')}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor={`${category.id}-inApp`} className="text-sm text-slate-700">
                    <MessageSquare className="w-4 h-4 inline-block mr-1" />
                    In-app
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${category.id}-email`}
                    checked={category.channels.email}
                    onChange={() => handleChannelToggle(category.id, 'email')}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor={`${category.id}-email`} className="text-sm text-slate-700">
                    <Mail className="w-4 h-4 inline-block mr-1" />
                    Email
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${category.id}-sms`}
                    checked={category.channels.sms}
                    onChange={() => handleChannelToggle(category.id, 'sms')}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor={`${category.id}-sms`} className="text-sm text-slate-700">
                    <MessageSquare className="w-4 h-4 inline-block mr-1" />
                    SMS
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${category.id}-push`}
                    checked={category.channels.push}
                    onChange={() => handleChannelToggle(category.id, 'push')}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor={`${category.id}-push`} className="text-sm text-slate-700">
                    <Bell className="w-4 h-4 inline-block mr-1" />
                    Push
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Quiet Hours</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-800">Do Not Disturb</p>
              <p className="text-sm text-slate-600">Pause notifications during specified hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHours.enabled}
                onChange={handleQuietHoursToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
            </label>
          </div>

          {quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Time</label>
                <input
                  type="time"
                  name="start"
                  value={quietHours.start}
                  onChange={handleQuietHoursChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End Time</label>
                <input
                  type="time"
                  name="end"
                  value={quietHours.end}
                  onChange={handleQuietHoursChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Override */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Emergency Override</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-800">Allow Critical Alerts</p>
            <p className="text-sm text-slate-600">
              Receive critical notifications even during quiet hours
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationSection; 