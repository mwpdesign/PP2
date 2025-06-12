import React, { useState } from 'react';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
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
  insuranceCompany: string;
  distributor: string;
  region: string;
}

// Enhanced mock data with comprehensive network information for Master Distributor monitoring
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
    linkedOrderId: 'ORD-2024-001',
    insuranceCompany: 'Blue Cross Blue Shield',
    distributor: 'MedSupply East',
    region: 'East Coast'
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
    linkedOrderId: 'ORD-2024-002',
    insuranceCompany: 'Aetna',
    distributor: 'HealthCare Partners',
    region: 'Southwest'
  },
  {
    id: 'IVR-2024-003',
    patientName: 'Michael C.',
    doctorName: 'Dr. Lisa Park',
    facility: 'Austin Regional Medical',
    status: 'pending',
    submittedAt: '2024-12-19 11:00',
    priority: 'high',
    type: 'Negative Pressure Therapy',
    insuranceCompany: 'UnitedHealthcare',
    distributor: 'Texas Medical Supply',
    region: 'Central'
  },
  {
    id: 'IVR-2024-004',
    patientName: 'Emily R.',
    doctorName: 'Dr. James Wilson',
    facility: 'Central Texas Medical',
    status: 'in_review',
    submittedAt: '2024-12-19 09:00',
    priority: 'medium',
    type: 'Collagen Dressing Auth',
    insuranceCompany: 'Cigna',
    distributor: 'Regional Health Partners',
    region: 'Central'
  },
  {
    id: 'IVR-2024-005',
    patientName: 'David W.',
    doctorName: 'Dr. Emma Davis',
    facility: 'North Austin Clinic',
    status: 'submitted',
    submittedAt: '2024-12-19 11:30',
    priority: 'low',
    type: 'Advanced Wound Care',
    insuranceCompany: 'Humana',
    distributor: 'Austin Medical Group',
    region: 'Central'
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
    linkedOrderId: 'ORD-2024-006',
    insuranceCompany: 'Medicare',
    distributor: 'MedSupply South',
    region: 'Southwest'
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
    processingTime: 2.5,
    insuranceCompany: 'Medicaid',
    distributor: 'Northwest Medical',
    region: 'Northwest'
  },
  {
    id: 'IVR-2024-008',
    patientName: 'Jennifer L.',
    doctorName: 'Dr. Mark Thompson',
    facility: 'Dallas Medical Center',
    status: 'approved',
    submittedAt: '2024-12-18 14:00',
    reviewedAt: '2024-12-18 16:30',
    priority: 'high',
    type: 'Skin Substitute',
    processingTime: 2.5,
    linkedOrderId: 'ORD-2024-008',
    insuranceCompany: 'Blue Cross Blue Shield',
    distributor: 'Dallas Health Supply',
    region: 'Central'
  },
  {
    id: 'IVR-2024-009',
    patientName: 'Robert K.',
    doctorName: 'Dr. Amanda Foster',
    facility: 'Houston General',
    status: 'in_review',
    submittedAt: '2024-12-18 16:00',
    priority: 'medium',
    type: 'Wound Dressing Auth',
    insuranceCompany: 'Aetna',
    distributor: 'Gulf Coast Medical',
    region: 'Southeast'
  },
  {
    id: 'IVR-2024-010',
    patientName: 'Lisa M.',
    doctorName: 'Dr. Kevin Lee',
    facility: 'Phoenix Medical Plaza',
    status: 'pending',
    submittedAt: '2024-12-18 13:00',
    priority: 'high',
    type: 'Advanced Therapy',
    insuranceCompany: 'UnitedHealthcare',
    distributor: 'Desert Medical Supply',
    region: 'Southwest'
  }
];

const SegmentedIVRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'processing'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [distributorFilter, setDistributorFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');

  const approvedIVRs = mockIVRSubmissions.filter(ivr => ivr.status === 'approved');
  const processingIVRs = mockIVRSubmissions.filter(ivr => ['pending', 'in_review', 'submitted'].includes(ivr.status));
  const allIVRs = mockIVRSubmissions;

    // Filter based on selected criteria
  const getFilteredIVRs = () => {
    let filtered = activeTab === 'approved' ? approvedIVRs :
                   activeTab === 'processing' ? processingIVRs : allIVRs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ivr =>
        ivr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.facility.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.status === statusFilter);
    }

    // Distributor filter
    if (distributorFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.distributor === distributorFilter);
    }

    // Region filter
    if (regionFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.region === regionFilter);
    }

    // Date range filter
    if (dateRange !== 'All') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'Today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'Week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateRange !== 'All') {
        filtered = filtered.filter(ivr => new Date(ivr.submittedAt) >= filterDate);
      }
    }

    return filtered;
  };

  // Calculate analytics
  const analytics = {
    totalSubmissions: 234, // Updated to match dashboard
    approved: 28, // Approved Today
    pending: 45, // Pending Review
    avgProcessingTime: 2.3, // Average Processing Time in days
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

  const uniqueDistributors = [...new Set(allIVRs.map(ivr => ivr.distributor))];
  const uniqueRegions = [...new Set(allIVRs.map(ivr => ivr.region))];

  return (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">IVR Management - Network Overview</h1>
              <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-700">View Only Access</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor insurance verification requests across your network</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Total IVRs: </span>
            <span className="text-xl font-bold text-slate-900">{analytics.totalSubmissions}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{analytics.totalSubmissions}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total IVRs</div>
            <div className="text-xs text-slate-500 mt-1">Network-wide</div>
          </div>
          <div className="bg-white border border-amber-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-amber-700 leading-tight">{analytics.pending}</div>
            <div className="text-sm font-medium text-amber-600 mt-1">Pending Review</div>
            <div className="text-xs text-amber-500 mt-1">Awaiting approval</div>
          </div>
          <div className="bg-white border border-green-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-700 leading-tight">{analytics.approved}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Approved Today</div>
            <div className="text-xs text-green-500 mt-1">Ready for orders</div>
          </div>
          <div className="bg-white border border-blue-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{analytics.avgProcessingTime}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Avg Processing Time</div>
            <div className="text-xs text-blue-500 mt-1">Days to approval</div>
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

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by IVR ID, patient, or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="submitted">Submitted</option>
                <option value="denied">Denied</option>
              </select>
            </div>

            {/* Distributor Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Distributor</label>
              <select
                value={distributorFilter}
                onChange={(e) => setDistributorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Distributors</option>
                {uniqueDistributors.map(distributor => (
                  <option key={distributor} value={distributor}>{distributor}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
              <div className="relative">
                <CalendarIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Week">Last 7 Days</option>
                  <option value="Month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Region Filter Row */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Region</label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Read-only monitoring access - no editing capabilities</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* READ-ONLY IVR Submissions Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden opacity-95">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IVR ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Insurance Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredIVRs().map((ivr) => (
                <tr key={ivr.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{ivr.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.patientName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.doctorName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.facility}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getStatusBadge(ivr.status)}>
                      {ivr.status === 'pending' ? 'Pending' :
                       ivr.status === 'approved' ? 'Approved' :
                       ivr.status === 'denied' ? 'Denied' :
                       ivr.status === 'in_review' ? 'In Review' :
                       'Submitted'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{ivr.insuranceCompany}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {new Date(ivr.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button className="inline-flex items-center px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 opacity-70 cursor-default">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
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