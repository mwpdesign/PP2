import React from 'react';
import { Card } from '../../../components/shared/ui/Card';

interface Provider {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Pending';
  doctorCount: number;
  patientCount: number;
}

const mockProviders: Provider[] = [
  {
    id: 'P001',
    name: 'City General Hospital',
    type: 'Hospital',
    location: 'New York, NY',
    status: 'Active',
    doctorCount: 45,
    patientCount: 1200
  },
  {
    id: 'P002',
    name: 'Riverside Medical Center',
    type: 'Medical Center',
    location: 'Los Angeles, CA',
    status: 'Active',
    doctorCount: 32,
    patientCount: 850
  },
  {
    id: 'P003',
    name: 'Wellness Care Clinic',
    type: 'Clinic',
    location: 'Chicago, IL',
    status: 'Pending',
    doctorCount: 12,
    patientCount: 300
  },
  {
    id: 'P004',
    name: 'Health First Center',
    type: 'Medical Center',
    location: 'Houston, TX',
    status: 'Inactive',
    doctorCount: 28,
    patientCount: 720
  }
];

const ProviderNetwork: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Provider Network</h2>
          <p className="mt-1 text-sm text-gray-600">Manage healthcare providers and facilities</p>
        </div>
        <button className="bg-[#375788] text-white px-4 py-2 rounded-lg hover:bg-[#2C446D] transition-colors">
          Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Providers</h3>
            <div className="text-3xl font-bold text-[#375788]">127</div>
            <div className="text-sm text-gray-600">Active facilities</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Doctors</h3>
            <div className="text-3xl font-bold text-[#375788]">1,245</div>
            <div className="text-sm text-gray-600">Registered physicians</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Coverage</h3>
            <div className="text-3xl font-bold text-[#375788]">25,430</div>
            <div className="text-sm text-gray-600">Total patients</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockProviders.map((provider) => (
                <tr key={provider.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                    <div className="text-sm text-gray-500">ID: {provider.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${provider.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        provider.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {provider.doctorCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {provider.patientCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-[#375788] hover:text-[#2C446D] mr-3">Edit</button>
                    <button className="text-[#375788] hover:text-[#2C446D] mr-3">View</button>
                    <button className="text-red-600 hover:text-red-800">Disable</button>
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

export default ProviderNetwork; 