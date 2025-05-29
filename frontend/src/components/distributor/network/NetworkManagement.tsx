import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';
import { ChevronRightIcon, ChevronDownIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface NetworkUser {
  id: string;
  name: string;
  email: string;
  role: 'distributor' | 'salesperson' | 'doctor';
  status: 'active' | 'inactive';
  territory?: string;
  parentId?: string;
  children?: NetworkUser[];
}

// Mock hierarchical data
const mockNetworkData: NetworkUser[] = [
  {
    id: '1',
    name: 'Regional Distributor - East',
    email: 'east@distributor.com',
    role: 'distributor',
    status: 'active',
    territory: 'East Coast',
    children: [
      {
        id: '2',
        name: 'John Smith',
        email: 'john.smith@sales.com',
        role: 'salesperson',
        status: 'active',
        territory: 'NY/NJ',
        parentId: '1',
        children: [
          {
            id: '3',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@hospital.com',
            role: 'doctor',
            status: 'active',
            territory: 'Manhattan Hospital',
            parentId: '2'
          },
          {
            id: '4',
            name: 'Dr. Michael Chen',
            email: 'michael.chen@clinic.com',
            role: 'doctor',
            status: 'active',
            territory: 'Brooklyn Clinic',
            parentId: '2'
          }
        ]
      },
      {
        id: '5',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@sales.com',
        role: 'salesperson',
        status: 'active',
        territory: 'CT/MA',
        parentId: '1',
        children: [
          {
            id: '6',
            name: 'Dr. David Williams',
            email: 'david.williams@medical.com',
            role: 'doctor',
            status: 'active',
            territory: 'Boston Medical',
            parentId: '5'
          }
        ]
      }
    ]
  },
  {
    id: '7',
    name: 'Regional Distributor - West',
    email: 'west@distributor.com',
    role: 'distributor',
    status: 'active',
    territory: 'West Coast',
    children: [
      {
        id: '8',
        name: 'Maria Garcia',
        email: 'maria.garcia@sales.com',
        role: 'salesperson',
        status: 'active',
        territory: 'CA/NV',
        parentId: '7',
        children: [
          {
            id: '9',
            name: 'Dr. James Wilson',
            email: 'james.wilson@hospital.com',
            role: 'doctor',
            status: 'active',
            territory: 'LA General',
            parentId: '8'
          }
        ]
      }
    ]
  }
];

const NetworkManagement: React.FC = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '7']));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<NetworkUser | null>(null);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      distributor: 'bg-blue-100 text-blue-800',
      salesperson: 'bg-purple-100 text-purple-800',
      doctor: 'bg-orange-100 text-orange-800'
    };
    
    return `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles[role as keyof typeof roleStyles]}`;
  };

  const renderNode = (node: NetworkUser, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = level * 24;

    return (
      <div key={node.id}>
        <div 
          className="flex items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {node.name}
                </div>
                <span className={getRoleBadge(node.role)}>
                  {node.role.charAt(0).toUpperCase() + node.role.slice(1)}
                </span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(node.status)}`}>
                  {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-500 truncate">
                {node.email} • {node.territory}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedParent(node);
                setShowAddModal(true);
              }}
              className="text-[#375788] hover:text-[#247297] font-medium border border-[#375788] hover:border-[#247297] px-2 py-1 rounded text-xs bg-white"
            >
              <UserPlusIcon className="h-3 w-3 inline mr-1" />
              Add User
            </button>
            <button className="text-[#375788] hover:text-[#247297] font-medium border border-[#375788] hover:border-[#247297] px-2 py-1 rounded text-xs bg-white">
              Edit
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Network Management</h1>
          <p className="text-gray-500 mt-1">Manage your distributor network hierarchy</p>
        </div>
        <button
          onClick={() => {
            setSelectedParent(null);
            setShowAddModal(true);
          }}
          className="text-[#375788] hover:text-[#247297] font-medium border border-[#375788] hover:border-[#247297] px-4 py-2 rounded-md bg-white flex items-center"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add Distributor
        </button>
      </div>

      {/* Network Tree */}
      <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-900">Network Hierarchy</h3>
          <p className="mt-1 text-sm text-gray-500">
            Hierarchical view of your distribution network
          </p>
        </div>
        <div className="bg-white">
          {mockNetworkData.map((node) => renderNode(node))}
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Distributors</p>
              <p className="text-2xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Salespeople</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Doctors</p>
              <p className="text-2xl font-semibold text-gray-900">4</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New {selectedParent ? 'User' : 'Distributor'}
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#375788] focus:border-[#375788]"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#375788] focus:border-[#375788]"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#375788] focus:border-[#375788]">
                    {!selectedParent && <option value="distributor">Distributor</option>}
                    {selectedParent?.role === 'distributor' && <option value="salesperson">Salesperson</option>}
                    {selectedParent?.role === 'salesperson' && <option value="doctor">Doctor</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Territory</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#375788] focus:border-[#375788]"
                    placeholder="Enter territory or location"
                  />
                </div>
              </form>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 font-medium border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-md bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white bg-[#375788] hover:bg-[#247297] font-medium px-4 py-2 rounded-md"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkManagement; 