import React, { useState, useEffect, useCallback } from 'react';
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
  PlusIcon,
  ArrowPathIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import IVRResultsDisplay from '../../../components/ivr/IVRResultsDisplay';
import { formatMessageTimestamp, formatDateOnly } from '../../../utils/formatters';
import { useIVRWebSocket, IVRStatusUpdate } from '../../../hooks/useIVRWebSocket';
import { mockIVRRequests } from '../../../data/mockIVRData';
import UniversalFileUpload from '../../../components/shared/UniversalFileUpload';
import { toast } from 'react-hot-toast';

interface DoctorIVRDetail {
  id: string;
  ivrNumber: string;
  patientName: string;
  patientId: string;
  dateOfBirth: string;
  insurance: string;
  policyNumber: string;
  groupNumber: string;
  serviceType: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'documents_requested';
  priority: 'high' | 'medium' | 'low';
  submittedDate: string;
  lastUpdated: string;
  estimatedCompletion?: string;
  provider: {
    name: string;
    npi: string;
    facility: string;
  };
  products: Array<{
    name: string;
    qCode: string;
    sizes: Array<{
      size: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    totalQuantity: number;
    totalCost: number;
  }>;
  totalCost: number;
  notes: string;
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
  doctor_comment?: string;
  ivr_response?: string;
  comment_updated_at?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

interface DoctorIVRDetailPageProps {
  readOnly?: boolean;
  userRole?: string;
  id?: string;
}

const DoctorIVRDetailPage: React.FC<DoctorIVRDetailPageProps> = ({ readOnly = false, userRole = 'doctor', id: propId }) => {
  const params = useParams<{ id: string }>();
  const id = propId || params.id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'documents'>('overview');
  const [newComment, setNewComment] = useState('');
  const [ivrDetail, setIVRDetail] = useState<DoctorIVRDetail | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [complexMessages, setComplexMessages] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Mock IVR Results data for approved requests
  const mockIVRResults = {
    caseNumber: "CASE-2024-001234",
    verificationDate: "2024-03-15",
    coverageStatus: "Covered" as const,
    coveragePercentage: 80,
    deductibleAmount: 500,
    copayAmount: 50,
    outOfPocketMax: 550,
    priorAuthStatus: "Approved" as const,
    coverageDetails: "Wound care supplies covered at 80% after deductible. Prior authorization approved for 6-week treatment period.",
    coverageNotes: "Patient has met 50% of annual deductible. Coverage effective through end of plan year."
  };

  // Check for tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'communication' || tab === 'documents') {
      setActiveTab(tab as 'communication' | 'documents');
    }
  }, []);

  // Load complex messages (including system messages like document requests)
  const loadComplexMessages = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const messages = await response.json();
        console.log('🔍 DOCTOR VIEW - Complex messages:', messages);

        const messagesContainer = document.getElementById('complex-messages');
        if (messagesContainer) {
          messagesContainer.innerHTML = '';

          if (messages.length === 0) {
            messagesContainer.innerHTML = '<p class="text-gray-500 italic text-sm">No system messages yet</p>';
          } else {
            messages.forEach((msg: any) => {
              const messageDiv = document.createElement('div');
              messageDiv.className = `p-3 rounded-lg ${
                msg.message_type === 'system'
                  ? 'bg-yellow-50 border-l-4 border-yellow-400'
                  : msg.author_type === 'doctor'
                    ? 'bg-blue-50 border-l-4 border-blue-400'
                    : 'bg-green-50 border-l-4 border-green-400'
              }`;

              // Format the timestamp using the formatMessageTimestamp utility
              const formattedTimestamp = formatMessageTimestamp(msg.timestamp);

              // Format the author name properly
              let authorName = 'Unknown User';
              if (msg.author && msg.author.trim() && msg.author !== 'Unknown User') {
                authorName = msg.author;
              } else if (msg.author_type === 'doctor') {
                authorName = 'Dr. John Smith';
              } else if (msg.author_type === 'ivr_specialist') {
                authorName = 'IVR Specialist';
              } else if (msg.author_type === 'system') {
                authorName = 'IVR System';
              }

              messageDiv.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-900">${authorName}</span>
                  <span class="text-xs text-gray-500">
                    ${formattedTimestamp}
                  </span>
                </div>
                <p class="text-sm text-gray-700 whitespace-pre-wrap">${msg.message}</p>
              `;

              messagesContainer.appendChild(messageDiv);
            });
          }
        }
      } else {
        console.error('🚨 DOCTOR VIEW - Failed to load complex messages:', response.status);
      }
    } catch (error) {
      console.error('🚨 DOCTOR VIEW - Error loading complex messages:', error);
    }
  }, [id]);

  // Stable callbacks for WebSocket
  const handleStatusUpdate = useCallback((update: IVRStatusUpdate) => {
    console.log('🔄 Real-time IVR status update received:', update);

    if (update.ivr_id === id) {
      setIVRDetail(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          status: update.status,
          lastUpdated: update.timestamp,
          // Update metadata if provided
          ...(update.metadata && {
            request_metadata: {
              ...prev.request_metadata,
              ...update.metadata
            }
          })
        };
      });

      // Show notification for status changes
      if (update.metadata?.update_type === 'status_changed') {
        console.log(`📢 IVR ${id} status changed: ${update.metadata.previous_status} → ${update.status}`);
      }
    }
  }, [id]);

  const handleCommunicationUpdate = useCallback((update: any) => {
    console.log('💬 Real-time communication update received:', update);

    if (update.ivr_id === id && update.metadata?.update_type === 'communication_added') {
      // Refresh communication messages
      loadComplexMessages();
    }
  }, [id, loadComplexMessages]);

  // TEMPORARILY DISABLED WebSocket to stop console errors
  // const { connectionState, subscribeToIVR, isSubscribed } = useIVRWebSocket({
  //   ivrId: id,
  //   onStatusUpdate: handleStatusUpdate,
  //   onCommunicationUpdate: handleCommunicationUpdate,
  // });

  // Mock WebSocket state for UI
  const connectionState = 'disconnected';
  const isSubscribed = () => false;

  // Load communication messages from API
  const loadCommunications = async (ivrId: string) => {
    try {
      const response = await fetch(`/api/v1/ivr/requests/${ivrId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const ivrData = await response.json();
        return {
          doctor_comment: ivrData.doctor_comment || '',
          ivr_response: ivrData.ivr_response || '',
          comment_updated_at: ivrData.comment_updated_at || null
        };
      } else {
        console.error('Failed to load IVR data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading IVR data:', error);
    }
    return {
      doctor_comment: '',
      ivr_response: '',
      comment_updated_at: null
    };
  };

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchIVRDetail = async () => {
      if (!id) return;

      setLoading(true);
      console.log('🔍 DOCTOR VIEW - Loading IVR detail for ID:', id);

      try {
        // Get the correct mock data from the single source of truth
        const selectedData = mockIVRRequests.find(request => request.id === id) || mockIVRRequests[0];

        // Create mock detail data with correct patient information from shared source
        const mockDetail: DoctorIVRDetail = {
          id: selectedData.id,
          ivrNumber: selectedData.ivrNumber,
          patientName: selectedData.patientName,
          patientId: selectedData.patientId,
          dateOfBirth: '1985-03-15',
          insurance: selectedData.insurance,
          policyNumber: 'BC123456789',
          groupNumber: 'GRP001',
          serviceType: selectedData.serviceType,
          priority: selectedData.priority,
          status: selectedData.status,
          submittedDate: selectedData.submittedDate,
          lastUpdated: selectedData.lastUpdated,
          provider: {
            name: 'Dr. Sarah Johnson',
            npi: '1234567890',
            facility: 'Metro Health Center'
          },
          products: [
            {
              name: 'Advanced Wound Dressing',
              qCode: 'A6196',
              sizes: [
                { size: '2x2', quantity: 10, unitPrice: 15.50, total: 155.00 },
                { size: '4x4', quantity: 5, unitPrice: 22.75, total: 113.75 }
              ],
              totalQuantity: 15,
              totalCost: 268.75
            }
          ],
          totalCost: 268.75,
          notes: `Patient requires specialized wound care dressing for ${selectedData.serviceType.toLowerCase()} treatment.`,
          patient: {
            firstName: selectedData.patientName.split(' ')[0],
            lastName: selectedData.patientName.split(' ')[1] || '',
            dateOfBirth: '1985-03-15',
            phone: '(555) 123-4567',
            email: `${selectedData.patientName.toLowerCase().replace(' ', '.')}@email.com`,
            insurance: selectedData.insurance,
            policyNumber: 'BC123456789'
          },
          serviceDetails: {
            description: selectedData.serviceType,
            diagnosis: 'Chronic venous ulcer, lower leg',
            treatmentPlan: `${selectedData.serviceType} with regular monitoring`,
            urgency: selectedData.priority === 'high' ? 'Urgent' : selectedData.priority === 'medium' ? 'Routine' : 'Low Priority'
          },
          documents: [
            {
              id: 'doc1',
              name: 'Medical History.pdf',
              type: 'application/pdf',
              size: 245760,
              uploadedAt: '2024-03-15T10:30:00Z',
              url: '/api/documents/doc1'
            }
          ],
          doctor_comment: '',
          ivr_response: '',
          comment_updated_at: null,
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
            },
            {
              status: selectedData.status,
              timestamp: '2024-03-18T14:30:00Z',
              note: `IVR ${selectedData.status} with details`
            }
          ]
        };

        // TEMPORARILY DISABLED API CALL TO FORCE USE OF SHARED MOCK DATA
        // This ensures status consistency while we debug the API issue
        console.log('🔍 DOCTOR VIEW - Using shared mock data only (API disabled for debugging)');

        // Force use of shared mock data status
        mockDetail.status = selectedData.status;
        mockDetail.doctor_comment = '';
        mockDetail.ivr_response = '';
        mockDetail.comment_updated_at = null;

        console.log('🔍 DOCTOR VIEW - Final IVR Detail:', mockDetail);
        setIVRDetail(mockDetail);
        setLoading(false);

        // TEMPORARILY DISABLED complex messages loading
        // await loadComplexMessages();
      } catch (error) {
        console.error('🚨 DOCTOR VIEW - Error in fetchIVRDetail:', error);
        setLoading(false);
      }
    };

    fetchIVRDetail();

    // No polling - WebSocket handles real-time updates
    console.log('✅ Using WebSocket for real-time updates - no polling needed');

  }, [id, loadComplexMessages]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Submitted' },
      in_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon, label: 'In Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Rejected' },
      documents_requested: { bg: 'bg-purple-100', text: 'text-purple-800', icon: ExclamationTriangleIcon, label: 'Documents Requested' }
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

  const handleSubmitComment = async () => {
    if (!newComment.trim() && !attachment) return;
    setIsSubmittingComment(true);
    // Simulate sending message with attachment
    setTimeout(() => {
      toast.success('Message sent' + (attachment ? ' with attachment' : ''));
      setNewComment('');
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      setIsSubmittingComment(false);
      // Optionally refresh messages
      loadComplexMessages();
    }, 1000);
  };

  const handleOrderClick = () => {
    // This will be handled by the IVRResultsDisplay component
    console.log('Order button clicked - handled by IVRResultsDisplay');
  };

  const handleNavigateToOrder = (orderId: string) => {
    // Navigate to order detail page
    navigate(`/doctor/orders?orderId=${orderId}`);
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!file || !ivrDetail) {
      setUploadedFile(null);
      setUploadProgress(0);
      return;
    }

    setUploadedFile(file);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 20;
        });
      }, 200);

      // Wait for upload to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new document entry
      const newDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file)
      };

      // Update the IVR detail with the new document
      setIVRDetail(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: [...prev.documents, newDocument]
        };
      });

      // Show success message
      toast.success(`${file.name} uploaded successfully`);

      // Reset upload state after a delay
      setTimeout(() => {
        setUploadedFile(null);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
      setUploadedFile(null);
      setUploadProgress(0);
    }
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
                            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
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

        {/* WebSocket Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-500">
            {connectionState === 'connected' ? 'Live Updates' :
             connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
          </span>
          {id && isSubscribed && isSubscribed(id) && (
            <span className="text-xs text-green-600">• Subscribed</span>
          )}
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
                    ? 'border-slate-500 text-slate-600'
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
              <IVRResultsDisplay
                results={mockIVRResults}
                showOrderButton={true}
                onOrderClick={handleOrderClick}
                ivrId={id}
                onNavigateToOrder={handleNavigateToOrder}
              />
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
                    <dd className="text-sm text-gray-900">{formatDateOnly(ivrDetail.patient.dateOfBirth)}</dd>
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

              {/* Treating Physician */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <IdentificationIcon className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Treating Physician</h3>
                </div>
                                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">Dr. John Smith</dd>
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
                      <div className="flex-shrink-0 w-2 h-2 bg-slate-500 rounded-full mt-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
                        </p>
                        <p className="text-sm text-gray-500">{formatMessageTimestamp(item.timestamp)}</p>
                        {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Simplified Communication */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Communication with IVR Specialist</h3>

              <div className="space-y-6">
                {/* System Messages and Complex Communication Thread */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Communication History</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Load and display complex messages from API */}
                    <div id="complex-messages">
                      {/* This will be populated by the loadComplexMessages function */}
                    </div>
                  </div>
                </div>

                {/* Doctor's Comment Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Your Comment/Question</h4>
                  {ivrDetail.doctor_comment ? (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-gray-900 mb-2">{ivrDetail.doctor_comment}</p>
                      {ivrDetail.comment_updated_at && (
                        <p className="text-xs text-gray-500">
                          Updated: {formatMessageTimestamp(ivrDetail.comment_updated_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No comment submitted yet</p>
                  )}
                </div>

                {/* IVR Response Section */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">IVR Specialist Response</h4>
                  {ivrDetail.ivr_response ? (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-gray-900">{ivrDetail.ivr_response}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No response from IVR specialist yet</p>
                  )}
                </div>

                {/* Add/Update Comment */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-900">
                      {ivrDetail.doctor_comment ? 'Update Your Comment' : 'Add a Comment or Question'}
                    </h4>
                  </div>

                  {/* Attachment Modal */}
                  {showAttachmentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Attach Document</h3>
                          <button
                            onClick={() => setShowAttachmentModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XCircleIcon className="h-6 w-6" />
                          </button>
                        </div>
                        <UniversalFileUpload
                          label="Select Document"
                          description="Upload supporting documents, insurance cards, or photos"
                          value={attachment}
                          onChange={(file) => {
                            setAttachment(file);
                            if (file) {
                              setAttachmentPreviewUrl(URL.createObjectURL(file));
                              setShowAttachmentModal(false);
                            }
                          }}
                          acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                          maxSizeMB={10}
                          showCamera={true}
                          className="border-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Show selected attachment as chip */}
                  {attachment && (
                    <div className="mb-3">
                      <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">{attachment.name}</span>
                        <span className="text-blue-600 ml-2">({(attachment.size / 1024 / 1024).toFixed(1)}MB)</span>
                        <button
                          onClick={() => {
                            setAttachment(null);
                            setAttachmentPreviewUrl(null);
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message compose area */}
                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={ivrDetail.doctor_comment ? 'Update your comment...' : 'Add a comment or question...'}
                      className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />

                    {/* Paperclip and Send buttons */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentModal(true)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Attach document, photo, or use camera"
                      >
                        <PaperClipIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || (!newComment.trim() && !attachment)}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingComment ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Use the paperclip to attach documents, photos, or capture images with your camera
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            </div>

            {/* Document Upload Section */}
            <div className="mb-8">
              <UniversalFileUpload
                label="Upload Additional Document"
                description="Upload supporting documents for this IVR request (PDF, images, medical records)"
                value={uploadedFile}
                onChange={handleDocumentUpload}
                onUploadProgress={setUploadProgress}
                status={uploadProgress > 0 && uploadProgress < 100 ? 'uploading' : uploadedFile ? 'success' : 'pending'}
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.doc', '.docx']}
                maxSizeMB={25}
                showCamera={true}
                multiple={false}
              />
            </div>

            {/* Existing Documents List */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h4>
              {ivrDetail.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB • {formatDateOnly(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-600 hover:text-slate-700 text-sm font-medium">
                    Download
                  </button>
                </div>
              ))}

              {ivrDetail.documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Use the upload area above to add supporting documents</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorIVRDetailPage;
export { DoctorIVRDetailPage };