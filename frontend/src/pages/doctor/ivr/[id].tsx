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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import IVRResultsDisplay from '../../../components/ivr/IVRResultsDisplay';
import { formatMessageTimestamp, formatDateOnly } from '../../../utils/formatters';
import { useIVRWebSocket, IVRStatusUpdate } from '../../../hooks/useIVRWebSocket';

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

const DoctorIVRDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'documents'>('overview');
  const [doctorComment, setDoctorComment] = useState('');
  const [ivrDetail, setIVRDetail] = useState<DoctorIVRDetail | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [complexMessages, setComplexMessages] = useState<any[]>([]);

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

  // WebSocket subscription for real-time updates
  const { connectionState, subscribeToIVR, isSubscribed } = useIVRWebSocket({
    ivrId: id,
    onStatusUpdate: handleStatusUpdate,
    onCommunicationUpdate: handleCommunicationUpdate,
  });

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
        // Create mock detail data
        const mockDetail: DoctorIVRDetail = {
          id: id,
          ivrNumber: 'IVR-2024-001',
          patientName: 'John Doe',
          patientId: 'P-12345',
          dateOfBirth: '1985-03-15',
          insurance: 'Blue Cross Blue Shield',
          policyNumber: 'BC123456789',
          groupNumber: 'GRP001',
          serviceType: 'Wound Care Assessment',
          priority: 'medium',
          status: 'approved',
          submittedDate: '2024-03-15',
          lastUpdated: '2024-03-16',
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
          notes: 'Patient requires specialized wound care dressing for chronic ulcer treatment.',
          patient: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1985-03-15',
            phone: '(555) 123-4567',
            email: 'john.doe@email.com',
            insurance: 'Blue Cross Blue Shield',
            policyNumber: 'BC123456789'
          },
          serviceDetails: {
            description: 'Wound Care Assessment and Treatment',
            diagnosis: 'Chronic venous ulcer, lower leg',
            treatmentPlan: 'Advanced wound dressing application with regular monitoring',
            urgency: 'Routine'
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
              status: 'approved',
              timestamp: '2024-03-18T14:30:00Z',
              note: 'IVR approved with coverage details'
            }
          ]
        };

        // Load actual data from API to get real communication data
        try {
          const response = await fetch(`/api/v1/ivr/requests/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          if (response.ok) {
            const apiData = await response.json();
            console.log('🔍 DOCTOR VIEW - Full API Response:', apiData);

            // Update mock data with real communication data
            mockDetail.doctor_comment = apiData.doctor_comment || '';
            mockDetail.ivr_response = apiData.ivr_response || '';
            mockDetail.comment_updated_at = apiData.comment_updated_at || null;
            mockDetail.status = apiData.status || 'in_review';
          } else {
            console.error('🚨 DOCTOR VIEW - Failed to load real data:', response.status);
          }
        } catch (error) {
          console.error('🚨 DOCTOR VIEW - Error loading real data:', error);
        }

        console.log('🔍 DOCTOR VIEW - Final IVR Detail:', mockDetail);
        setIVRDetail(mockDetail);
        setLoading(false);

        // Load complex messages (including document requests)
        await loadComplexMessages();
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
    if (!doctorComment.trim() || !ivrDetail) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/doctor-comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          comment: doctorComment
        })
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        console.log('🔍 DOCTOR VIEW - Comment submission response:', updatedRequest);

        // Refresh the entire IVR detail to get latest data
        const refreshResponse = await fetch(`/api/v1/ivr/requests/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          console.log('🔍 DOCTOR VIEW - Refreshed data after comment:', refreshedData);

          setIVRDetail({
            ...ivrDetail,
            doctor_comment: refreshedData.doctor_comment || '',
            ivr_response: refreshedData.ivr_response || '',
            comment_updated_at: refreshedData.comment_updated_at || null
          });
        } else {
          // Fallback to response data
          setIVRDetail({
            ...ivrDetail,
            doctor_comment: updatedRequest.doctor_comment,
            comment_updated_at: updatedRequest.comment_updated_at
          });
        }

        setDoctorComment('');
        alert('Comment submitted successfully!');

        // Refresh complex messages to show any new system messages
        loadComplexMessages();
      } else {
        console.error('Failed to submit comment');
        alert('Failed to submit comment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleOrderClick = () => {
    // Navigate to order page or show order modal
    alert('Order functionality will be implemented in the next phase. This will allow doctors to order the approved products.');
    // Future implementation: navigate('/orders/create', { state: { ivrId: id, products: ivrDetail.products } });
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
              <IVRResultsDisplay
                results={mockIVRResults}
                showOrderButton={true}
                onOrderClick={handleOrderClick}
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

              {/* Physician Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Physician Information</h3>
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
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
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
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/v1/ivr/requests/${id}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                          });
                          if (response.ok) {
                            const data = await response.json();
                            console.log('🔄 DOCTOR VIEW - Manual refresh data:', data);
                            setIVRDetail({
                              ...ivrDetail,
                              doctor_comment: data.doctor_comment || '',
                              ivr_response: data.ivr_response || '',
                              comment_updated_at: data.comment_updated_at || null
                            });
                            // Also refresh complex messages
                            loadComplexMessages();
                          }
                        } catch (error) {
                          console.error('🚨 Manual refresh error:', error);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      value={doctorComment}
                      onChange={(e) => setDoctorComment(e.target.value)}
                      placeholder="Type your comment or question for the IVR specialist..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!doctorComment.trim() || isSubmittingComment}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Submitting...' : (ivrDetail.doctor_comment ? 'Update Comment' : 'Submit Comment')}
                    </button>
                  </div>
                </div>
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
                        {(doc.size / 1024 / 1024).toFixed(1)} MB • {formatDateOnly(doc.uploadedAt)}
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