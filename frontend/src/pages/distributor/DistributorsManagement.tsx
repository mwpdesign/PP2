import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  FolderIcon
} from '@heroicons/react/24/solid';
import { Card } from '../../components/shared/ui/Card';
import UniversalFileUpload from '../../components/shared/UniversalFileUpload';
import toast from 'react-hot-toast';

// Mock sales rep data for hierarchy display
const mockSalesReps = [
  { id: '1', firstName: 'John', lastName: 'Smith', territory: 'Northern California', phone: '(555) 123-4567', activeDoctors: 12 },
  { id: '2', firstName: 'Sarah', lastName: 'Johnson', territory: 'Dallas Metro', phone: '(555) 234-5678', activeDoctors: 18 },
  { id: '3', firstName: 'Michael', lastName: 'Chen', territory: 'Houston Area', phone: '(555) 345-6789', activeDoctors: 8 },
  { id: '4', firstName: 'Emily', lastName: 'Rodriguez', territory: 'Manhattan', phone: '(555) 456-7890', activeDoctors: 15 },
  { id: '5', firstName: 'David', lastName: 'Thompson', territory: 'Chicago', phone: '(555) 567-8901', activeDoctors: 3 }
];

interface DistributorDocument {
  id: string;
  name: string;
  category: 'VAA' | 'Contract' | 'Insurance Certificate' | 'Business License' | 'Tax Documents' | 'Other';
  uploadDate: string;
  size: number;
  url: string;
}

interface Distributor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  territory: string;
  activeSalesReps: number;
  totalDoctors: number;
  status: 'active' | 'inactive';
  taxId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  commissionRate: number;
  documents?: DistributorDocument[];
  joinedDate: string;
  lastActivity: string;
  monthlyRevenue: number;
  sales_reps?: string[]; // Array of sales rep IDs
}

// Mock data for distributors
const mockDistributors: Distributor[] = [
  {
    id: '1',
    companyName: 'MedSupply West Coast',
    contactPerson: 'Sarah Johnson',
    email: 'sarah.johnson@medsupplywest.com',
    phone: '(555) 123-4567',
    territory: 'California, Nevada',
    activeSalesReps: 8,
    totalDoctors: 45,
    status: 'active',
    taxId: '12-3456789',
    address: {
      street: '123 Medical Plaza Dr',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210'
    },
    commissionRate: 12.5,
    documents: [
      {
        id: '1',
        name: 'VAA_Agreement_2024.pdf',
        category: 'VAA',
        uploadDate: '2024-01-15',
        size: 2048000,
        url: '/documents/vaa_agreement_2024.pdf'
      },
      {
        id: '2',
        name: 'Business_License_CA.pdf',
        category: 'Business License',
        uploadDate: '2024-01-10',
        size: 1024000,
        url: '/documents/business_license_ca.pdf'
      }
    ],
    joinedDate: '2023-01-15',
    lastActivity: '2 hours ago',
    monthlyRevenue: 125000,
    sales_reps: ['1']
  },
  {
    id: '2',
    companyName: 'Regional Health Partners',
    contactPerson: 'Michael Chen',
    email: 'michael.chen@regionalhp.com',
    phone: '(555) 234-5678',
    territory: 'Texas, Oklahoma',
    activeSalesReps: 12,
    totalDoctors: 78,
    status: 'active',
    taxId: '23-4567890',
    address: {
      street: '456 Healthcare Blvd',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201'
    },
    commissionRate: 15.0,
    documents: [
      {
        id: '3',
        name: 'Contract_2024.pdf',
        category: 'Contract',
        uploadDate: '2024-01-15',
        size: 1536000,
        url: '/documents/contract_2024.pdf'
      },
      {
        id: '4',
        name: 'Insurance_Certificate_TX.pdf',
        category: 'Insurance Certificate',
        uploadDate: '2024-01-10',
        size: 512000,
        url: '/documents/insurance_certificate_tx.pdf'
      }
    ],
    joinedDate: '2022-08-20',
    lastActivity: '1 day ago',
    monthlyRevenue: 198000,
    sales_reps: ['2', '3']
  },
  {
    id: '3',
    companyName: 'Northeast Medical Solutions',
    contactPerson: 'Emily Rodriguez',
    email: 'emily.rodriguez@nemedicalsol.com',
    phone: '(555) 345-6789',
    territory: 'New York, New Jersey',
    activeSalesReps: 6,
    totalDoctors: 32,
    status: 'active',
    taxId: '34-5678901',
    address: {
      street: '789 Medical Center Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    commissionRate: 13.0,
    documents: [
      {
        id: '5',
        name: 'Tax_Documents_NY.pdf',
        category: 'Tax Documents',
        uploadDate: '2024-01-15',
        size: 1024000,
        url: '/documents/tax_documents_ny.pdf'
      },
      {
        id: '6',
        name: 'Other_Document_NY.pdf',
        category: 'Other',
        uploadDate: '2024-01-10',
        size: 256000,
        url: '/documents/other_document_ny.pdf'
      }
    ],
    joinedDate: '2023-03-10',
    lastActivity: '3 hours ago',
    monthlyRevenue: 87000,
    sales_reps: ['4']
  },
  {
    id: '4',
    companyName: 'Midwest Healthcare Distribution',
    contactPerson: 'David Thompson',
    email: 'david.thompson@midwesthcd.com',
    phone: '(555) 456-7890',
    territory: 'Illinois, Wisconsin',
    activeSalesReps: 5,
    totalDoctors: 28,
    status: 'inactive',
    taxId: '45-6789012',
    address: {
      street: '321 Distribution Way',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    },
    commissionRate: 11.0,
    documents: [
      {
        id: '7',
        name: 'Insurance_Certificate_IL.pdf',
        category: 'Insurance Certificate',
        uploadDate: '2024-01-15',
        size: 512000,
        url: '/documents/insurance_certificate_il.pdf'
      },
      {
        id: '8',
        name: 'Tax_Documents_IL.pdf',
        category: 'Tax Documents',
        uploadDate: '2024-01-10',
        size: 1024000,
        url: '/documents/tax_documents_il.pdf'
      }
    ],
    joinedDate: '2022-11-05',
    lastActivity: '2 weeks ago',
    monthlyRevenue: 0,
    sales_reps: ['5']
  },
  {
    id: '5',
    companyName: 'Southeast Medical Group',
    contactPerson: 'Lisa Williams',
    email: 'lisa.williams@semedgroup.com',
    phone: '(555) 567-8901',
    territory: 'Florida, Georgia',
    activeSalesReps: 9,
    totalDoctors: 56,
    status: 'active',
    taxId: '56-7890123',
    address: {
      street: '654 Medical Park Dr',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309'
    },
    commissionRate: 14.0,
    documents: [
      {
        id: '9',
        name: 'Business_License_GA.pdf',
        category: 'Business License',
        uploadDate: '2024-01-15',
        size: 1024000,
        url: '/documents/business_license_ga.pdf'
      },
      {
        id: '10',
        name: 'Contract_GA.pdf',
        category: 'Contract',
        uploadDate: '2024-01-10',
        size: 1536000,
        url: '/documents/contract_ga.pdf'
      }
    ],
    joinedDate: '2023-02-28',
    lastActivity: '5 hours ago',
    monthlyRevenue: 156000,
    sales_reps: []
  }
];

const DistributorsManagement: React.FC = () => {
  const [distributors, setDistributors] = useState<Distributor[]>(mockDistributors);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [formData, setFormData] = useState<Partial<Distributor>>({});

  // Document management state
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<DistributorDocument['category']>('VAA');
  const [uploadingDocument, setUploadingDocument] = useState<File | null>(null);
  const [distributorDocuments, setDistributorDocuments] = useState<DistributorDocument[]>([]);

  // Filter distributors based on search and status
  const filteredDistributors = distributors.filter(distributor => {
    const matchesSearch = distributor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || distributor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const totalDistributors = distributors.length;
  const activeDistributors = distributors.filter(d => d.status === 'active').length;
  const totalSalesReps = distributors.reduce((sum, d) => sum + d.activeSalesReps, 0);
  const totalDoctors = distributors.reduce((sum, d) => sum + d.totalDoctors, 0);

  const handleAddDistributor = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      territory: '',
      status: 'active',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      commissionRate: 12.0,
    });
    setShowAddModal(true);
  };

  const handleEditDistributor = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setFormData(distributor);
    setDistributorDocuments(distributor.documents || []);
    setShowEditModal(true);
  };

  const handleViewDetails = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setShowDetailModal(true);
  };

  const handleToggleStatus = (distributorId: string) => {
    setDistributors(prev => prev.map(d =>
      d.id === distributorId
        ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' }
        : d
    ));
    toast.success('Distributor status updated successfully');
  };

  const handleSaveDistributor = () => {
    if (selectedDistributor) {
      // Edit existing distributor
      setDistributors(prev => prev.map(d =>
        d.id === selectedDistributor.id
          ? { ...d, ...formData }
          : d
      ));
      toast.success('Distributor updated successfully');
      setShowEditModal(false);
    } else {
      // Add new distributor
      const newDistributor: Distributor = {
        ...formData as Distributor,
        id: Date.now().toString(),
        activeSalesReps: 0,
        totalDoctors: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        lastActivity: 'Just now',
        monthlyRevenue: 0
      };
      setDistributors(prev => [...prev, newDistributor]);
      toast.success('Distributor added successfully');
      setShowAddModal(false);
    }
    setSelectedDistributor(null);
    setFormData({});
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedDistributor(null);
    setFormData({});
    setDistributorDocuments([]);
    setUploadingDocument(null);
  };

  // Document management functions
  const handleDocumentUpload = (file: File | null) => {
    if (file) {
      const newDocument: DistributorDocument = {
        id: Date.now().toString(),
        name: file.name,
        category: selectedDocumentCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        size: file.size,
        url: URL.createObjectURL(file)
      };
      setDistributorDocuments(prev => [...prev, newDocument]);
      setUploadingDocument(null);
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDistributorDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Document deleted successfully');
  };

  const handleDownloadDocument = (document: DistributorDocument) => {
    // Simulate document download
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
    toast.success(`Downloading ${document.name}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Distributors Management</h1>
          <p className="text-slate-600 mt-1">Manage your distribution network and sub-distributors</p>
        </div>
        <button
          onClick={handleAddDistributor}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Distributor
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <BuildingOffice2Icon className="h-6 w-6 text-slate-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Distributors</p>
              <p className="text-2xl font-bold text-slate-900">{totalDistributors}</p>
              <p className="text-xs text-green-600">{activeDistributors} active</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Sales Reps</p>
              <p className="text-2xl font-bold text-slate-900">{totalSalesReps}</p>
              <p className="text-xs text-slate-500">Across all distributors</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Doctors</p>
              <p className="text-2xl font-bold text-slate-900">{totalDoctors}</p>
              <p className="text-xs text-slate-500">In network</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                ${distributors.reduce((sum, d) => sum + d.monthlyRevenue, 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600">+12.3% from last month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-6 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-slate-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Distributors Table */}
      <Card className="overflow-hidden bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Territory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sales Reps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Doctors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDistributors.map((distributor) => (
                <tr key={distributor.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{distributor.companyName}</div>
                      <div className="text-sm text-slate-500">Revenue: ${distributor.monthlyRevenue.toLocaleString()}/mo</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{distributor.contactPerson}</div>
                      <div className="text-sm text-slate-500">{distributor.email}</div>
                      <div className="text-sm text-slate-500">{distributor.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{distributor.territory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{distributor.activeSalesReps}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{distributor.totalDoctors}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      distributor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {distributor.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(distributor)}
                        className="text-slate-600 hover:text-slate-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditDistributor(distributor)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(distributor.id)}
                        className={distributor.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={distributor.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {distributor.status === 'active' ? (
                          <XCircleIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Distributor Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">
                {showAddModal ? 'Add New Distributor' : 'Edit Distributor'}
              </h3>
              <button
                onClick={closeModals}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commissionRate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Primary Contact */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Primary Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Territory</label>
                    <input
                      type="text"
                      value={formData.territory || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.address?.street || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.address?.city || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.address?.state || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.address?.zipCode || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Documents & Agreements */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Documents & Agreements</h4>

                {/* Document Upload Section */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Document Category</label>
                      <select
                        value={selectedDocumentCategory}
                        onChange={(e) => setSelectedDocumentCategory(e.target.value as DistributorDocument['category'])}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="VAA">VAA</option>
                        <option value="Contract">Contract</option>
                        <option value="Insurance Certificate">Insurance Certificate</option>
                        <option value="Business License">Business License</option>
                        <option value="Tax Documents">Tax Documents</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <UniversalFileUpload
                    label="Upload Document"
                    description={`Upload ${selectedDocumentCategory} document`}
                    value={uploadingDocument}
                    onChange={handleDocumentUpload}
                    acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                    maxSizeMB={10}
                    showCamera={true}
                    className="border border-slate-200"
                  />
                </div>

                {/* Document List */}
                {distributorDocuments.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-3">Uploaded Documents</h5>
                    <div className="space-y-2">
                      {distributorDocuments.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-3">
                            <FolderIcon className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{document.name}</p>
                              <p className="text-xs text-slate-500">
                                {document.category} • {formatFileSize(document.size)} • {new Date(document.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDownloadDocument(document)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(document.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDistributor}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                {showAddModal ? 'Add Distributor' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedDistributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Distributor Details</h3>
              <button
                onClick={closeModals}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Company Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{selectedDistributor.companyName}</p>
                        <p className="text-xs text-slate-500">Tax ID: {selectedDistributor.taxId}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{selectedDistributor.contactPerson}</p>
                        <p className="text-xs text-slate-500">Primary Contact</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <p className="text-sm text-slate-900">{selectedDistributor.email}</p>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <p className="text-sm text-slate-900">{selectedDistributor.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-900">{selectedDistributor.territory}</p>
                        <p className="text-xs text-slate-500">Territory Coverage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Active Sales Reps</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedDistributor.activeSalesReps}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total Doctors</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedDistributor.totalDoctors}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Monthly Revenue</span>
                        <span className="text-lg font-semibold text-green-600">${selectedDistributor.monthlyRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Commission Rate</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedDistributor.commissionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address and Banking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Address</h4>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-900">{selectedDistributor.address.street}</p>
                    <p className="text-sm text-slate-900">
                      {selectedDistributor.address.city}, {selectedDistributor.address.state} {selectedDistributor.address.zipCode}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Documents & Agreements</h4>
                  {selectedDistributor.documents && selectedDistributor.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDistributor.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-3">
                            <FolderIcon className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{document.name}</p>
                              <p className="text-xs text-slate-500">
                                {document.category} • {formatFileSize(document.size)} • {new Date(document.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <FolderIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No documents uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Sales Representatives */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-slate-900">Assigned Sales Representatives ({selectedDistributor.sales_reps?.length || 0})</h4>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                      Add Sales Rep
                    </button>
                  </div>
                </div>

                {selectedDistributor.sales_reps && selectedDistributor.sales_reps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDistributor.sales_reps.map((repId) => {
                      const salesRep = mockSalesReps.find(rep => rep.id === repId);
                      if (!salesRep) return null;

                      return (
                        <div key={repId} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-slate-100">
                                <UserIcon className="h-5 w-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {salesRep.firstName} {salesRep.lastName}
                                </p>
                                <p className="text-xs text-slate-500">{salesRep.territory}</p>
                                <p className="text-xs text-slate-500">{salesRep.phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">{salesRep.activeDoctors}</p>
                              <p className="text-xs text-slate-500">Doctors</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end space-x-2">
                            <button className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900">
                              View Details
                            </button>
                            <button className="px-2 py-1 text-xs text-red-600 hover:text-red-900">
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-lg text-center border border-slate-200">
                    <UsersIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No sales representatives assigned</p>
                    <button className="mt-2 px-3 py-1 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                      Add First Sales Rep
                    </button>
                  </div>
                )}
              </div>

              {/* Activity Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Activity Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Joined Date</p>
                    <p className="text-sm font-medium text-slate-900">{new Date(selectedDistributor.joinedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Last Activity</p>
                    <p className="text-sm font-medium text-slate-900">{selectedDistributor.lastActivity}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedDistributor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedDistributor.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  closeModals();
                  handleEditDistributor(selectedDistributor);
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Edit Distributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorsManagement;