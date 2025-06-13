import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SharedMedicalView, TableColumn } from '../../shared/SharedMedicalView';
import { HierarchyFilteringService, IVRDataEntity, FilteringContext } from '../../../services/hierarchyFilteringService';
import {
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Mock IVR data for Regional Distributor (filtered to their network)
const mockRegionalIVRData: IVRDataEntity[] = [
  {
    id: 'IVR-2024-001',
    organizationId: 'org-healthcare-1',
    createdBy: 'doctor-001',
    territoryId: 'territory-midwest',
    networkId: 'network-regional-health',
    doctorId: 'doctor-001',
    distributorId: 'distributor-regional-001',
    salesRepId: 'sales-001',
    status: 'approved',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T10:30:00Z',
    patientId: 'patient-001',
    requestingDoctorId: 'doctor-001',
    assignedSalesRepId: 'sales-001',
    distributorNetworkId: 'network-regional-health',
    priority: 'high' as const,
    insuranceProvider: 'Blue Cross Blue Shield',
    // Additional display fields
    patientName: 'John D.',
    doctorName: 'Dr. Sarah Chen',
    facility: 'Metro General Hospital',
    type: 'Skin Graft Authorization',
    submittedDate: '2025-01-10',
    reviewedDate: '2025-01-10',
    processingTime: '2.5 hours',
    orderGenerated: true
  },
  {
    id: 'IVR-2024-002',
    organizationId: 'org-healthcare-1',
    createdBy: 'doctor-002',
    territoryId: 'territory-midwest',
    networkId: 'network-regional-health',
    doctorId: 'doctor-002',
    distributorId: 'distributor-regional-001',
    salesRepId: 'sales-002',
    status: 'in_review',
    createdAt: '2025-01-10T09:15:00Z',
    updatedAt: '2025-01-10T09:15:00Z',
    patientId: 'patient-002',
    requestingDoctorId: 'doctor-002',
    assignedSalesRepId: 'sales-002',
    distributorNetworkId: 'network-regional-health',
    priority: 'medium' as const,
    insuranceProvider: 'Aetna',
    // Additional display fields
    patientName: 'Sarah M.',
    doctorName: 'Dr. Michael Rodriguez',
    facility: 'St. Mary\'s Medical Center',
    type: 'Wound Matrix Request',
    submittedDate: '2025-01-10',
    reviewedDate: null,
    processingTime: 'In Progress',
    orderGenerated: false
  },
  {
    id: 'IVR-2024-003',
    organizationId: 'org-healthcare-1',
    createdBy: 'doctor-003',
    territoryId: 'territory-midwest',
    networkId: 'network-regional-health',
    doctorId: 'doctor-003',
    distributorId: 'distributor-regional-001',
    salesRepId: 'sales-001',
    status: 'documents_requested',
    createdAt: '2025-01-09T14:30:00Z',
    updatedAt: '2025-01-10T11:00:00Z',
    patientId: 'patient-003',
    requestingDoctorId: 'doctor-003',
    assignedSalesRepId: 'sales-001',
    distributorNetworkId: 'network-regional-health',
    priority: 'high' as const,
    insuranceProvider: 'UnitedHealthcare',
    // Additional display fields
    patientName: 'Michael C.',
    doctorName: 'Dr. Lisa Park',
    facility: 'Austin Regional Medical',
    type: 'Negative Pressure Therapy',
    submittedDate: '2025-01-09',
    reviewedDate: null,
    processingTime: 'Pending Docs',
    orderGenerated: false
  },
  {
    id: 'IVR-2024-004',
    organizationId: 'org-healthcare-1',
    createdBy: 'doctor-004',
    territoryId: 'territory-midwest',
    networkId: 'network-regional-health',
    doctorId: 'doctor-004',
    distributorId: 'distributor-regional-001',
    salesRepId: 'sales-003',
    status: 'approved',
    createdAt: '2025-01-09T11:00:00Z',
    updatedAt: '2025-01-09T16:45:00Z',
    patientId: 'patient-004',
    requestingDoctorId: 'doctor-004',
    assignedSalesRepId: 'sales-003',
    distributorNetworkId: 'network-regional-health',
    priority: 'medium' as const,
    insuranceProvider: 'Cigna',
    // Additional display fields
    patientName: 'Emily R.',
    doctorName: 'Dr. James Wilson',
    facility: 'Central Texas Medical',
    type: 'Collagen Dressing Auth',
    submittedDate: '2025-01-09',
    reviewedDate: '2025-01-09',
    processingTime: '5.75 hours',
    orderGenerated: true
  },
  {
    id: 'IVR-2024-005',
    organizationId: 'org-healthcare-1',
    createdBy: 'doctor-005',
    territoryId: 'territory-midwest',
    networkId: 'network-regional-health',
    doctorId: 'doctor-005',
    distributorId: 'distributor-regional-001',
    salesRepId: 'sales-002',
    status: 'submitted',
    createdAt: '2025-01-10T13:20:00Z',
    updatedAt: '2025-01-10T13:20:00Z',
    patientId: 'patient-005',
    requestingDoctorId: 'doctor-005',
    assignedSalesRepId: 'sales-002',
    distributorNetworkId: 'network-regional-health',
    priority: 'low' as const,
    insuranceProvider: 'Humana',
    // Additional display fields
    patientName: 'David K.',
    doctorName: 'Dr. Amanda Foster',
    facility: 'Houston General',
    type: 'Wound Dressing Auth',
    submittedDate: '2025-01-10',
    reviewedDate: null,
    processingTime: 'Just Submitted',
    orderGenerated: false
  }
];

const RegionalIVRManagement: React.FC = () => {
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<IVRDataEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteringSummary, setFilteringSummary] = useState<any>(null);

  const hierarchyService = HierarchyFilteringService.getInstance();

  useEffect(() => {
    const loadFilteredData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Get user's hierarchy information
        const hierarchy = await hierarchyService.getUserHierarchy(user.id);

        // Create filtering context
        const context: FilteringContext = {
          user,
          hierarchy,
          requestedDataType: 'ivr'
        };

        // Filter IVR data based on hierarchy
        const result = await hierarchyService.filterIVRData(mockRegionalIVRData, context);

        setFilteredData(result.data);
        setFilteringSummary({
          totalCount: result.totalCount,
          accessibleCount: result.accessibleCount,
          scope: result.scope,
          appliedFilters: result.appliedFilters,
          restrictions: result.restrictions
        });

      } catch (error) {
        console.error('Error filtering IVR data:', error);
        // Fallback to showing all data if filtering fails
        setFilteredData(mockRegionalIVRData);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilteredData();
  }, [user, hierarchyService]);

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'Submitted' },
      in_review: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'In Review' },
      documents_requested: { color: 'bg-orange-100 text-orange-800', icon: DocumentTextIcon, label: 'Docs Requested' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Priority badge renderer
  const renderPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgent' },
      high: { color: 'bg-red-50 text-red-700 border-red-200', label: 'High' },
      medium: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Medium' },
      low: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Low' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Order status renderer
  const renderOrderStatus = (orderGenerated: boolean) => {
    return orderGenerated ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Generated
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending
      </span>
    );
  };

  // View details action
  const renderViewAction = (value: any, row: any) => {
    return (
      <button
        onClick={() => window.open(`/distributor-regional/ivr-management/${row.id}`, '_blank')}
        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        <EyeIcon className="h-3 w-3 mr-1" />
        View
      </button>
    );
  };

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'id',
      label: 'IVR ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-slate-900">{value}</span>
      )
    },
    {
      key: 'patientName',
      label: 'Patient',
      sortable: true
    },
    {
      key: 'doctorName',
      label: 'Doctor',
      sortable: true
    },
    {
      key: 'facility',
      label: 'Facility',
      sortable: true
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => renderPriorityBadge(value)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => renderStatusBadge(value)
    },
    {
      key: 'insuranceProvider',
      label: 'Insurance',
      sortable: true
    },
    {
      key: 'submittedDate',
      label: 'Submitted',
      sortable: true
    },
    {
      key: 'processingTime',
      label: 'Processing Time',
      sortable: false
    },
    {
      key: 'orderGenerated',
      label: 'Order Status',
      sortable: true,
      render: (value) => renderOrderStatus(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: renderViewAction
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hierarchy Information Banner */}
      {filteringSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Regional Network Access
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Showing {filteringSummary.accessibleCount} of {filteringSummary.totalCount} IVRs from your regional network.
                  Access scope: <span className="font-medium">{filteringSummary.scope.replace('_', ' ')}</span>
                </p>
                {filteringSummary.appliedFilters.length > 0 && (
                  <p className="mt-1">
                    Applied filters: {filteringSummary.appliedFilters.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SharedMedicalView Component */}
      <SharedMedicalView
        pageType="ivr"
        userRole="regional_distributor"
        title="Regional IVR Management"
        subtitle="Monitor and track IVR requests from doctors in your regional network"
        canUploadDocs={true}
        canParticipateInChat={true}
        data={filteredData}
        columns={columns}
      />

      {/* Regional Network Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Network Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">
              {filteredData.length}
            </div>
            <div className="text-sm text-slate-600">Total IVRs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {filteredData.filter(ivr => ivr.status === 'approved').length}
            </div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">
              {filteredData.filter(ivr => ['submitted', 'in_review', 'documents_requested'].includes(ivr.status)).length}
            </div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {filteredData.filter(ivr => (ivr as any).orderGenerated).length}
            </div>
            <div className="text-sm text-blue-600">Orders Generated</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalIVRManagement;