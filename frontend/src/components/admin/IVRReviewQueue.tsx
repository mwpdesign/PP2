import React, { useState } from 'react';
import { PhoneIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const IVRReviewQueue: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const mockCalls = [
    { 
      id: 'IVR-2024-001',
      patientId: 'P-12345',
      timestamp: '2024-03-20 10:30 AM',
      duration: '4m 32s',
      status: 'pending',
      type: 'Assessment',
      confidence: 98,
    },
    { 
      id: 'IVR-2024-002',
      patientId: 'P-12346',
      timestamp: '2024-03-20 10:15 AM',
      duration: '3m 45s',
      status: 'approved',
      type: 'Follow-up',
      confidence: 95,
    },
    { 
      id: 'IVR-2024-003',
      patientId: 'P-12347',
      timestamp: '2024-03-20 10:00 AM',
      duration: '5m 12s',
      status: 'flagged',
      type: 'Initial',
      confidence: 82,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'flagged': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircleIcon;
      case 'flagged': return XCircleIcon;
      case 'pending': return ClockIcon;
      default: return PhoneIcon;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-slate-800">IVR Review Queue</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search calls..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          >
            <option value="all">All Calls</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {mockCalls.map((call) => {
          const StatusIcon = getStatusIcon(call.status);
          return (
            <div key={call.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{call.id}</h3>
                  <p className="text-sm text-slate-600">{call.patientId}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(call.status)}`}>
                  <StatusIcon className="h-4 w-4 mr-1.5" />
                  <span className="capitalize">{call.status}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Type</p>
                  <p className="text-sm font-medium text-slate-900">{call.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Duration</p>
                  <p className="text-sm font-medium text-slate-900">{call.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Timestamp</p>
                  <p className="text-sm text-slate-600">{call.timestamp}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Confidence</p>
                  <div className="flex items-center mt-1">
                    <div className="w-12 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-[#375788] h-2 rounded-full" 
                        style={{ width: `${call.confidence}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm font-medium">{call.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="bg-[#375788] text-white px-4 py-2 rounded-lg hover:bg-[#2a4368] transition-colors">
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Call ID</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Patient ID</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Confidence</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockCalls.map((call) => {
                const StatusIcon = getStatusIcon(call.status);
                return (
                  <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">{call.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{call.patientId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{call.timestamp}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{call.duration}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{call.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-[#375788] h-2 rounded-full" 
                            style={{ width: `${call.confidence}%` }}
                          />
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-900">{call.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(call.status)}`}>
                        <StatusIcon className="h-4 w-4 mr-1.5" />
                        <span className="capitalize">{call.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="bg-[#375788] text-white px-4 py-2 rounded-lg hover:bg-[#2a4368] transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
          Showing 3 of 3 calls
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Previous</button>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368] transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
};

export default IVRReviewQueue; 