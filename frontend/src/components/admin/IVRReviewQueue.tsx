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
      case 'approved': return 'text-green-600';
      case 'flagged': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-slate-600';
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

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Call ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Patient ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Confidence</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockCalls.map((call) => {
                const StatusIcon = getStatusIcon(call.status);
                return (
                  <tr key={call.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col sm:hidden">
                        <span className="text-sm font-medium text-slate-900">{call.id}</span>
                        <span className="text-sm text-slate-600">{call.patientId}</span>
                        <span className="text-xs text-slate-500">{call.timestamp}</span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-slate-900">{call.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">{call.patientId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{call.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">{call.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{call.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-[#375788] h-2 rounded-full" 
                            style={{ width: `${call.confidence}%` }}
                          />
                        </div>
                        <span className="ml-2">{call.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <StatusIcon className={`h-5 w-5 mr-1.5 ${getStatusColor(call.status)}`} />
                        <span className={`capitalize ${getStatusColor(call.status)}`}>{call.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button className="text-[#375788] hover:text-[#2a4368] font-medium">Review</button>
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
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Previous</button>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368]">Next</button>
        </div>
      </div>
    </div>
  );
};

export default IVRReviewQueue; 