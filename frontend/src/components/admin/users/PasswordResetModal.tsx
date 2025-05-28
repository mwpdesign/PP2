import React, { useState } from 'react';
import { Key, Mail, Lock, RefreshCw } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: 'temporary' | 'email' | 'force-change') => void;
  userName: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
}) => {
  const [resetMethod, setResetMethod] = useState<'temporary' | 'email' | 'force-change'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(resetMethod);
      onClose();
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-[28rem] shadow-xl rounded-lg bg-white border-gray-200">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-slate-50 p-3 rounded-full border border-slate-100">
            <Key className="h-8 w-8 text-slate-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Reset Password
        </h3>
        <p className="text-gray-500 text-center mb-6">
          {userName}
        </p>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-900">
              Select Reset Method
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200 border-gray-200">
                <input
                  type="radio"
                  value="email"
                  checked={resetMethod === 'email'}
                  onChange={(e) => setResetMethod('email')}
                  className="focus:ring-slate-500 h-4 w-4 text-slate-600 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <Mail className="h-5 w-5 text-slate-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Send reset email</p>
                    <p className="text-xs text-gray-500">User will receive email with reset instructions</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200 border-gray-200">
                <input
                  type="radio"
                  value="temporary"
                  checked={resetMethod === 'temporary'}
                  onChange={(e) => setResetMethod('temporary')}
                  className="focus:ring-slate-500 h-4 w-4 text-slate-600 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <Lock className="h-5 w-5 text-slate-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Generate temporary password</p>
                    <p className="text-xs text-gray-500">Create one-time password for immediate access</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200 border-gray-200">
                <input
                  type="radio"
                  value="force-change"
                  checked={resetMethod === 'force-change'}
                  onChange={(e) => setResetMethod('force-change')}
                  className="focus:ring-slate-500 h-4 w-4 text-slate-600 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <RefreshCw className="h-5 w-5 text-slate-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Force password change</p>
                    <p className="text-xs text-gray-500">User must change password at next login</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal; 