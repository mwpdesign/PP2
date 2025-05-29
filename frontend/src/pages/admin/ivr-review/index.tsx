import React from 'react';
import { Card } from '../../../components/shared/ui/Card';

interface IVRRequest {
  id: string;
  patientName: string;
  doctorName: string;
  submittedAt: string;
  status: 'Pending' | 'In Review' | 'Approved' | 'Rejected';
  priority: 'High' | 'Medium' | 'Low';
  type: string;
}

const mockRequests: IVRRequest[] = [
  {
    id: 'IVR-2024-001',
    patientName: 'John Smith',
    doctorName: 'Dr. Sarah Johnson',
    submittedAt: '2024-03-20 09:30 AM',
    status: 'Pending',
    priority: 'High',
    type: 'Initial Assessment'
  },
  {
    id: 'IVR-2024-002',
    patientName: 'Maria Rodriguez',
    doctorName: 'Dr. David Chen',
    submittedAt: '2024-03-20 10:15 AM',
    status: 'In Review',
    priority: 'Medium',
    type: 'Follow-up'
  },
  {
    id: 'IVR-2024-003',
    patientName: 'Robert Wilson',
    doctorName: 'Dr. Sarah Johnson',
    submittedAt: '2024-03-20 11:00 AM',
    status: 'Pending',
    priority: 'Low',
    type: 'Follow-up'
  }
];

const IVRReviewQueue: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">IVR Review Queue</h2>
          <p className="mt-1 text-sm text-gray-600">Manage and review IVR verification requests</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-[#375788] text-white px-4 py-2 rounded-lg hover:bg-[#2C446D] transition-colors">
            Review Next
          </button>
          <button className="border border-[#375788] text-[#375788] px-4 py-2 rounded-lg hover:bg-[#375788] hover:text-white transition-colors">
            View All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Reviews</h3>
            <div className="text-3xl font-bold text-[#375788]">8</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
            <div className="text-3xl font-bold text-[#375788]">3</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Today</h3>
            <div className="text-3xl font-bold text-[#375788]">15</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#375788]">{request.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.doctorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${request.priority === 'High' ? 'bg-red-100 text-red-800' : 
                        request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        request.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{request.submittedAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-[#375788] hover:text-[#2C446D] mr-3">Review</button>
                    <button className="text-gray-600 hover:text-gray-800">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default IVRReviewQueue; 