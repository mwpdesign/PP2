import React, { useState } from 'react';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/shared/ui/Card';
import { useNavigate } from 'react-router-dom';

// IVR Status Types
const IVR_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Denied', label: 'Denied' }
];

// Mock IVR Data
interface IVR {
  id: string;
  patientName: string;
  doctorName: string;
  distributor: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Denied';
  dateSubmitted: string;
}

const mockIVRs: IVR[] = [
  {
    id: 'IVR-2024-001',
    patientName: 'John Smith',
    doctorName: 'Dr. Emily Carter',
    distributor: 'MedSupply East',
    status: 'Pending',
    dateSubmitted: '2024-12-18'
  },
  {
    id: 'IVR-2024-002',
    patientName: 'Maria Garcia',
    doctorName: 'Dr. Michael Nguyen',
    distributor: 'HealthCare Partners',
    status: 'Under Review',
    dateSubmitted: '2024-12-19'
  },
  {
    id: 'IVR-2024-003',
    patientName: 'James Lee',
    doctorName: 'Dr. Sophia Patel',
    distributor: 'Texas Medical Supply',
    status: 'Approved',
    dateSubmitted: '2024-12-20'
  },
  {
    id: 'IVR-2024-004',
    patientName: 'Olivia Brown',
    doctorName: 'Dr. Olivia Kim',
    distributor: 'Regional Health Partners',
    status: 'Denied',
    dateSubmitted: '2024-12-19'
  },
  {
    id: 'IVR-2024-005',
    patientName: 'William Johnson',
    doctorName: 'Dr. Daniel Lee',
    distributor: 'Austin Medical Group',
    status: 'Pending',
    dateSubmitted: '2024-12-17'
  },
  {
    id: 'IVR-2024-006',
    patientName: 'Sophia Martinez',
    doctorName: 'Dr. Grace Chen',
    distributor: 'MedSupply South',
    status: 'Approved',
    dateSubmitted: '2024-12-16'
  },
  {
    id: 'IVR-2024-007',
    patientName: 'Benjamin Rivera',
    doctorName: 'Dr. Benjamin Rivera',
    distributor: 'Northwest Medical',
    status: 'Under Review',
    dateSubmitted: '2024-12-18'
  },
  {
    id: 'IVR-2024-008',
    patientName: 'Isabella Martinez',
    doctorName: 'Dr. Isabella Martinez',
    distributor: 'Dallas Health Supply',
    status: 'Denied',
    dateSubmitted: '2024-12-20'
  },
  {
    id: 'IVR-2024-009',
    patientName: 'David Brown',
    doctorName: 'Dr. David Brown',
    distributor: 'Pacific Northwest Supply',
    status: 'Pending',
    dateSubmitted: '2024-12-20'
  },
  {
    id: 'IVR-2024-010',
    patientName: 'Emma Davis',
    doctorName: 'Dr. Emma Davis',
    distributor: 'Southeast Medical',
    status: 'Approved',
    dateSubmitted: '2024-12-15'
  }
];

const getStatusBadge = (status: IVR['status']) => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-100 text-amber-800';
    case 'Under Review':
      return 'bg-blue-100 text-blue-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Denied':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const IVRManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [distributorFilter, setDistributorFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('');
  const navigate = useNavigate();

  // Unique distributors for dropdown
  const uniqueDistributors = Array.from(new Set(mockIVRs.map(ivr => ivr.distributor)));

  // Filter IVRs based on selected criteria
  const getFilteredIVRs = () => {
    let filtered = mockIVRs;
    if (statusFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.status === statusFilter);
    }
    if (distributorFilter !== 'All') {
      filtered = filtered.filter(ivr => ivr.distributor === distributorFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(ivr =>
        ivr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Date range filter (simple string match for mock)
    if (dateRange) {
      filtered = filtered.filter(ivr => ivr.dateSubmitted.includes(dateRange));
    }
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">IVR Management</h1>
            <p className="text-gray-600 mt-1">Monitor all IVRs across your distributor network</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                {IVR_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Date Range Picker (simple input for mock) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date Submitted</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            {/* Distributor Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distributor</label>
              <select
                value={distributorFilter}
                onChange={e => setDistributorFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All</option>
                {uniqueDistributors.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {/* Search Box */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search IVR ID, patient, doctor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-slate-500 focus:border-slate-500 w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* IVR Table */}
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVR ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distributor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredIVRs().map(ivr => (
                <tr key={ivr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ivr.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ivr.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ivr.doctorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ivr.distributor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ivr.status)}`}>{ivr.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ivr.dateSubmitted}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-slate-600 hover:text-slate-900 flex items-center"
                      title="View Details"
                      onClick={() => navigate(`/distributor/ivr-management/${ivr.id}`)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default IVRManagement;