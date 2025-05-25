import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IVRRequest, IVRQueueParams, IVRStatus } from '../../types/ivr';
import ivrService from '../../services/ivrService';
import { useWebSocket, MessageType } from '../../services/websocket';
import PageHeader from '../../components/shared/layout/PageHeader';

const IVRManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueParams, setQueueParams] = useState<IVRQueueParams>({
    page: 1,
    size: 20,
  });
  const [totalItems, setTotalItems] = useState(0);
  const { subscribe } = useWebSocket();

  // Load queue data
  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await ivrService.getReviewQueue(queueParams);
      setRequests(response.items);
      setTotalItems(response.total);
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

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe(MessageType.STATUS_UPDATE, (data: IVRRequest) => {
      setRequests((prev) =>
        prev.map((request) =>
          request.id === data.id ? { ...request, ...data } : request
        )
      );
    });

    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div className="space-y-8 px-8 pt-6">
      <PageHeader 
        title="IVR Management"
        subtitle="Manage and track insurance verification requests"
      />

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
                        {request.patient.firstName} {request.patient.lastName}
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
                        {request.provider.name}
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

export default IVRManagementPage; 