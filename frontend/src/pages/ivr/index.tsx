import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockIVRService } from '../../services/mockIVRService';
import { IVRRequest, IVRStatus, IVRPriority, User } from '../../types/ivr';
import { toast } from 'react-hot-toast';
import UniversalFileUpload from '../../components/shared/UniversalFileUpload';

interface IVRStats {
  totalIVRs: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

// Memoized IVR row component for performance - UPDATED TO MATCH PATIENT STYLING
const IVRRow = React.memo(({
  request,
  index,
  onRowClick,
  isIVRSpecialist,
  onUpdateStatus,
  newReviewNote,
  navigate
}: {
  request: IVRRequest;
  index: number;
  onRowClick: (request: IVRRequest) => void;
  isIVRSpecialist: boolean;
  onUpdateStatus: (id: string, status: IVRStatus, note?: string) => void;
  newReviewNote: string;
  navigate: (path: string) => void;
}) => {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    return `${Math.ceil(diffDays / 30)}mo ago`;
  };

  const getStatusBadgeColor = (status: IVRStatus) => {
    switch (status) {
      case IVRStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case IVRStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case IVRStatus.IN_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case IVRStatus.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800';
      case IVRStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // UPDATED: Match patient page priority dots (w-2 h-2 rounded-full)
  const getPriorityDotColor = (priority: IVRPriority) => {
    switch (priority) {
      case IVRPriority.URGENT:
        return 'bg-red-500';
      case IVRPriority.HIGH:
        return 'bg-orange-500';
      case IVRPriority.MEDIUM:
        return 'bg-yellow-500';
      case IVRPriority.LOW:
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatStatusText = (status: IVRStatus) => {
    switch (status) {
      case IVRStatus.IN_REVIEW:
        return 'In Review';
      case IVRStatus.SUBMITTED:
        return 'Pending Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <tr
      className={`group h-12 cursor-pointer transition-colors hover:bg-slate-100 ${
        index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
      }`}
      onClick={() => onRowClick(request)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick(request);
      }}
    >
      <td className="px-4 py-3">
        <div
          className={`w-2 h-2 rounded-full ${getPriorityDotColor(request.priority)}`}
          title={`Priority: ${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}`}
        />
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">
        {request.id}
      </td>
      <td className="px-4 py-3 text-gray-900 text-sm truncate max-w-[150px]">
        {request.patient?.firstName} {request.patient?.lastName}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-[120px]">
        {request.provider?.name}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-[140px]">
        {request.serviceType}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
          {formatStatusText(request.status)}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {formatRelativeTime(request.createdAt)}
      </td>
      {/* UPDATED: Replace dropdown menu with simple eye icon */}
      <td className="px-6 py-2 relative">
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(request);
            }}
            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
            title="View IVR Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
});

const IVRManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newReviewNote, setNewReviewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IVRStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IVRPriority | 'all'>('all');

  // Enhanced communication state
  const [attachmentFiles, setAttachmentFiles] = useState<Record<string, File[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Role checks
  const isIVRSpecialist = user?.role === 'IVR';
  const isDoctor = user?.role === 'Doctor';

  // Calculate stats from requests
  const stats: IVRStats = useMemo(() => {
    return {
      totalIVRs: requests.length,
      pendingReview: requests.filter(req => req.status === IVRStatus.SUBMITTED).length,
      approved: requests.filter(req => req.status === IVRStatus.APPROVED).length,
      rejected: requests.filter(req => req.status === IVRStatus.REJECTED).length
    };
  }, [requests]);



  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = !searchTerm ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${req.patient?.firstName} ${req.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.provider?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🚀 Loading IVR requests...');
        console.log('👤 Current user:', user);
        console.log('🩺 Is doctor:', isDoctor);
        console.log('📧 User email:', user?.email);

        const response = await mockIVRService.getQueue({ page: 1, size: 20 });

        console.log('📥 Raw response items:', response.items.length);
        console.log('📋 All IVR requests:', response.items.map(req => ({
          id: req.id,
          providerId: req.provider?.id,
          providerName: req.provider?.name,
          patientName: `${req.patient?.firstName} ${req.patient?.lastName}`
        })));

        // Filter requests based on role
        const filteredRequests = isDoctor
          ? response.items.filter(req => {
              const match = req.provider?.id === user?.email;
              console.log(`🔍 IVR ${req.id}: provider ${req.provider?.id} === user ${user?.email} = ${match}`);
              return match;
            })
          : response.items;

        console.log('✅ Filtered requests for doctor:', filteredRequests.length);
        setRequests(filteredRequests);
      } catch (err) {
        console.error('Failed to load IVR requests:', err);
        setError('Failed to load IVR requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [isDoctor, user?.email]);

  const handleUpdateStatus = async (id: string, newStatus: IVRStatus, note?: string) => {
    if (!isIVRSpecialist || !user) {
      toast.error('Only IVR specialists can update request status');
      return;
    }

    try {
      const updatedRequest = await mockIVRService.updateStatus(id, newStatus, user.email || 'unknown');

      // Add review note if provided
      if (note) {
        const userWithName: User = {
          id: user.email || 'unknown',
          email: user.email,
          role: user.role || 'Doctor',
          name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email
        };
        await mockIVRService.addReviewNote(id, note, userWithName, false);
      }

      setRequests(prev => prev.map(req =>
        req.id === updatedRequest.id ? updatedRequest : req
      ));
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
      setNewReviewNote('');
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update request status');
    }
  };

  // Enhanced message handling with file attachments
  const handleAddMessage = async (requestId: string) => {
    if ((!newMessage.trim() && !attachmentFiles[requestId]?.length) || !user) return;

    try {
      setUploadingFiles(prev => ({ ...prev, [requestId]: true }));

      const userWithName: User = {
        id: user.email || 'unknown',
        email: user.email,
        role: user.role || 'Doctor',
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email
      };

      // Simulate file upload and create attachments
      const attachments = attachmentFiles[requestId]?.map(file => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // In real app, this would be uploaded to server
        uploadedAt: new Date().toISOString()
      })) || [];

      // Create enhanced message with attachments
      const messageWithAttachments = {
        message: newMessage.trim() || (attachments.length > 0 ? `Shared ${attachments.length} file(s)` : ''),
        attachments
      };

      const updatedRequest = await mockIVRService.addCommunication(
        requestId,
        messageWithAttachments.message,
        userWithName,
        attachments
      );

      setRequests(prev => prev.map(req =>
        req.id === updatedRequest.id ? updatedRequest : req
      ));

      setNewMessage('');
      setAttachmentFiles(prev => ({ ...prev, [requestId]: [] }));
      toast.success('Message sent successfully');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleAddInternalNote = async (requestId: string) => {
    if (!newReviewNote.trim() || !user || !isIVRSpecialist) return;

    try {
      const userWithName: User = {
        id: user.email || 'unknown',
        email: user.email,
        role: user.role || 'Doctor',
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email
      };
      const updatedRequest = await mockIVRService.addReviewNote(requestId, newReviewNote, userWithName, true);
      setRequests(prev => prev.map(req =>
        req.id === updatedRequest.id ? updatedRequest : req
      ));
      setNewReviewNote('');
      toast.success('Review note added successfully');
    } catch (err) {
      console.error('Failed to add review note:', err);
      toast.error('Failed to add review note');
    }
  };

  // File attachment handlers
  const handleFileUpload = (requestId: string, file: File | null) => {
    if (file) {
      setAttachmentFiles(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), file]
      }));
    }
  };

  const handleRemoveAttachment = (requestId: string, fileIndex: number) => {
    setAttachmentFiles(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.filter((_, index) => index !== fileIndex) || []
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateNewRequest = () => {
    navigate('/doctor/patients/select');
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((request: IVRRequest) => {
    setExpandedRow(expandedRow === request.id ? null : request.id);
  }, [expandedRow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* UPDATED: Match patient page stats cards exactly */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total IVRs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalIVRs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingReview}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Info Banner */}
      {isDoctor && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-blue-800 text-sm">
              <span className="font-bold">Doctor View:</span> You can view the status of your submitted IVR requests here.
              To submit a new request, click the "Submit New IVR" button or select a patient from the patient list.
            </p>
            <button
              onClick={handleCreateNewRequest}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Submit New IVR
            </button>
          </div>
        </div>
      )}

      {/* UPDATED: Match patient page table styling exactly */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Search Header - Match patient page exactly */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">IVR Management</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search IVRs..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IVRStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value={IVRStatus.SUBMITTED}>Pending Review</option>
                <option value={IVRStatus.IN_REVIEW}>In Review</option>
                <option value={IVRStatus.APPROVED}>Approved</option>
                <option value={IVRStatus.REJECTED}>Rejected</option>
                <option value={IVRStatus.DRAFT}>Draft</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as IVRPriority | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Priority</option>
                <option value={IVRPriority.URGENT}>Urgent</option>
                <option value={IVRPriority.HIGH}>High</option>
                <option value={IVRPriority.MEDIUM}>Medium</option>
                <option value={IVRPriority.LOW}>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Density Table - Match patient page exactly */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVR ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => (
                <React.Fragment key={request.id}>
                  <IVRRow
                    request={request}
                    index={index}
                    onRowClick={handleRowClick}
                    isIVRSpecialist={isIVRSpecialist}
                    onUpdateStatus={handleUpdateStatus}
                    newReviewNote={newReviewNote}
                    navigate={navigate}
                  />

                  {/* Expanded Row Details */}
                  {expandedRow === request.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-6">
                          {/* Review Notes Section */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold mb-4">Review Notes</h4>
                            <div className="space-y-4 max-h-60 overflow-y-auto">
                              {request.reviewNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className={`p-4 rounded-lg ${note.isInternal ? 'bg-yellow-50' : 'bg-blue-50'}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">{note.author.name}</span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(note.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                                  {note.status && (
                                    <div className="mt-2">
                                      <span className={`
                                        px-2 py-1 text-xs font-semibold rounded-full
                                        ${note.status === IVRStatus.APPROVED ? 'bg-green-100 text-green-800' :
                                          note.status === IVRStatus.REJECTED ? 'bg-red-100 text-red-800' :
                                          'bg-blue-100 text-blue-800'}
                                      `}>
                                        Status: {note.status}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Add Review Note (IVR Specialist Only) */}
                            {isIVRSpecialist && (
                              <div className="mt-4">
                                <textarea
                                  value={newReviewNote}
                                  onChange={(e) => setNewReviewNote(e.target.value)}
                                  placeholder="Add a review note..."
                                  className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  rows={3}
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleAddInternalNote(request.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                  >
                                    Add Internal Note
                                  </button>
                                  {request.status === IVRStatus.SUBMITTED && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateStatus(request.id, IVRStatus.APPROVED, newReviewNote)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                      >
                                        Approve with Note
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(request.id, IVRStatus.REJECTED, newReviewNote)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                      >
                                        Reject with Note
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Communication Section */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold mb-4 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Communication Thread
                            </h4>

                            {/* Message Thread */}
                            <div className="space-y-4 max-h-80 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4">
                              {request.communication.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                              ) : (
                                request.communication.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${msg.author.role === 'IVRCompany' ? 'justify-start' : 'justify-end'}`}
                                  >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                                      msg.author.role === 'IVRCompany'
                                        ? 'bg-white border border-blue-200'
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                      {/* Message Header */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                            msg.author.role === 'IVRCompany'
                                              ? 'bg-blue-100 text-blue-600'
                                              : 'bg-blue-500 text-white'
                                          }`}>
                                            {msg.author.name.charAt(0).toUpperCase()}
                                          </div>
                                          <span className={`text-xs font-medium ${
                                            msg.author.role === 'IVRCompany' ? 'text-gray-700' : 'text-blue-100'
                                          }`}>
                                            {msg.author.name}
                                          </span>
                                        </div>
                                        <span className={`text-xs ${
                                          msg.author.role === 'IVRCompany' ? 'text-gray-500' : 'text-blue-200'
                                        }`}>
                                          {new Date(msg.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>

                                      {/* Message Content */}
                                      {msg.message && (
                                        <p className={`text-sm whitespace-pre-wrap ${
                                          msg.author.role === 'IVRCompany' ? 'text-gray-800' : 'text-white'
                                        }`}>
                                          {msg.message}
                                        </p>
                                      )}

                                      {/* File Attachments */}
                                      {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          {msg.attachments.map((attachment) => (
                                            <div
                                              key={attachment.id}
                                              className={`flex items-center space-x-2 p-2 rounded border ${
                                                msg.author.role === 'IVRCompany'
                                                  ? 'bg-gray-50 border-gray-200'
                                                  : 'bg-blue-500 border-blue-400'
                                              }`}
                                            >
                                              <div className={`p-1 rounded ${
                                                msg.author.role === 'IVRCompany' ? 'bg-gray-200' : 'bg-blue-400'
                                              }`}>
                                                {attachment.type.startsWith('image/') ? (
                                                  <svg className={`w-4 h-4 ${
                                                    msg.author.role === 'IVRCompany' ? 'text-gray-600' : 'text-white'
                                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                ) : (
                                                  <svg className={`w-4 h-4 ${
                                                    msg.author.role === 'IVRCompany' ? 'text-gray-600' : 'text-white'
                                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${
                                                  msg.author.role === 'IVRCompany' ? 'text-gray-800' : 'text-white'
                                                }`}>
                                                  {attachment.name}
                                                </p>
                                                <p className={`text-xs ${
                                                  msg.author.role === 'IVRCompany' ? 'text-gray-500' : 'text-blue-200'
                                                }`}>
                                                  {formatFileSize(attachment.size)}
                                                </p>
                                              </div>
                                              <button
                                                onClick={() => window.open(attachment.url, '_blank')}
                                                className={`p-1 rounded hover:bg-opacity-80 ${
                                                  msg.author.role === 'IVRCompany'
                                                    ? 'hover:bg-gray-300 text-gray-600'
                                                    : 'hover:bg-blue-400 text-white'
                                                }`}
                                                title="Download file"
                                              >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* File Upload Section */}
                            {attachmentFiles[request.id]?.length > 0 && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="text-sm font-medium text-blue-800 mb-2">Files to send:</h5>
                                <div className="space-y-2">
                                  {attachmentFiles[request.id].map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveAttachment(request.id, index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* File Upload Component */}
                            <div className="mb-4">
                              <UniversalFileUpload
                                label="Attach Files"
                                description="Upload documents, images, or other files to share"
                                value={null}
                                onChange={(file) => handleFileUpload(request.id, file)}
                                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']}
                                maxSizeMB={10}
                                showCamera={true}
                                className="border-dashed border-2 border-gray-300"
                              />
                            </div>

                            {/* Message Input */}
                            <div className="flex space-x-2">
                              <div className="flex-1">
                                <textarea
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder="Type your message..."
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  rows={3}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddMessage(request.id);
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleAddMessage(request.id)}
                                  disabled={uploadingFiles[request.id] || (!newMessage.trim() && !attachmentFiles[request.id]?.length)}
                                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                                >
                                  {uploadingFiles[request.id] ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                      </svg>
                                      <span>Send</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* UPDATED: Match patient page empty state exactly */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No IVRs found' : 'No IVRs yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No IVRs match your current filters. Try adjusting your search criteria.'
                  : 'IVR submissions will appear here once they are created.'
                }
              </p>
              {isDoctor && (
                <button
                  onClick={handleCreateNewRequest}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Submit New IVR
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IVRManagementPage;