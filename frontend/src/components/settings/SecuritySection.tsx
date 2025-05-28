import React, { useState } from 'react';
import { Shield, Smartphone, Key, LogOut, AlertTriangle } from 'lucide-react';

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const mockSessions: Session[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome',
    location: 'San Francisco, CA',
    lastActive: '2 minutes ago',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'iPhone 13',
    browser: 'Safari Mobile',
    location: 'San Francisco, CA',
    lastActive: '1 hour ago',
    isCurrent: false,
  },
];

const SecuritySection: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState<SecurityFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [sessions] = useState<Session[]>(mockSessions);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password change
    console.log('Password change submitted');
  };

  const handleMfaToggle = () => {
    setMfaEnabled(!mfaEnabled);
    // TODO: Implement MFA setup flow
  };

  const handleSessionTerminate = (sessionId: string) => {
    // TODO: Implement session termination
    console.log('Terminate session:', sessionId);
  };

  return (
    <div className="space-y-8">
      {/* Password Management */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Password Management</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Multi-Factor Authentication */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Multi-Factor Authentication</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600">Add an extra layer of security to your account</p>
            <p className="text-sm text-slate-500 mt-1">
              {mfaEnabled
                ? 'MFA is currently enabled using Authenticator App'
                : 'MFA is currently disabled'}
            </p>
          </div>
          <button
            onClick={handleMfaToggle}
            className={`px-4 py-2 rounded-md ${
              mfaEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Smartphone className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Active Sessions</h3>
        </div>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="text-slate-600">
                  {session.isCurrent ? (
                    <Shield className="w-5 h-5 text-green-500" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {session.device}
                    {session.isCurrent && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Current Session
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {session.browser} • {session.location} • Last active {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => handleSessionTerminate(session.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Security Alerts</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="loginAlerts"
                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label htmlFor="loginAlerts" className="text-slate-700">
                New login alerts
              </label>
            </div>
            <p className="text-sm text-slate-500">Get notified of new sign-ins to your account</p>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="securityUpdates"
                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label htmlFor="securityUpdates" className="text-slate-700">
                Security updates
              </label>
            </div>
            <p className="text-sm text-slate-500">Get important security update notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection; 