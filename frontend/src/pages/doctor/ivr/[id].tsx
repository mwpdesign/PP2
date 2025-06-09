import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import IVRResultsDisplay from '../../../components/ivr/IVRResultsDisplay';

interface DoctorIVRDetail {
  id: string;
  ivrNumber: string;
  patientName: string;
  serviceType: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'awaiting_docs';
  priority: 'high' | 'medium' | 'low';
  submittedDate: string;
  lastUpdated: string;
  estimatedCompletion?: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    insurance: string;
    policyNumber: string;
  };
  serviceDetails: {
    description: string;
    diagnosis: string;
    treatmentPlan: string;
    urgency: string;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
  }>;
  communications: Array<{
    id: string;
    message: string;
    author: string;
    timestamp: string;
    type: 'doctor' | 'ivr_specialist';
    attachments?: Array<{
      name: string;
      url: string;
    }>;
  }>;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

const DoctorIVRDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'documents'>('overview');
  const [newMessage, setNewMessage] = useState('');
  const [ivrDetail, setIVRDetail] = useState<DoctorIVRDetail | null>(null);

  // Mock IVR Results data for approved requests
  const mockIVRResults = {
    caseNumber: "CASE-2024-001234",
    verificationDate: "2024-03-15",
    coverageStatus: "Covered" as const,
    annualDeductible: 1500,
    remainingDeductible: 750,
    copay: 25,
    coinsurance: 20,
    priorAuthStatus: "Approved" as const,
    coverageDetails: "Wound care supplies covered at 80% after deductible. Prior authorization approved for 6-week treatment period.",
    notes: "Patient has met 50% of annual deductible. Coverage effective through end of plan year."
  };

  // Check for tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'communication' || tab === 'documents') {
      setActiveTab(tab as 'communication' | 'documents');
    }
  }, []);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchIVRDetail = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockDetail: DoctorIVRDetail = {
        id: id || 'IVR-001',
        ivrNumber: 'IVR-2024-001',
        patientName: 'John Smith',
        serviceType: 'Wound Care Authorization',
        status: 'approved',
        priority: 'high',
        submittedDate: '2024-03-15T10:30:00Z',
        lastUpdated: '2024-03-18T14:20:00Z',
        estimatedCompletion: '2024-03-22T17:00:00Z',
        patient: {
          firstName: 'John',
          lastName: 'Smith',
          dateOfBirth: '1965-08-15',
          phone: '(555) 123-4567',
          email: 'john.smith@email.com',
          insurance: 'Blue Cross Blue Shield',
          policyNumber: 'BCBS123456789'
        },
        serviceDetails: {
          description: 'Advanced wound care treatment for diabetic foot ulcer',
          diagnosis: 'Diabetic foot ulcer with infection (E11.621)',
          treatmentPlan: 'Negative pressure wound therapy with bioengineered skin substitute',
          urgency: 'High - Risk of amputation if not treated promptly'
        },
        documents: [
          {
            id: 'doc1',
            name: 'wound_assessment.pdf',
            type: 'application/pdf',
            size: 2048576,
            uploadedAt: '2024-03-15T10:30:00Z',
            url: '/documents/wound_assessment.pdf'
          },
          {
            id: 'doc2',
            name: 'lab_results.pdf',
            type: 'application/pdf',
            size: 1024768,
            uploadedAt: '2024-03-15T10:35:00Z',
            url: '/documents/lab_results.pdf'
          }
        ],
        communications: [
          {
            id: 'msg1',
            message: 'IVR request submitted for wound care authorization. Patient has diabetic foot ulcer requiring immediate attention.',
            author: 'Dr. John Smith',
            timestamp: '2024-03-15T10:30:00Z',
            type: 'doctor'
          },
          {
            id: 'msg2',
            message: 'Thank you for your submission. We are reviewing the documentation and will respond within 24-48 hours.',
            author: 'Sarah Johnson, IVR Specialist',
            timestamp: '2024-03-16T09:15:00Z',
            type: 'ivr_specialist'
          },
          {
            id: 'msg3',
            message: 'Please provide additional wound measurements and recent HbA1c results to complete the review.',
            author: 'Sarah Johnson, IVR Specialist',
            timestamp: '2024-03-17T14:20:00Z',
            type: 'ivr_specialist'
          }
        ],
        statusHistory: [
          {
            status: 'submitted',
            timestamp: '2024-03-15T10:30:00Z',
            note: 'Initial submission'
          },
          {
            status: 'in_review',
            timestamp: '2024-03-16T09:15:00Z',
            note: 'Review started by IVR specialist'
          }
        ]
      };

      setIVRDetail(mockDetail);
      setLoading(false);
    };

    fetchIVRDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Submitted' },
      in_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon, label: 'In Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Rejected' },
      awaiting_docs: { bg: 'bg-amber-100', text: 'text-amber-800', icon: ExclamationTriangleIcon, label: 'Awaiting Docs' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High Priority' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium Priority' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Priority' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !ivrDetail) return;

    const newCommunication = {
      id: `msg${Date.now()}`,
      message: newMessage,
      author: 'Dr. John Smith',
      timestamp: new Date().toISOString(),
      type: 'doctor' as const
    };

    setIVRDetail({
      ...ivrDetail,
      communications: [...ivrDetail.communications, newCommunication]
    });
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg p-6 h-32" />
          <div className="bg-white rounded-lg p-6 h-96" />
        </div>
      </div>
    );
  }

  if (!ivrDetail) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900">IVR Request Not Found</h2>
          <p className="text-gray-600 mt-2">The requested IVR could not be found.</p>
          <button
            onClick={() => navigate('/doctor/ivr')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to IVR Management
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ivrDetail.status);
  const priorityBadge = getPriorityBadge(ivrDetail.priority);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/doctor/ivr')}
            className="p-2 rounded-lg hover:bg-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ivrDetail.ivrNumber}</h1>
            <p className="text-gray-600">{ivrDetail.serviceType} for {ivrDetail.patientName}</p>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {statusBadge.label}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
            {priorityBadge.label}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
              { id: 'communication', label: 'Communication', icon: ChatBubbleLeftRightIcon },
              { id: 'documents', label: 'Documents', icon: PaperClipIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* IVR Results Display - Show when approved */}
            {ivrDetail.status === 'approved' && (
              <IVRResultsDisplay results={mockIVRResults} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Patient Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.patient.firstName} {ivrDetail.patient.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="text-sm text-gray-900">{new Date(ivrDetail.patient.dateOfBirth).toLocaleDateString()}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Insurance</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.patient.insurance}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Policy Number</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.patient.policyNumber}</dd>
                </div>
              </dl>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.serviceDetails.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.serviceDetails.diagnosis}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Treatment Plan</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.serviceDetails.treatmentPlan}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Urgency</dt>
                  <dd className="text-sm text-gray-900">{ivrDetail.serviceDetails.urgency}</dd>
                </div>
              </dl>
            </div>

            {/* Physician Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Physician Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">Dr. Jane Smith</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">NPI</dt>
                  <dd className="text-sm text-gray-900">1234567890</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Medicaid Provider #</dt>
                  <dd className="text-sm text-gray-900">MED123456</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Medicare PTAN</dt>
                  <dd className="text-sm text-gray-900">AB12345</dd>
                </div>
              </dl>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Status Timeline
              </h3>
              <div className="space-y-4">
                {ivrDetail.statusHistory.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
                      </p>
                      <p className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                      {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Communication Thread */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication History</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ivrDetail.communications.map((comm) => (
                  <div
                    key={comm.id}
                    className={`flex ${comm.type === 'doctor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        comm.type === 'doctor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{comm.message}</p>
                      <p className={`text-xs mt-1 ${comm.type === 'doctor' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {comm.author} • {new Date(comm.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Message */}
            <div className="p-6">
              <div className="flex space-x-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
            <div className="space-y-3">
              {ivrDetail.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorIVRDetailPage;