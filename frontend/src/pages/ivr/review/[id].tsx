import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  IdentificationIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ClockIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import UniversalFileUpload from '../../../components/shared/UniversalFileUpload';
import { ApprovalModal, RejectionModal, DocumentRequestModal } from '../../../components/ivr/modals';

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
  status: 'pending_review' | 'awaiting_docs' | 'ready' | 'completed' | 'approved';
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
  communications: Array<{
    id: string;
    message: string;
    author: string;
    timestamp: string;
    type: 'internal' | 'external';
  }>;
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
  const [loading, setLoading] = useState(true);
  const [ivrRequest, setIvrRequest] = useState<IVRRequest | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData: IVRRequest = {
      id: id || '660e8400-e29b-41d4-a716-446655440004',
      ivrNumber: 'IVR-2024-001',
      patientName: 'John Smith',
      doctorName: 'Dr. Sarah Wilson',
      insurance: 'Blue Cross Blue Shield',
      status: 'pending_review',
      priority: 'high',
      daysPending: 3,
      submittedDate: '2024-03-15',
      patientId: 'P-1234',
      doctorId: 'D-001',
      patient: {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1980-05-15',
        address: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101'
      },
      insuranceDetails: {
        provider: 'Blue Cross Blue Shield',
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
      ivrResults: {
        caseNumber: 'CASE-2024-001234',
        verificationDate: '2024-03-16',
        coverageStatus: 'covered',
        coveragePercentage: 80,
        deductibleAmount: 500,
        copayAmount: 50,
        outOfPocketMax: 550,
        priorAuthRequired: true,
        priorAuthStatus: 'approved',
        coverageDetails: 'Wound care supplies covered at 80% after deductible. Prior authorization approved for 6-week treatment period.',
        coverageNotes: 'Patient has met 50% of annual deductible. Coverage effective through end of plan year.'
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
      communications: [
        {
          id: 'comm1',
          message: 'Initial IVR request submitted. Awaiting review.',
          author: 'Dr. Sarah Wilson',
          timestamp: '2024-03-15T10:30:00Z',
          type: 'external'
        },
        {
          id: 'comm2',
          message: 'Patient insurance verification in progress.',
          author: 'IVR Specialist',
          timestamp: '2024-03-15T14:15:00Z',
          type: 'internal'
        }
      ]
    };

    setTimeout(() => {
      setIvrRequest(mockData);
      setLoading(false);
    }, 500);
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
        // Update the IVR request status and add approval results
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
        // Update the IVR request status
        if (ivrRequest) {
          setIvrRequest({ ...ivrRequest, status: 'rejected' });
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
        // Update the IVR request status
        if (ivrRequest) {
          setIvrRequest({ ...ivrRequest, status: 'awaiting_docs' });
        }
        setIsDocumentRequestModalOpen(false);
        // Show success notification
        alert('Document request sent successfully!');
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newComm = {
      id: `comm${Date.now()}`,
      message: newMessage,
      author: 'IVR Specialist',
      timestamp: new Date().toISOString(),
      type: 'internal' as const
    };

    setIvrRequest(prev => prev ? {
      ...prev,
      communications: [...prev.communications, newComm]
    } : null);

    setNewMessage('');
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
      pending_review: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Review' },
      awaiting_docs: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Awaiting Docs' },
      ready: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Ready' },
      completed: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Completed' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_review;
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
                  <p className="text-gray-900">{new Date(ivrRequest.patient.dateOfBirth).toLocaleDateString()}</p>
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
                  <p className="text-gray-900">{new Date(ivrRequest.insuranceDetails.effectiveDate).toLocaleDateString()}</p>
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
                    <p className="text-gray-900">{new Date(ivrRequest.medicalInfo.treatmentStartDate).toLocaleDateString()}</p>
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

            {/* IVR Results Display - Show if approved */}
            {ivrRequest.ivrResults && (
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
                      <p className="text-gray-900">{new Date(ivrRequest.ivrResults.verificationDate).toLocaleDateString()}</p>
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
                      <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
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
                          {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
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

            {/* Phone Call Checklist */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
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

            {/* Communication Thread */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
              </div>

              {/* Messages */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {ivrRequest.communications.map((comm) => (
                  <div key={comm.id} className={`p-3 rounded-lg ${
                    comm.type === 'internal' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{comm.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comm.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comm.message}</p>
                  </div>
                ))}
              </div>

              {/* Add Message */}
              <div className="space-y-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a note or message..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>

            {/* Request Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="text-gray-900">{new Date(ivrRequest.submittedDate).toLocaleDateString()}</span>
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
                  <span className="text-gray-900">Dr. Jane Smith</span>
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