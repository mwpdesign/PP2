import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIVR } from '../../../contexts/IVRContext';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  IdentificationIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  ClockIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import UniversalFileUpload from '../../../components/shared/UniversalFileUpload';
import { ApprovalModal, RejectionModal, DocumentRequestModal } from '../../../components/ivr/modals';
import { formatMessageTimestamp, formatDateOnly } from '../../../utils/formatters';
import { mockIVRRequests } from '../../../data/mockIVRData';

interface Product {
  id: string;
  name: string;
  category: string;
  sizes: Array<{
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalUnits: number;
  totalCost: number;
}

interface IVRResults {
  caseNumber: string;
  verificationDate: string;
  coverageStatus: 'covered' | 'not_covered' | 'partial';
  coveragePercentage: number;
  deductibleAmount: number;
  copayAmount: number;
  outOfPocketMax: number;
  priorAuthRequired: boolean;
  priorAuthStatus?: 'approved' | 'pending' | 'denied';
  coverageDetails: string;
  coverageNotes: string;
}

interface IVRRequest {
  id: string;
  ivrNumber: string;
  patientName: string;
  doctorName: string;
  insurance: string;
  status: 'submitted' | 'in_review' | 'pending_approval' | 'documents_requested' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  daysPending: number;
  submittedDate: string;
  patientId: string;
  doctorId: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  insuranceDetails: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    memberID: string;
    effectiveDate: string;
    copay: string;
    deductible: string;
    priorAuthRequired: boolean;
  };
  medicalInfo: {
    primaryDiagnosis: string;
    secondaryDiagnosis?: string;
    icdCodes: string[];
    cptCodes: string[];
    hcpcsCodes: string[];
    treatmentStartDate: string;
    treatmentFrequency: string;
    treatmentDuration: string;
    description: string;
  };
  products: Product[];
  ivrResults?: IVRResults;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
  }>;
  clinicalNotes: {
    doctorNotes: string;
    specialInstructions: string;
    medicalJustification: string;
  };
  history: Array<{
    id: string;
    type: 'ivr' | 'order' | 'communication';
    date: string;
    description: string;
    status: string;
  }>;
  doctor_comment?: string;
  ivr_response?: string;
  comment_updated_at?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

const IVRReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateIVRStatus, getIVRById } = useIVR();
  const [loading, setLoading] = useState(true);
  const [ivrRequest, setIvrRequest] = useState<IVRRequest | null>(null);
  const [ivrResponse, setIvrResponse] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Verify patient identity', completed: false, required: true },
    { id: '2', label: 'Confirm insurance coverage', completed: false, required: true },
    { id: '3', label: 'Review medical necessity', completed: false, required: true },
    { id: '4', label: 'Check prior authorizations', completed: false, required: true },
    { id: '5', label: 'Validate provider credentials', completed: false, required: false },
    { id: '6', label: 'Review treatment plan', completed: false, required: false }
  ]);

  // Modal states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isDocumentRequestModalOpen, setIsDocumentRequestModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  // Load complex messages (including system messages like document requests)
  const loadComplexMessages = async () => {
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const messages = await response.json();
        console.log('🔍 IVR COMPANY VIEW - Complex messages:', messages);

        const messagesContainer = document.getElementById('complex-messages-ivr');
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
        console.error('🚨 IVR COMPANY VIEW - Failed to load complex messages:', response.status);
      }
    } catch (error) {
      console.error('🚨 IVR COMPANY VIEW - Error loading complex messages:', error);
    }
  };

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchData = async () => {
      // Get the correct mock data from the single source of truth
      const selectedData = mockIVRRequests.find(request => request.id === id) || mockIVRRequests[0];

    const mockData: IVRRequest = {
      id: selectedData.id,
      ivrNumber: selectedData.ivrNumber,
      patientName: selectedData.patientName,
      doctorName: selectedData.doctorName,
      insurance: selectedData.insurance,
      status: selectedData.status,
      priority: selectedData.priority,
      daysPending: selectedData.daysPending,
      submittedDate: selectedData.submittedDate,
      patientId: selectedData.patientId,
      doctorId: selectedData.doctorId,
      patient: {
        firstName: selectedData.patientName.split(' ')[0],
        lastName: selectedData.patientName.split(' ')[1] || '',
        dateOfBirth: '1980-05-15',
        address: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101'
      },
      insuranceDetails: {
        provider: selectedData.insurance,
        policyNumber: 'BCBS123456789',
        groupNumber: 'GRP001',
        memberID: 'MEM123456',
        effectiveDate: '2024-01-01',
        copay: '$25',
        deductible: '$1,500',
        priorAuthRequired: true
      },
      medicalInfo: {
        primaryDiagnosis: 'Chronic wound care',
        secondaryDiagnosis: 'Diabetes mellitus',
        icdCodes: ['L89.90', 'E11.9'],
        cptCodes: ['97597', '97598'],
        hcpcsCodes: ['A6550', 'A6551'],
        treatmentStartDate: '2024-03-20',
        treatmentFrequency: 'Daily',
        treatmentDuration: '4-6 weeks',
        description: 'Patient requires specialized wound care treatment for chronic diabetic ulcer on left foot.'
      },
      products: [
        {
          id: 'prod1',
          name: 'Rampart Wound Dressing',
          category: 'Wound Care',
          sizes: [
            { size: '4x4 inch', quantity: 10, unitPrice: 15.50 },
            { size: '6x6 inch', quantity: 5, unitPrice: 22.75 },
            { size: '8x8 inch', quantity: 3, unitPrice: 35.00 }
          ],
          totalUnits: 18,
          totalCost: 373.75
        },
        {
          id: 'prod2',
          name: 'Hydrogel Sheets',
          category: 'Wound Care',
          sizes: [
            { size: '2x2 inch', quantity: 20, unitPrice: 8.25 }
          ],
          totalUnits: 20,
          totalCost: 165.00
        }
      ],
      // IVR Results for approved status
      ivrResults: {
        caseNumber: 'CASE-2024-001234',
        verificationDate: '2024-03-18T14:30:00Z',
        coverageStatus: 'covered',
        coveragePercentage: 80,
        deductibleAmount: 1500,
        copayAmount: 25,
        outOfPocketMax: 5000,
        priorAuthRequired: true,
        priorAuthStatus: 'approved',
        coverageDetails: 'Coverage approved at 80% with specified cost-sharing amounts. Advanced wound care products are covered under DME benefit.',
        coverageNotes: 'Patient meets medical necessity criteria for chronic wound care. Prior authorization approved for 90-day supply with option to renew.'
      },
      documents: [
        {
          id: 'doc1',
          name: 'Medical_Records_John_Smith.pdf',
          type: 'application/pdf',
          size: 2048576,
          uploadedAt: '2024-03-15T10:30:00Z',
          url: '/api/documents/doc1'
        },
        {
          id: 'doc2',
          name: 'Insurance_Card_Front.jpg',
          type: 'image/jpeg',
          size: 1024768,
          uploadedAt: '2024-03-15T10:32:00Z',
          url: '/api/documents/doc2'
        }
      ],
      clinicalNotes: {
        doctorNotes: 'Patient presents with non-healing diabetic ulcer on left foot, present for 8 weeks. Wound measures 3.2cm x 2.1cm with moderate exudate. Patient has good glycemic control with HbA1c of 7.2%.',
        specialInstructions: 'Change dressing daily. Monitor for signs of infection. Patient education on proper foot care provided.',
        medicalJustification: 'Advanced wound care products are medically necessary due to the chronic nature of the wound and failure to heal with standard care. Patient requires specialized dressings to promote healing and prevent infection.'
      },
      history: [
        {
          id: 'hist1',
          type: 'ivr',
          date: '2024-02-15',
          description: 'Previous IVR for wound care supplies - Approved',
          status: 'completed'
        },
        {
          id: 'hist2',
          type: 'order',
          date: '2024-02-20',
          description: 'Order #ORD-2024-0156 - Wound care supplies delivered',
          status: 'delivered'
        },
        {
          id: 'hist3',
          type: 'communication',
          date: '2024-03-01',
          description: 'Follow-up call with patient - wound improving',
          status: 'completed'
        }
      ],
      doctor_comment: '',
      ivr_response: '',
      comment_updated_at: null
    };

      // DEBUGGING: Load actual data from API to get real communication data
      try {
        const response = await fetch(`/api/v1/ivr/requests/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const apiData = await response.json();
          console.log('🔍 IVR COMPANY VIEW - Full API Response:', apiData);
          console.log('🔍 IVR COMPANY VIEW - Doctor Comment:', apiData.doctor_comment);
          console.log('🔍 IVR COMPANY VIEW - IVR Response:', apiData.ivr_response);
          console.log('🔍 IVR COMPANY VIEW - Comment Updated At:', apiData.comment_updated_at);

          // Update mock data with real communication data
          mockData.doctor_comment = apiData.doctor_comment || '';
          mockData.ivr_response = apiData.ivr_response || '';
          mockData.comment_updated_at = apiData.comment_updated_at || null;
        } else {
          console.error('🚨 IVR COMPANY VIEW - Failed to load real data:', response.status);
        }
      } catch (error) {
        console.error('🚨 IVR COMPANY VIEW - Error loading real data:', error);
      }

      console.log('🔍 IVR COMPANY VIEW - Final IVR Request:', mockData);
      setIvrRequest(mockData);
      setLoading(false);

      // Load complex messages (including document requests)
      loadComplexMessages();
    };

    fetchData();

    // POLLING COMPLETELY DISABLED TO STOP RATE LIMITING
    console.log('🚨 POLLING DISABLED - Manual refresh only');

    return () => {
      // No cleanup needed since no polling
    };
  }, [id]);

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleApprove = () => {
    setIsApprovalModalOpen(true);
  };

  const handleRequestDocs = () => {
    setIsDocumentRequestModalOpen(true);
  };

  const handleReject = () => {
    setIsRejectionModalOpen(true);
  };

  // API call handlers
  const handleApprovalSubmit = async (approvalData: any) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          coverage_percentage: approvalData.coveragePercentage,
          deductible_amount: approvalData.deductibleAmount,
          copay_amount: approvalData.copayAmount,
          out_of_pocket_max: approvalData.outOfPocketMax,
          coverage_notes: approvalData.coverageNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the IVR request status in shared context
        if (id) {
          updateIVRStatus(id, 'approved');
          // Also update local state for immediate UI feedback
          if (ivrRequest) {
            const updatedRequest = {
              ...ivrRequest,
              status: 'approved' as const,
              ivrResults: {
                caseNumber: `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                verificationDate: new Date().toISOString(),
                coverageStatus: 'covered' as const,
                coveragePercentage: approvalData.coveragePercentage,
                deductibleAmount: approvalData.deductibleAmount,
                copayAmount: approvalData.copayAmount,
                outOfPocketMax: approvalData.outOfPocketMax,
                priorAuthRequired: true,
                priorAuthStatus: 'approved' as const,
                coverageDetails: `Coverage approved at ${approvalData.coveragePercentage}% with specified cost-sharing amounts.`,
                coverageNotes: approvalData.coverageNotes
              }
            };
            setIvrRequest(updatedRequest);
          }
        }
        setIsApprovalModalOpen(false);
        // Show success notification with coverage details
        const successMessage = `IVR approved with ${approvalData.coveragePercentage}% coverage, $${approvalData.deductibleAmount} deductible, $${approvalData.copayAmount} copay, $${approvalData.outOfPocketMax} OOP max`;
        alert(successMessage);
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectionSubmit = async (rejectionData: any) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(rejectionData)
      });

      if (response.ok) {
        const result = await response.json();
        // Update the IVR request status in shared context
        if (id) {
          updateIVRStatus(id, 'rejected');
          // Also update local state for immediate UI feedback
          if (ivrRequest) {
            setIvrRequest({ ...ivrRequest, status: 'rejected' });
          }
        }
        setIsRejectionModalOpen(false);
        // Show success notification
        alert('IVR request rejected successfully!');
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDocumentRequestSubmit = async (documentRequestData: any) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/request-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          requested_documents: documentRequestData.requestedDocuments,
          other_document: documentRequestData.otherDocument,
          additional_instructions: documentRequestData.additionalInstructions
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the IVR request status in shared context
        if (id) {
          updateIVRStatus(id, 'documents_requested');
          // Also update local state for immediate UI feedback
          if (ivrRequest) {
            setIvrRequest({ ...ivrRequest, status: 'documents_requested' });
          }
        }
        setIsDocumentRequestModalOpen(false);
        // Show success notification
        alert('Document request sent successfully!');

        // Refresh complex messages to show the document request
        loadComplexMessages();
      } else {
        throw new Error('Failed to request documents');
      }
    } catch (error) {
      console.error('Error requesting documents:', error);
      alert('Failed to request documents. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!ivrResponse.trim() || !ivrRequest) return;

    setIsSubmittingResponse(true);
    try {
      const response = await fetch(`/api/v1/ivr/requests/${id}/ivr-response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          response: ivrResponse
        })
      });

            if (response.ok) {
        const updatedRequest = await response.json();
        console.log('🔍 IVR COMPANY VIEW - Response submission response:', updatedRequest);

        // Refresh the entire IVR request to get latest data
        const refreshResponse = await fetch(`/api/v1/ivr/requests/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          console.log('🔍 IVR COMPANY VIEW - Refreshed data after response:', refreshedData);

          setIvrRequest({
            ...ivrRequest,
            doctor_comment: refreshedData.doctor_comment || '',
            ivr_response: refreshedData.ivr_response || '',
            comment_updated_at: refreshedData.comment_updated_at || null
          });
        } else {
          // Fallback to response data
          setIvrRequest({
            ...ivrRequest,
            ivr_response: updatedRequest.ivr_response,
            comment_updated_at: updatedRequest.comment_updated_at
          });
        }

        setIvrResponse('');
        alert('Response submitted successfully!');

        // Refresh complex messages to show any new system messages
        loadComplexMessages();
      } else {
        console.error('Failed to submit response');
        alert('Failed to submit response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      in_review: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Review' },
      pending_approval: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pending Approval' },
      documents_requested: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Documents Requested' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      escalated: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Escalated' },
      cancelled: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Cancelled' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.in_review;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High Priority' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium Priority' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Priority' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading IVR request details...</div>
      </div>
    );
  }

  if (!ivrRequest) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">IVR Request Not Found</h2>
          <p className="text-gray-600 mb-4">The requested IVR could not be found.</p>
          <button
            onClick={() => navigate('/ivr/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ivrRequest.status);
  const priorityBadge = getPriorityBadge(ivrRequest.priority);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/ivr/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{ivrRequest.ivrNumber}</h1>
              <p className="text-sm text-gray-600">{ivrRequest.patientName} • {ivrRequest.doctorName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
              {priorityBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Column - Patient Info (40%) */}
        <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <UserIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Full Name</label>
                  <p className="text-gray-900">{ivrRequest.patient.firstName} {ivrRequest.patient.lastName}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900">{formatDateOnly(ivrRequest.patient.dateOfBirth)}</p>
                </div>

                <div className="col-span-2">
                  <label className="font-medium text-gray-700">Address</label>
                  <p className="text-gray-900">
                    {ivrRequest.patient.address}<br />
                    {ivrRequest.patient.city}, {ivrRequest.patient.state} {ivrRequest.patient.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Insurance Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Insurance Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Provider</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.provider}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Policy Number</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.policyNumber}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Group Number</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.groupNumber}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Member ID</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.memberID}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Effective Date</label>
                  <p className="text-gray-900">{formatDateOnly(ivrRequest.insuranceDetails.effectiveDate)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Copay</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.copay}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Deductible</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.deductible}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Prior Auth Required</label>
                  <p className="text-gray-900">{ivrRequest.insuranceDetails.priorAuthRequired ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Medical Information with CPT/HCPCS and Treatment Start Date */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <HeartIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Primary Diagnosis</label>
                  <p className="text-gray-900">{ivrRequest.medicalInfo.primaryDiagnosis}</p>
                </div>
                {ivrRequest.medicalInfo.secondaryDiagnosis && (
                  <div>
                    <label className="font-medium text-gray-700">Secondary Diagnosis</label>
                    <p className="text-gray-900">{ivrRequest.medicalInfo.secondaryDiagnosis}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">ICD Codes</label>
                    <p className="text-gray-900">{ivrRequest.medicalInfo.icdCodes.join(', ')}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">CPT Codes</label>
                    <p className="text-gray-900">{ivrRequest.medicalInfo.cptCodes.join(', ')}</p>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">HCPCS Codes</label>
                  <p className="text-gray-900">{ivrRequest.medicalInfo.hcpcsCodes.join(', ')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">Treatment Start Date</label>
                    <p className="text-gray-900">{formatDateOnly(ivrRequest.medicalInfo.treatmentStartDate)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Frequency</label>
                    <p className="text-gray-900">{ivrRequest.medicalInfo.treatmentFrequency}</p>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Duration</label>
                  <p className="text-gray-900">{ivrRequest.medicalInfo.treatmentDuration}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{ivrRequest.medicalInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Products Requested - Multi-Size Table Format */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <BeakerIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Products Requested</h3>
              </div>
              <div className="space-y-4">
                {ivrRequest.products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="text-sm text-gray-600">{product.category}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-gray-700">Size</th>
                            <th className="text-right py-2 text-gray-700">Qty</th>
                            <th className="text-right py-2 text-gray-700">Unit Price</th>
                            <th className="text-right py-2 text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.sizes.map((size, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{size.size}</td>
                              <td className="py-2 text-right text-gray-900">{size.quantity}</td>
                              <td className="py-2 text-right text-gray-900">${size.unitPrice.toFixed(2)}</td>
                              <td className="py-2 text-right text-gray-900">${(size.quantity * size.unitPrice).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="font-medium">
                            <td className="py-2 text-gray-900">Total</td>
                            <td className="py-2 text-right text-gray-900">{product.totalUnits}</td>
                            <td className="py-2 text-right text-gray-900">-</td>
                            <td className="py-2 text-right text-gray-900">${product.totalCost.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IVR Results Display - Show ONLY when approved */}
            {ivrRequest.status === 'approved' && ivrRequest.ivrResults && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <DocumentCheckIcon className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">IVR Results</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">Case Number</label>
                      <p className="text-gray-900">{ivrRequest.ivrResults.caseNumber}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Verification Date</label>
                      <p className="text-gray-900">{formatDateOnly(ivrRequest.ivrResults.verificationDate)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Coverage Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ivrRequest.ivrResults.coverageStatus === 'covered' ? 'bg-green-100 text-green-800' :
                        ivrRequest.ivrResults.coverageStatus === 'not_covered' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ivrRequest.ivrResults.coverageStatus === 'covered' ? 'Covered' :
                         ivrRequest.ivrResults.coverageStatus === 'not_covered' ? 'Not Covered' :
                         'Partial Coverage'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Coverage Percentage</label>
                    <p className="text-gray-900 text-lg font-semibold">{ivrRequest.ivrResults.coveragePercentage}%</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">Deductible Amount</label>
                      <p className="text-gray-900">${ivrRequest.ivrResults.deductibleAmount}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Copay Amount</label>
                      <p className="text-gray-900">${ivrRequest.ivrResults.copayAmount}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Out of Pocket Max</label>
                      <p className="text-gray-900">${ivrRequest.ivrResults.outOfPocketMax}</p>
                    </div>
                  </div>
                  {ivrRequest.ivrResults.priorAuthRequired && (
                    <div>
                      <label className="font-medium text-gray-700">Prior Auth Status</label>
                      <p className="text-gray-900 capitalize">{ivrRequest.ivrResults.priorAuthStatus}</p>
                    </div>
                  )}
                  <div>
                    <label className="font-medium text-gray-700">Coverage Details</label>
                    <p className="text-gray-900">{ivrRequest.ivrResults.coverageDetails}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Approval Notes</label>
                    <p className="text-gray-900">{ivrRequest.ivrResults.coverageNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Notes */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardDocumentListIcon className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Clinical Notes</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Doctor's Notes</label>
                  <p className="text-gray-900">{ivrRequest.clinicalNotes.doctorNotes}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Special Instructions</label>
                  <p className="text-gray-900">{ivrRequest.clinicalNotes.specialInstructions}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Medical Justification</label>
                  <p className="text-gray-900">{ivrRequest.clinicalNotes.medicalJustification}</p>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">History</h3>
              </div>
              <div className="space-y-3">
                {ivrRequest.history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{formatDateOnly(item.date)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Document Viewer (35%) */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Documents Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              </div>

              {/* Existing Documents */}
              <div className="space-y-3 mb-6">
                {ivrRequest.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} • {formatDateOnly(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload Additional Documents */}
              <UniversalFileUpload
                label="Upload Additional Documents"
                description="Add supporting documents for this IVR request"
                value={uploadedFile}
                onChange={setUploadedFile}
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                maxSizeMB={10}
                showCamera={true}
              />
            </div>

            {/* Verification Checklist */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Verification Checklist</h3>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions (25%) */}
        <div className="w-1/4 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve Request
                </button>
                <button
                  onClick={handleRequestDocs}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Request Documents
                </button>
                <button
                  onClick={handleReject}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Reject Request
                </button>
              </div>
            </div>

            {/* Simplified Communication */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Communication with Doctor</h3>

                <div className="space-y-6">
                  {/* System Messages and Complex Communication Thread */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Communication History</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* Load and display complex messages from API */}
                      <div id="complex-messages-ivr">
                        {/* This will be populated by the loadComplexMessages function */}
                      </div>
                    </div>
                  </div>

                  {/* Doctor's Comment Section */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Doctor's Comment/Question</h4>
                    {ivrRequest.doctor_comment ? (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-gray-900 mb-2">{ivrRequest.doctor_comment}</p>
                        {ivrRequest.comment_updated_at && (
                          <p className="text-xs text-gray-500">
                            Updated: {formatMessageTimestamp(ivrRequest.comment_updated_at)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No comment from doctor yet</p>
                    )}
                  </div>

                  {/* IVR Response Section */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Your Response</h4>
                    {ivrRequest.ivr_response ? (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-gray-900">{ivrRequest.ivr_response}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No response submitted yet</p>
                    )}
                  </div>

                  {/* Add/Update Response */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-900">
                        {ivrRequest.ivr_response ? 'Update Your Response' : 'Respond to Doctor'}
                      </h4>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/v1/ivr/requests/${id}`, {
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                            });
                            if (response.ok) {
                              const data = await response.json();
                              console.log('🔄 IVR COMPANY VIEW - Manual refresh data:', data);
                              setIvrRequest({
                                ...ivrRequest,
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
                        value={ivrResponse}
                        onChange={(e) => setIvrResponse(e.target.value)}
                        placeholder="Type your response to the doctor..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={4}
                      />
                      <button
                        onClick={handleSubmitResponse}
                        disabled={!ivrResponse.trim() || isSubmittingResponse}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingResponse ? 'Submitting...' : (ivrRequest.ivr_response ? 'Update Response' : 'Submit Response')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="text-gray-900">{formatDateOnly(ivrRequest.submittedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Pending:</span>
                  <span className="text-gray-900">{ivrRequest.daysPending} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="text-gray-900">{ivrRequest.doctorName}</span>
                </div>
              </div>
            </div>

            {/* Physician Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <IdentificationIcon className="h-4 w-4 text-slate-600" />
                <h4 className="text-sm font-semibold text-gray-900">Physician Information</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="text-gray-900">{ivrRequest.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NPI:</span>
                  <span className="text-gray-900">1234567890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medicaid Provider #:</span>
                  <span className="text-gray-900">MED123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medicare PTAN:</span>
                  <span className="text-gray-900">AB12345</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApprovalSubmit}
        ivrRequest={{
          id: ivrRequest?.id || '',
          ivrNumber: ivrRequest?.ivrNumber || '',
          patientName: ivrRequest?.patientName || ''
        }}
        isLoading={isActionLoading}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onReject={handleRejectionSubmit}
        ivrRequest={{
          id: ivrRequest?.id || '',
          ivrNumber: ivrRequest?.ivrNumber || '',
          patientName: ivrRequest?.patientName || ''
        }}
        isLoading={isActionLoading}
      />

      {/* Document Request Modal */}
      <DocumentRequestModal
        isOpen={isDocumentRequestModalOpen}
        onClose={() => setIsDocumentRequestModalOpen(false)}
        onRequestDocuments={handleDocumentRequestSubmit}
        ivrRequest={{
          id: ivrRequest?.id || '',
          ivrNumber: ivrRequest?.ivrNumber || '',
          patientName: ivrRequest?.patientName || ''
        }}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default IVRReviewDetailPage;