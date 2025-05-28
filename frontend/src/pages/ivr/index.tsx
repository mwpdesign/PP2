import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IVRRequest, IVRQueueParams, IVRStatus, IVRPriority, User } from '../../types/ivr';
import { mockIVRService } from '../../services/mockIVRService';
import { useWebSocket, MessageType, ConnectionState } from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/shared/layout/PageHeader';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

const IVRQueue: React.FC = () => {
  const [requests, setRequests] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueParams, setQueueParams] = useState<IVRQueueParams>({
    page: 1,
    size: 20,
  });
  const [totalItems, setTotalItems] = useState(0);
  const { subscribe, connectionState, connect } = useWebSocket();
  const { isAuthenticated } = useAuth();

  // Load queue data
  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await mockIVRService.getQueue(queueParams);
      setRequests(response.items || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error('Failed to load queue:', error);
      toast.error('Failed to load IVR requests');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadQueue();
  }, [queueParams]);

  // Establish WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && connectionState === ConnectionState.DISCONNECTED) {
      connect();
    }
  }, [isAuthenticated, connectionState, connect]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      const unsubscribe = subscribe(MessageType.IVR_STATUS, (data: IVRRequest) => {
        setRequests((prev) =>
          prev.map((request) =>
            request.id === data.id ? { ...request, ...data } : request
          )
        );
      });

      return () => unsubscribe();
    }
  }, [subscribe, connectionState]);

  // Handle WebSocket connection state changes
  useEffect(() => {
    if (connectionState === ConnectionState.AUTHENTICATION_FAILED) {
      toast.error('WebSocket authentication failed. Real-time updates may be unavailable.');
    }
  }, [connectionState]);

  return (
    <div className="space-y-8">
      {/* Connection status indicator */}
      {connectionState !== ConnectionState.CONNECTED && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {connectionState === ConnectionState.CONNECTING ? 'Connecting to real-time updates...' :
                 connectionState === ConnectionState.RECONNECTING ? 'Reconnecting to real-time updates...' :
                 connectionState === ConnectionState.AUTHENTICATION_FAILED ? 'Authentication failed. Real-time updates unavailable.' :
                 'Disconnected from real-time updates.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No IVR requests found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-[#2C3E50] truncate">
                        {request.patient?.firstName} {request.patient?.lastName}
                      </p>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`
                          px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${request.status === IVRStatus.SUBMITTED ? 'bg-yellow-100 text-yellow-800' :
                            request.status === IVRStatus.APPROVED ? 'bg-green-100 text-green-800' :
                            request.status === IVRStatus.REJECTED ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {request.provider?.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {request.serviceType}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Priority: {request.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const IVRManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newReviewNote, setNewReviewNote] = useState('');

  // Role checks
  const isIVRSpecialist = user?.role === 'IVRCompany';
  const isDoctor = user?.role === 'Doctor';

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await mockIVRService.getQueue({ page: 1, size: 20 });
        
        // Filter requests based on role
        const filteredRequests = isDoctor
          ? response.items.filter(req => req.provider?.id === user?.id)
          : response.items;
          
        setRequests(filteredRequests);
      } catch (err) {
        console.error('Failed to load IVR requests:', err);
        setError('Failed to load IVR requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [isDoctor, user?.id]);

  const handleUpdateStatus = async (id: string, newStatus: IVRStatus, note?: string) => {
    if (!isIVRSpecialist || !user) {
      toast.error('Only IVR specialists can update request status');
      return;
    }

    try {
      const updatedRequest = await mockIVRService.updateStatus(id, newStatus, user.id);
      
      // Add review note if provided
      if (note) {
        const userWithName: User = {
          ...user,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
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

  const handleAddMessage = async (requestId: string) => {
    if (!newMessage.trim() || !user) return;

    try {
      const userWithName: User = {
        ...user,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
      };
      const updatedRequest = await mockIVRService.addCommunication(requestId, newMessage, userWithName);
      setRequests(prev => prev.map(req => 
        req.id === updatedRequest.id ? updatedRequest : req
      ));
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    }
  };

  const handleAddInternalNote = async (requestId: string) => {
    if (!newReviewNote.trim() || !user || !isIVRSpecialist) return;

    try {
      const userWithName: User = {
        ...user,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
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

  const handleCreateNewRequest = () => {
    navigate('/patients/select');
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">IVR Management</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">IVR Management</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">IVR Management</h1>
          <p className="text-gray-600 mt-1">
            {isDoctor ? 'View your submitted IVR requests' : 'Manage insurance verification requests'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isDoctor && (
            <button
              onClick={handleCreateNewRequest}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
            >
              Submit New IVR
            </button>
          )}
          <div className="text-sm text-gray-600">
            {isIVRSpecialist && `${requests.filter(r => r.status === IVRStatus.SUBMITTED).length} pending requests`}
            {isDoctor && `${requests.length} total requests`}
          </div>
        </div>
      </div>

      {isDoctor && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
          <p className="text-blue-800 text-sm">
            <span className="font-bold">Doctor View:</span> You can view the status of your submitted IVR requests here.
            To submit a new request, click the "Submit New IVR" button or select a patient from the patient list.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {isIVRSpecialist && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <React.Fragment key={request.id}>
                <tr 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === request.id ? null : request.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.patient?.firstName} {request.patient?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      DOB: {new Date(request.patient?.dateOfBirth || '').toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.provider?.name}</div>
                    <div className="text-sm text-gray-500">{request.provider?.speciality}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.serviceType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${request.priority === IVRPriority.URGENT ? 'bg-red-100 text-red-800' :
                        request.priority === IVRPriority.HIGH ? 'bg-orange-100 text-orange-800' :
                        request.priority === IVRPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${request.status === IVRStatus.APPROVED ? 'bg-green-100 text-green-800' :
                        request.status === IVRStatus.REJECTED ? 'bg-red-100 text-red-800' :
                        request.status === IVRStatus.IN_REVIEW ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {request.status}
                    </span>
                  </td>
                  {isIVRSpecialist && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === IVRStatus.SUBMITTED && (
                        <div className="space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(request.id, IVRStatus.APPROVED, newReviewNote);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(request.id, IVRStatus.REJECTED, newReviewNote);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status === IVRStatus.IN_REVIEW && (
                        <span className="text-blue-600">Under Review</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">
                        {expandedRow === request.id ? '▼' : '▶'}
                      </span>
                      <span className="text-sm text-gray-900">View Details</span>
                    </div>
                  </td>
                </tr>

                {expandedRow === request.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-6">
                        {/* Review Notes Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4">Review Notes</h4>
                          <div className="space-y-4 max-h-60 overflow-y-auto">
                            {request.reviewNotes.map((note) => (
                              <div 
                                key={note.id} 
                                className={`p-4 rounded-lg ${note.isInternal ? 'bg-yellow-50' : 'bg-[#2C3E50] bg-opacity-5'}`}
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
                                        'bg-[#2C3E50] bg-opacity-10 text-[#2C3E50]'}
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
                                className="w-full p-2 border rounded-lg focus:ring-[#2C3E50] focus:border-[#2C3E50]"
                                rows={3}
                              />
                              <div className="mt-2 flex justify-end space-x-2">
                                <button
                                  onClick={() => handleAddInternalNote(request.id)}
                                  className="px-4 py-2 bg-[#2C3E50] text-white rounded-lg hover:bg-[#375788]"
                                >
                                  Add Internal Note
                                </button>
                                {request.status === IVRStatus.SUBMITTED && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(request.id, IVRStatus.APPROVED, newReviewNote);
                                      }}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                      Approve with Note
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(request.id, IVRStatus.REJECTED, newReviewNote);
                                      }}
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

                        {/* Communication Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4">Communication</h4>
                          <div className="space-y-4 max-h-60 overflow-y-auto">
                            {request.communication.map((msg) => (
                              <div 
                                key={msg.id}
                                className={`p-4 rounded-lg ${
                                  msg.author.role === 'IVRCompany' ? 'bg-[#2C3E50] bg-opacity-5 ml-8' : 'bg-green-50 mr-8'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium">{msg.author.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* Add Message (Both Roles) */}
                          <div className="mt-4 flex space-x-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 p-2 border rounded-lg focus:ring-[#2C3E50] focus:border-[#2C3E50]"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddMessage(request.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddMessage(request.id)}
                              className="px-4 py-2 bg-[#2C3E50] text-white rounded-lg hover:bg-[#375788]"
                            >
                              Send
                            </button>
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
    </div>
  );
};

export default IVRManagementPage; 