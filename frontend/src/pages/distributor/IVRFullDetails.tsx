import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { mockIVRRequests, SharedIVRRequest } from '../../data/mockIVRData';

const IVRFullDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ivr, setIvr] = useState<SharedIVRRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIVRDetails = async () => {
      if (!id) {
        setError('IVR ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find IVR in mock data
        const foundIVR = mockIVRRequests.find(request => request.id === id);

        if (!foundIVR) {
          setError('IVR request not found');
        } else {
          setIvr(foundIVR);
        }
      } catch (error) {
        console.error('Error loading IVR details:', error);
        setError('Failed to load IVR details');
      } finally {
        setIsLoading(false);
      }
    };

    loadIVRDetails();
  }, [id]);

  const handleBack = () => {
    navigate('/distributor-regional/ivr-management');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate and download a PDF
    console.log('Exporting PDF for IVR:', ivr?.ivrNumber);
    // You could use libraries like jsPDF or html2pdf here
  };

  // Format status text
  const formatStatusText = (status: string) => {
    const statusTextMap = {
      submitted: 'Pending Review',
      in_review: 'In Review',
      pending_approval: 'Pending Approval',
      documents_requested: 'Documents Requested',
      approved: 'Approved',
      rejected: 'Rejected',
      escalated: 'Escalated',
      cancelled: 'Cancelled'
    };
    return statusTextMap[status as keyof typeof statusTextMap] || status;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-orange-100 text-orange-800',
      documents_requested: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-pink-100 text-pink-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800';
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return priorityMap[priority as keyof typeof priorityMap] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const iconMap = {
      submitted: ClockIcon,
      in_review: ClockIcon,
      pending_approval: ExclamationTriangleIcon,
      documents_requested: DocumentTextIcon,
      approved: CheckCircleIcon,
      rejected: XCircleIcon,
      escalated: ExclamationTriangleIcon,
      cancelled: XCircleIcon
    };
    return iconMap[status as keyof typeof iconMap] || ClockIcon;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ivr) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error || 'IVR not found'}</div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to IVR Management
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(ivr.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - No Print */}
      <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to IVR Management
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{ivr.ivrNumber}</h1>
                <p className="text-sm text-gray-600">IVR Request Details</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PrinterIcon className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">IVR Request Details</h1>
            <p className="text-lg text-gray-600 mt-2">{ivr.ivrNumber}</p>
            <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Request Status</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <StatusIcon className="w-5 h-5 text-gray-500" />
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ivr.status)}`}>
                  {formatStatusText(ivr.status)}
                </span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(ivr.priority)}`}>
                {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)} Priority
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Submitted</dt>
              <dd className="text-sm text-gray-900">{formatDate(ivr.submittedDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900">{formatDate(ivr.lastUpdated)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Days Pending</dt>
              <dd className="text-sm text-gray-900">{ivr.daysPending} days</dd>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
              Patient Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-sm text-gray-900">{ivr.patientName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
                <dd className="text-sm text-gray-900">{ivr.patientId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="text-sm text-gray-900">March 15, 1965 (Age 59)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="text-sm text-gray-900">Female</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="text-sm text-gray-900">
                  123 Main Street<br />
                  Anytown, CA 90210
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">(555) 123-4567</dd>
              </div>
            </dl>
          </div>

          {/* Doctor Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-500" />
              Requesting Provider
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Doctor Name</dt>
                <dd className="text-sm text-gray-900">{ivr.doctorName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Doctor ID</dt>
                <dd className="text-sm text-gray-900">{ivr.doctorId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Specialty</dt>
                <dd className="text-sm text-gray-900">Wound Care Specialist</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">NPI Number</dt>
                <dd className="text-sm text-gray-900">1234567890</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Practice</dt>
                <dd className="text-sm text-gray-900">Advanced Wound Care Center</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">(555) 987-6543</dd>
              </div>
            </dl>
          </div>

          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-gray-500" />
              Insurance Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Insurance Provider</dt>
                <dd className="text-sm text-gray-900">{ivr.insurance}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Policy Number</dt>
                <dd className="text-sm text-gray-900">ABC123456789</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Group Number</dt>
                <dd className="text-sm text-gray-900">GRP001234</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member ID</dt>
                <dd className="text-sm text-gray-900">MEM987654321</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan Type</dt>
                <dd className="text-sm text-gray-900">PPO</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                <dd className="text-sm text-gray-900">January 1, 2024</dd>
              </div>
            </dl>
          </div>

          {/* Service Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
              Service Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                <dd className="text-sm text-gray-900">{ivr.serviceType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Procedure Code</dt>
                <dd className="text-sm text-gray-900">15271</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Diagnosis Code</dt>
                <dd className="text-sm text-gray-900">L97.411 (Diabetic ulcer)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Treatment Area</dt>
                <dd className="text-sm text-gray-900">Right foot, plantar surface</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Wound Size</dt>
                <dd className="text-sm text-gray-900">4.5 cm x 3.2 cm</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                <dd className="text-sm text-gray-900">$8,500</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
          <div className="prose max-w-none">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Chief Complaint:</strong> Non-healing diabetic ulcer on right foot, present for 8 weeks.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              <strong>History of Present Illness:</strong> 59-year-old female with Type 2 diabetes mellitus presents with a chronic, non-healing ulcer on the plantar surface of her right foot. The wound has been present for approximately 8 weeks and has not responded to conventional wound care including debridement, offloading, and topical treatments.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Past Medical History:</strong> Type 2 diabetes mellitus (15 years), peripheral neuropathy, hypertension, hyperlipidemia.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Current Medications:</strong> Metformin 1000mg BID, Lisinopril 10mg daily, Atorvastatin 20mg daily.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Allergies:</strong> Penicillin (rash), Sulfa drugs (GI upset).
            </p>
          </div>
        </div>

        {/* Network Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization</dt>
              <dd className="text-sm text-gray-900">{ivr.organizationId}</dd>
            </div>
            {ivr.territoryId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Territory</dt>
                <dd className="text-sm text-gray-900">{ivr.territoryId}</dd>
              </div>
            )}
            {ivr.distributorId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Distributor</dt>
                <dd className="text-sm text-gray-900">{ivr.distributorId}</dd>
              </div>
            )}
            {ivr.salesRepId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sales Rep</dt>
                <dd className="text-sm text-gray-900">{ivr.salesRepId}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Print Only */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-500 text-center">
            This document was generated from the Healthcare IVR Platform on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IVRFullDetails;