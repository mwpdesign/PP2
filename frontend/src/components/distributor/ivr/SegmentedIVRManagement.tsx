import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';

interface IVRSubmission {
  id: string;
  patientName: string;
  status: 'approved' | 'pending' | 'in_review' | 'submitted';
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
}

// Mock data
const mockIVRSubmissions: IVRSubmission[] = [
  {
    id: 'IVR-2024-001',
    patientName: 'John D.',
    status: 'approved',
    submittedAt: '2h ago',
    priority: 'high',
    type: 'Skin Graft Authorization'
  },
  {
    id: 'IVR-2024-002',
    patientName: 'Sarah M.',
    status: 'approved',
    submittedAt: '4h ago',
    priority: 'medium',
    type: 'Wound Matrix Request'
  },
  {
    id: 'IVR-2024-003',
    patientName: 'Michael C.',
    status: 'pending',
    submittedAt: '1h ago',
    priority: 'high',
    type: 'Negative Pressure Therapy'
  },
  {
    id: 'IVR-2024-004',
    patientName: 'Emily R.',
    status: 'in_review',
    submittedAt: '3h ago',
    priority: 'medium',
    type: 'Collagen Dressing Auth'
  },
  {
    id: 'IVR-2024-005',
    patientName: 'David W.',
    status: 'submitted',
    submittedAt: '30m ago',
    priority: 'low',
    type: 'Advanced Wound Care'
  },
  {
    id: 'IVR-2024-006',
    patientName: 'Maria G.',
    status: 'approved',
    submittedAt: '6h ago',
    priority: 'medium',
    type: 'Bioengineered Tissue'
  }
];

const SegmentedIVRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approved' | 'processing'>('approved');

  const approvedIVRs = mockIVRSubmissions.filter(ivr => ivr.status === 'approved');
  const processingIVRs = mockIVRSubmissions.filter(ivr => ivr.status !== 'approved');

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      submitted: 'bg-gray-100 text-gray-800'
    };
    
    return `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles]}`;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityStyles[priority as keyof typeof priorityStyles]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">IVR Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('approved')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approved'
                ? 'border-[#375788] text-[#375788]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approved IVRs
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {approvedIVRs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'processing'
                ? 'border-[#375788] text-[#375788]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Processing
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {processingIVRs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Content Area */}
      {activeTab === 'approved' && (
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Approved IVR Submissions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ready for order processing and fulfillment
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedIVRs.map((ivr) => (
                  <tr key={ivr.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ivr.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(ivr.priority)}>
                        {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.submittedAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-[#375788] hover:text-[#247297] font-medium border border-[#375788] hover:border-[#247297] px-3 py-1 rounded-md bg-white">
                        Process Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'processing' && (
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Active Processing Queue</h3>
            <p className="mt-1 text-sm text-gray-500">
              IVR submissions in various stages of review and processing
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processingIVRs.map((ivr) => (
                  <tr key={ivr.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ivr.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(ivr.status)}>
                        {ivr.status.replace('_', ' ').charAt(0).toUpperCase() + ivr.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(ivr.priority)}>
                        {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ivr.submittedAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-[#375788] hover:text-[#247297] font-medium border border-[#375788] hover:border-[#247297] px-3 py-1 rounded-md bg-white mr-2">
                        Review
                      </button>
                      {ivr.status === 'pending' && (
                        <button className="text-green-600 hover:text-green-700 font-medium border border-green-600 hover:border-green-700 px-3 py-1 rounded-md bg-white">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SegmentedIVRManagement; 