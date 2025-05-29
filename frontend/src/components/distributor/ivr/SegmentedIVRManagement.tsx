import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';

interface IVRSubmission {
  id: string;
  patientName: string;
  doctorName: string;
  facility: string;
  status: 'approved' | 'pending' | 'in_review' | 'submitted' | 'denied';
  submittedAt: string;
  reviewedAt?: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
  processingTime?: number; // in hours
  linkedOrderId?: string;
}

// Enhanced mock data with doctor/facility info and processing analytics
const mockIVRSubmissions: IVRSubmission[] = [
  {
    id: 'IVR-2024-001',
    patientName: 'John D.',
    doctorName: 'Dr. Sarah Chen',
    facility: 'Metro General Hospital',
    status: 'approved',
    submittedAt: '2024-12-19 08:00',
    reviewedAt: '2024-12-19 10:00',
    priority: 'high',
    type: 'Skin Graft Authorization',
    processingTime: 2,
    linkedOrderId: 'ORD-2024-001'
  },
  {
    id: 'IVR-2024-002',
    patientName: 'Sarah M.',
    doctorName: 'Dr. Michael Rodriguez',
    facility: 'St. Mary\'s Medical Center',
    status: 'approved',
    submittedAt: '2024-12-19 06:00',
    reviewedAt: '2024-12-19 08:30',
    priority: 'medium',
    type: 'Wound Matrix Request',
    processingTime: 2.5,
    linkedOrderId: 'ORD-2024-002'
  },
  {
    id: 'IVR-2024-003',
    patientName: 'Michael C.',
    doctorName: 'Dr. Lisa Park',
    facility: 'Austin Regional Medical',
    status: 'pending',
    submittedAt: '2024-12-19 11:00',
    priority: 'high',
    type: 'Negative Pressure Therapy'
  },
  {
    id: 'IVR-2024-004',
    patientName: 'Emily R.',
    doctorName: 'Dr. James Wilson',
    facility: 'Central Texas Medical',
    status: 'in_review',
    submittedAt: '2024-12-19 09:00',
    priority: 'medium',
    type: 'Collagen Dressing Auth'
  },
  {
    id: 'IVR-2024-005',
    patientName: 'David W.',
    doctorName: 'Dr. Emma Davis',
    facility: 'North Austin Clinic',
    status: 'submitted',
    submittedAt: '2024-12-19 11:30',
    priority: 'low',
    type: 'Advanced Wound Care'
  },
  {
    id: 'IVR-2024-006',
    patientName: 'Maria G.',
    doctorName: 'Dr. Robert Chen',
    facility: 'South Austin Medical',
    status: 'approved',
    submittedAt: '2024-12-19 04:00',
    reviewedAt: '2024-12-19 07:00',
    priority: 'medium',
    type: 'Bioengineered Tissue',
    processingTime: 3,
    linkedOrderId: 'ORD-2024-006'
  },
  {
    id: 'IVR-2024-007',
    patientName: 'Alex K.',
    doctorName: 'Dr. Jennifer Martinez',
    facility: 'Cedar Park Family Health',
    status: 'denied',
    submittedAt: '2024-12-18 15:00',
    reviewedAt: '2024-12-18 17:30',
    priority: 'low',
    type: 'Experimental Treatment',
    processingTime: 2.5
  }
];

const SegmentedIVRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'processing'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [facilityFilter, setFacilityFilter] = useState<string>('All');

  const approvedIVRs = mockIVRSubmissions.filter(ivr => ivr.status === 'approved');
  const processingIVRs = mockIVRSubmissions.filter(ivr => ['pending', 'in_review', 'submitted'].includes(ivr.status));
  const allIVRs = mockIVRSubmissions;

  // Filter based on selected criteria
  const getFilteredIVRs = () => {
    let filtered = activeTab === 'approved' ? approvedIVRs : 
                   activeTab === 'processing' ? processingIVRs : allIVRs;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.status === statusFilter);
    }

    if (facilityFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.facility === facilityFilter);
    }

    return filtered;
  };

  // Calculate analytics
  const analytics = {
    totalSubmissions: allIVRs.length,
    approved: approvedIVRs.length,
    pending: processingIVRs.length,
    avgProcessingTime: calculateAvgProcessingTime(),
    ordersGenerated: approvedIVRs.filter(ivr => ivr.linkedOrderId).length
  };

  function calculateAvgProcessingTime() {
    const processedIVRs = allIVRs.filter(ivr => ivr.processingTime);
    if (processedIVRs.length === 0) return 0;
    const total = processedIVRs.reduce((sum, ivr) => sum + (ivr.processingTime || 0), 0);
    return Math.round((total / processedIVRs.length) * 10) / 10;
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      approved: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      in_review: 'bg-blue-50 text-blue-700 border-blue-200',
      submitted: 'bg-slate-50 text-slate-700 border-slate-200',
      denied: 'bg-red-50 text-red-700 border-red-200'
    };
    
    return `px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status as keyof typeof statusStyles]}`;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-orange-50 text-orange-700 border-orange-200',
      low: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    
    return `px-2 py-1 rounded text-xs font-medium border ${priorityStyles[priority as keyof typeof priorityStyles]}`;
  };

  const uniqueFacilities = [...new Set(allIVRs.map(ivr => ivr.facility))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">IVR Status Tracking</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor IVR submission progress and processing analytics</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Total IVRs: </span>
            <span className="text-xl font-bold text-slate-900">{analytics.totalSubmissions}</span>
          </div>
        </div>

        {/* Analytics Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700 leading-tight">{analytics.approved}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Approved</div>
            <div className="text-xs text-green-500 mt-1">Ready for orders</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700 leading-tight">{analytics.pending}</div>
            <div className="text-sm font-medium text-yellow-600 mt-1">Processing</div>
            <div className="text-xs text-yellow-500 mt-1">Under review</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700 leading-tight">{analytics.avgProcessingTime}h</div>
            <div className="text-sm font-medium text-purple-600 mt-1">Avg Processing</div>
            <div className="text-xs text-purple-500 mt-1">Time to approval</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{analytics.ordersGenerated}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Orders Generated</div>
            <div className="text-xs text-blue-500 mt-1">From approved IVRs</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All IVRs
              <span className="ml-2 bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {allIVRs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {approvedIVRs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'processing'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Processing
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {processingIVRs.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              >
                <option value="All">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="submitted">Submitted</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Facility Filter</label>
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              >
                <option value="All">All Facilities</option>
                {uniqueFacilities.map(facility => (
                  <option key={facility} value={facility}>{facility}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* IVR Submissions Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IVR ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Processing Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Linked Order</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredIVRs().map((ivr) => (
                <tr key={ivr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{ivr.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.patientName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.doctorName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.facility}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getStatusBadge(ivr.status)}>
                      {ivr.status.replace('_', ' ').charAt(0).toUpperCase() + ivr.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getPriorityBadge(ivr.priority)}>
                      {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {ivr.processingTime ? `${ivr.processingTime}h` : 'In progress'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {ivr.linkedOrderId ? (
                      <span className="text-[#2E86AB] font-medium">{ivr.linkedOrderId}</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredIVRs().length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No IVR Submissions Found</h3>
            <p className="text-slate-600 text-base">No submissions match your current filter criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SegmentedIVRManagement; 