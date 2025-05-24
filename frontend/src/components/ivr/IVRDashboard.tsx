import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  IVRRequest,
  IVRStatus,
  IVRPriority,
  IVRQueueParams,
} from '../../types/ivr';
import ivrService from '../../services/ivrService';
import { websocketService, MessageType } from '../../services/websocket';

interface DashboardStats {
  total: number;
  byStatus: Record<IVRStatus, number>;
  byPriority: Record<IVRPriority, number>;
  pendingReview: number;
  pendingApproval: number;
  escalated: number;
}

const IVRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    byStatus: {} as Record<IVRStatus, number>,
    byPriority: {} as Record<IVRPriority, number>,
    pendingReview: 0,
    pendingApproval: 0,
    escalated: 0,
  });
  const [recentRequests, setRecentRequests] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Load statistics
        const statsResponse = await fetch('/api/ivr/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Load recent requests
        const queueParams: IVRQueueParams = {
          page: 1,
          size: 5,
        };
        const recentResponse = await ivrService.getReviewQueue(queueParams);
        setRecentRequests(recentResponse.items);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = websocketService.subscribe(MessageType.DASHBOARD_UPDATE, (data: any) => {
      setStats((prev) => ({ ...prev, ...data }));
    });

    return () => unsubscribe();
  }, []);

  // Quick action handlers
  const handleNewRequest = () => {
    navigate('/ivr/new');
  };

  const handleViewQueue = (status?: IVRStatus) => {
    navigate('/ivr/queue', { state: { status } });
  };

  const handleViewRequest = (id: string) => {
    navigate(`/ivr/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleNewRequest}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <div className="text-lg font-semibold">New IVR Request</div>
          <div className="text-sm opacity-80">Create a new request</div>
        </button>
        <button
          onClick={() => handleViewQueue(IVRStatus.PENDING_APPROVAL)}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <div className="text-lg font-semibold">Pending Approval</div>
          <div className="text-sm opacity-80">
            {stats.pendingApproval} requests waiting
          </div>
        </button>
        <button
          onClick={() => handleViewQueue(IVRStatus.ESCALATED)}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <div className="text-lg font-semibold">Escalated</div>
          <div className="text-sm opacity-80">{stats.escalated} requests</div>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Total Requests</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Pending Review</div>
          <div className="text-2xl font-bold">{stats.pendingReview}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Approved Today</div>
          <div className="text-2xl font-bold">
            {stats.byStatus[IVRStatus.APPROVED] || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">High Priority</div>
          <div className="text-2xl font-bold">
            {stats.byPriority[IVRPriority.HIGH] || 0}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
        <div className="flex space-x-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex-1 bg-gray-100 rounded-lg p-3 text-center"
            >
              <div className="text-sm text-gray-500">{status}</div>
              <div className="text-lg font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Requests</h3>
          <button
            onClick={() => handleViewQueue()}
            className="text-blue-500 hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Patient</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Priority</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id} className="border-b">
                  <td className="py-2">{request.id}</td>
                  <td className="py-2">{request.patient?.name}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        request.status === IVRStatus.APPROVED
                          ? 'bg-green-100 text-green-800'
                          : request.status === IVRStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        request.priority === IVRPriority.HIGH
                          ? 'bg-red-100 text-red-800'
                          : request.priority === IVRPriority.MEDIUM
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {request.priority}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleViewRequest(request.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IVRDashboard; 