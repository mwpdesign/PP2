import React from 'react';

interface ComplianceMetricsProps {
  dateRange: 'week' | 'month' | 'quarter';
  doctorId: string;
}

const ComplianceMetrics: React.FC<ComplianceMetricsProps> = ({ dateRange, doctorId }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Overview</h3>
          <p className="text-sm text-gray-500">HIPAA compliance and security metrics</p>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="relative pt-1 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
              Excellent
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-green-600">
              98%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
          <div
            style={{ width: "98%" }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
          ></div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Data Encryption</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">100%</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Access Control</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">96%</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Compliance Checks */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Recent Compliance Checks</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">PHI Access Audit</p>
                <p className="text-xs text-gray-500">All access properly logged</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2h ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Data Backup Check</p>
                <p className="text-xs text-gray-500">Successful backup verified</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">6h ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Security Scan</p>
                <p className="text-xs text-gray-500">2 minor warnings resolved</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">12h ago</span>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Action Items</h4>
          <span className="text-xs font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
            View All
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-gray-600">Review access logs for unusual patterns</span>
          </div>
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-gray-600">Update emergency contact information</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMetrics; 