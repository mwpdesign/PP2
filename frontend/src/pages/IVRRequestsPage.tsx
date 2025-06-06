import React, { useState } from 'react';
import { BatchProcessor } from '../components/speed-tools/BatchProcessor';

interface IVRRequest {
  id: string;
  patientName: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Completed' | 'Escalated';
  timestamp: string;
  phoneNumber: string;
  notes?: string;
}

const IVRRequestsPage: React.FC = () => {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);

  const requests: IVRRequest[] = [
    {
      id: 'IVR-001',
      patientName: 'John Smith',
      type: 'Prescription Renewal',
      priority: 'High',
      status: 'New',
      timestamp: '2024-03-20 09:30 AM',
      phoneNumber: '(555) 123-4567'
    },
    {
      id: 'IVR-002',
      patientName: 'Sarah Johnson',
      type: 'Appointment Scheduling',
      priority: 'Medium',
      status: 'In Progress',
      timestamp: '2024-03-20 09:15 AM',
      phoneNumber: '(555) 234-5678'
    },
    {
      id: 'IVR-003',
      patientName: 'Michael Brown',
      type: 'Medical Question',
      priority: 'Low',
      status: 'Completed',
      timestamp: '2024-03-20 09:00 AM',
      phoneNumber: '(555) 345-6789'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wound Care Management</h1>
            <p className="text-gray-600 mt-1">Track and manage patient wound care requests</p>
          </div>
          <button
            onClick={() => setShowNewRequest(true)}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
          >
            New Care Request
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: 'New Requests', value: '12', color: 'blue' },
            { label: 'In Treatment', value: '8', color: 'yellow' },
            { label: 'Completed Today', value: '45', color: 'green' },
            { label: 'Needs Review', value: '3', color: 'red' }
          ].map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className={`text-2xl font-bold mt-1 ${
                stat.color === 'blue' ? 'text-brand-primary' :
                stat.color === 'yellow' ? 'text-yellow-600' :
                stat.color === 'green' ? 'text-green-600' :
                'text-red-600'
              }`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Batch Actions */}
        <div className="mt-6 flex justify-between items-center">
          <div className="flex gap-4">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          {/* Batch Actions */}
          {selectedRequests.length > 0 && (
            <div className="flex gap-2">
              <span className="text-sm text-gray-600 self-center">
                {selectedRequests.length} selected
              </span>
              <button
                onClick={() => setShowBatchProcessor(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Batch Process ({selectedRequests.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Request Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === requests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(requests.map(r => r.id));
                      } else {
                        setSelectedRequests([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Request ID</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Patient</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(prev => [...prev, request.id]);
                        } else {
                          setSelectedRequests(prev => prev.filter(id => id !== request.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">{request.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{request.patientName}</div>
                    <div className="text-gray-500 text-sm">{request.phoneNumber}</div>
                  </td>
                  <td className="py-3 px-4">{request.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      request.priority === 'High' ? 'bg-red-100 text-red-800' :
                      request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      request.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{request.timestamp}</td>
                  <td className="py-3 px-4">
                    <button className="text-[#2E86AB] hover:text-[#247297] font-medium">
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">New IVR Request</h2>
              <button
                onClick={() => setShowNewRequest(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
                  <option value="">Select Type</option>
                  <option value="prescription">Prescription Renewal</option>
                  <option value="appointment">Appointment Scheduling</option>
                  <option value="question">Medical Question</option>
                  <option value="results">Test Results</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRequest(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297]"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Processor Modal */}
      {showBatchProcessor && (
        <BatchProcessor
          selectedItems={selectedRequests.map(id => {
            const request = requests.find(r => r.id === id);
            return {
              id,
              type: 'ivr_request',
              title: `${request?.patientName} - ${request?.type}`,
              status: request?.status || 'New',
              priority: request?.priority || 'Medium',
              metadata: {
                patientName: request?.patientName,
                phoneNumber: request?.phoneNumber,
                timestamp: request?.timestamp
              }
            };
          })}
          onClose={() => setShowBatchProcessor(false)}
          onComplete={(results) => {
            console.log('Batch processing completed:', results);
            setSelectedRequests([]);
            setShowBatchProcessor(false);
            // TODO: Refresh the requests list
          }}
          availableActions={[
            { id: 'approve', label: 'Approve All', icon: '✓', color: 'green' },
            { id: 'reject', label: 'Reject All', icon: '✗', color: 'red' },
            { id: 'escalate', label: 'Escalate All', icon: '⬆', color: 'yellow' },
            { id: 'assign', label: 'Assign to User', icon: '👤', color: 'blue' },
            { id: 'priority', label: 'Change Priority', icon: '!', color: 'orange' }
          ]}
        />
      )}
    </div>
  );
};

export default IVRRequestsPage;