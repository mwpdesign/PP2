import React, { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const ProviderNetwork: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockProviders = [
    {
      id: 'PRV-001',
      name: 'Dr. Sarah Johnson',
      specialty: 'Wound Care',
      location: 'San Francisco, CA',
      status: 'active',
      patients: 124,
      rating: 4.8,
      lastActive: '2024-03-20'
    },
    {
      id: 'PRV-002',
      name: 'Dr. Michael Chen',
      specialty: 'Internal Medicine',
      location: 'Los Angeles, CA',
      status: 'pending',
      patients: 89,
      rating: 4.6,
      lastActive: '2024-03-19'
    },
    {
      id: 'PRV-003',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Wound Care',
      location: 'Chicago, IL',
      status: 'active',
      patients: 156,
      rating: 4.9,
      lastActive: '2024-03-20'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-slate-800">Provider Network</h1>
        <button className="flex items-center justify-center px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368] w-full md:w-auto">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Provider
        </button>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search providers..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          >
            <option value="all">All Providers</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 w-full sm:w-auto">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Provider</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Specialty</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Patients</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Active</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-600 font-medium text-sm">
                          {provider.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{provider.name}</div>
                        <div className="text-sm text-slate-500">{provider.id}</div>
                        <div className="md:hidden text-xs text-slate-500">
                          {provider.specialty} • {provider.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{provider.specialty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">{provider.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">{provider.patients}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center">
                      <span className="text-sm text-slate-900 font-medium">{provider.rating}</span>
                      <div className="ml-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`h-4 w-4 ${i < Math.floor(provider.rating) ? 'text-yellow-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(provider.status)}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{provider.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[#375788] hover:text-[#2a4368]">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
          Showing 3 of 3 providers
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Previous</button>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368]">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ProviderNetwork; 