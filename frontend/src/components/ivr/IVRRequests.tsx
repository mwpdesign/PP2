import React, { useState } from 'react';
import { useWebSocket, MessageType, ConnectionState } from '../../services/websocket';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface IVRRequest {
  id: string;
  patientName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

const statusClasses = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

const priorityClasses = {
  low: 'text-green-700',
  medium: 'text-yellow-700',
  high: 'text-red-700'
};

const ConnectionStatus: React.FC<{ state: ConnectionState }> = ({ state }) => {
  const statusConfig = {
    [ConnectionState.CONNECTED]: {
      label: 'Connected',
      className: 'text-green-700 bg-green-50',
      icon: <SignalIcon className="w-4 h-4" />
    },
    [ConnectionState.CONNECTING]: {
      label: 'Connecting',
      className: 'text-blue-700 bg-blue-50',
      icon: <SignalIcon className="w-4 h-4 animate-pulse" />
    },
    [ConnectionState.DISCONNECTED]: {
      label: 'Disconnected',
      className: 'text-yellow-700 bg-yellow-50',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />
    },
    [ConnectionState.RECONNECTING]: {
      label: 'Reconnecting',
      className: 'text-blue-700 bg-blue-50',
      icon: <SignalIcon className="w-4 h-4 animate-pulse" />
    },
    [ConnectionState.AUTHENTICATION_FAILED]: {
      label: 'Auth Failed',
      className: 'text-red-700 bg-red-50',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />
    }
  };

  const config = statusConfig[state];

  return (
    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.icon}
      <span className="ml-1.5">{config.label}</span>
    </div>
  );
};

const IVRRequests: React.FC = () => {
  const [requests, setRequests] = useState<IVRRequest[]>([
    {
      id: '1',
      patientName: 'John Doe',
      status: 'completed',
      type: 'Follow-up',
      createdAt: '2024-05-22T10:30:00Z',
      priority: 'medium'
    },
    // Add more mock data as needed
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { connectionState, subscribe } = useWebSocket();

  React.useEffect(() => {
    const unsubscribe = subscribe(MessageType.IVR_STATUS, (data) => {
      setRequests(prevRequests => {
        const index = prevRequests.findIndex(r => r.id === data.id);
        if (index === -1) return [...prevRequests, data];
        const newRequests = [...prevRequests];
        newRequests[index] = { ...newRequests[index], ...data };
        return newRequests;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const filteredRequests = requests.filter(request =>
    request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoading = connectionState === ConnectionState.CONNECTING || 
                   connectionState === ConnectionState.RECONNECTING;

  return (
    <div className="p-6">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">IVR Requests</h1>
            <p className="page-description">
              Manage and monitor all IVR call requests in the system
            </p>
          </div>
          <ConnectionStatus state={connectionState} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          </div>
        </div>
        <button className="btn btn-secondary flex items-center">
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-neutral-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-200 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 bg-neutral-200 rounded w-24"></div>
                  </td>
                </tr>
              ))
            ) : (
              paginatedRequests.map((request) => (
                <tr key={request.id} className="hover:bg-neutral-50">
                  <td>{request.patientName}</td>
                  <td>{request.type}</td>
                  <td>
                    <span className={`status-badge ${statusClasses[request.status]}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`font-medium ${priorityClasses[request.priority]}`}>
                      {request.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-neutral-100 rounded-full">
                        <EyeIcon className="w-5 h-5 text-neutral-600" />
                      </button>
                      <button className="p-1 hover:bg-neutral-100 rounded-full">
                        <PencilIcon className="w-5 h-5 text-neutral-600" />
                      </button>
                      <button className="p-1 hover:bg-neutral-100 rounded-full">
                        <TrashIcon className="w-5 h-5 text-neutral-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-neutral-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVRRequests; 