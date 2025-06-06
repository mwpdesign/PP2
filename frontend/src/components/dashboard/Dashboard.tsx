import React, { useState } from 'react';
import {
  Home,
  Users,
  Clipboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  Calendar,
  Bell,
  Search,
  ChevronDown,
  Phone,
  Edit3,
  Eye,
  PlusCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronUp,
  Filter,
  LocalShipping,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { NewPatientForm } from '../patients/NewPatientForm';

interface NewPatientFormProps {
  onClose: () => void;
  onSave: (patientData: any) => void;
}

interface DashboardProps {
  email: string;
  onLogout: () => void;
}

interface NavItem {
  name: string;
  icon: React.ReactNode;
  description: string;
  path: string;
}

interface StatCard {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  color: string;
}

interface Patient {
  id: string;
  name: string;
  insuranceId: string;
  phone: string;
  lastVisit: Date;
  status: 'active' | 'inactive' | 'pending';
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: <Home className="w-5 h-5" />, description: 'Overview and analytics', path: '/dashboard' },
  { name: 'Patients', icon: <Users className="w-5 h-5" />, description: 'Patient management', path: '/patients' },
  { name: 'IVR Requests', icon: <Clipboard className="w-5 h-5" />, description: 'Voice response system', path: '/ivr' },
  { name: 'Orders', icon: <Package className="w-5 h-5" />, description: 'Order management', path: '/orders' },
  { name: 'Reports', icon: <BarChart3 className="w-5 h-5" />, description: 'Analytics & reporting', path: '/reports' },
  { name: 'Settings', icon: <Settings className="w-5 h-5" />, description: 'System settings', path: '/settings' },
];

const samplePatients: Patient[] = [
  {
    id: 'P1001',
    name: 'Sarah Johnson',
    insuranceId: 'INS-2024-001',
    phone: '(555) 123-4567',
    lastVisit: new Date(2024, 2, 15),
    status: 'active'
  },
  {
    id: 'P1002',
    name: 'Michael Chen',
    insuranceId: 'INS-2024-045',
    phone: '(555) 234-5678',
    lastVisit: new Date(2024, 2, 10),
    status: 'active'
  },
  {
    id: 'P1003',
    name: 'Emily Rodriguez',
    insuranceId: 'INS-2024-089',
    phone: '(555) 345-6789',
    lastVisit: new Date(2024, 1, 28),
    status: 'pending'
  },
  {
    id: 'P1004',
    name: 'David Williams',
    insuranceId: 'INS-2024-102',
    phone: '(555) 456-7890',
    lastVisit: new Date(2024, 2, 5),
    status: 'inactive'
  },
  {
    id: 'P1005',
    name: 'Maria Garcia',
    insuranceId: 'INS-2024-156',
    phone: '(555) 567-8901',
    lastVisit: new Date(2024, 2, 12),
    status: 'active'
  }
];

const stats: StatCard[] = [
  { title: 'IVR Requests Today', value: 47, trend: 12, icon: <Clipboard className="w-6 h-6" />, color: 'bg-blue-500' },
  { title: 'Pending Approvals', value: 28, trend: -5, icon: <Activity className="w-6 h-6" />, color: 'bg-green-500' },
  { title: 'Active Orders', value: 34, trend: 8, icon: <Package className="w-6 h-6" />, color: 'bg-purple-500' },
  { title: 'Temperature-Controlled Shipments', value: 12, trend: 0, icon: <LocalShipping className="w-6 h-6" />, color: 'bg-orange-500' },
];

const quickActions = [
  { name: 'New Patient Intake', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', description: 'Wound assessment with photos' },
  { name: 'Submit IVR Request', icon: <Clipboard className="w-5 h-5" />, color: 'bg-green-500', description: 'Insurance verification for wound products' },
  { name: 'Track Orders', icon: <Package className="w-5 h-5" />, color: 'bg-purple-500', description: 'Shipping and logistics status' },
  { name: 'Review IVR Queue', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-orange-500', description: 'Pending approvals for review' },
];

const ivrTrendData = [
  { day: 'Mon', submissions: 42, approvals: 38 },
  { day: 'Tue', submissions: 48, approvals: 45 },
  { day: 'Wed', submissions: 52, approvals: 48 },
  { day: 'Thu', submissions: 45, approvals: 42 },
  { day: 'Fri', submissions: 50, approvals: 47 },
  { day: 'Sat', submissions: 35, approvals: 32 },
  { day: 'Sun', submissions: 30, approvals: 28 },
];

const productApprovalData = [
  { name: 'Skin Grafts', approvalRate: 92 },
  { name: 'Wound Matrices', approvalRate: 88 },
  { name: 'Negative Pressure', approvalRate: 95 },
  { name: 'Collagen Dressings', approvalRate: 90 },
  { name: 'Compression', approvalRate: 94 },
];

const PatientManagement: React.FC = () => {
  const [sortField, setSortField] = useState<keyof Patient>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Patient['status'] | 'all'>('all');
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  const handleSort = (field: keyof Patient) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPatients = samplePatients
    .filter(patient =>
      (statusFilter === 'all' || patient.status === statusFilter) &&
      (patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       patient.insuranceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
       patient.phone.includes(searchTerm))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  const handleAddNewPatient = (patientData: any) => {
    console.log('New patient data:', patientData);
    setShowNewPatientForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Management</h1>
          <nav className="mt-2">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-[#4A6FA5]">Home</a></li>
              <ChevronRight className="w-4 h-4" />
              <li className="text-[#4A6FA5] font-medium">Patients</li>
            </ol>
          </nav>
        </div>
        <button
          onClick={() => setShowNewPatientForm(true)}
          className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg flex items-center hover:bg-[#3e5d8c] transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A6FA5] focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Patient['status'] | 'all')}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A6FA5] focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <button className="px-4 py-2 text-gray-600 rounded-lg border border-gray-300 flex items-center hover:bg-gray-50">
            <Filter className="w-5 h-5 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Insurance ID', 'Phone', 'Last Visit', 'Status', 'Actions'].map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <button
                    className="flex items-center space-x-1 hover:text-gray-700"
                    onClick={() => handleSort(header.toLowerCase().replace(' ', '') as keyof Patient)}
                  >
                    <span>{header}</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-500">ID: {patient.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.insuranceId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(patient.lastVisit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-3">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                <span className="font-medium">{filteredPatients.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showNewPatientForm && (
        <NewPatientForm
          onClose={() => setShowNewPatientForm(false)}
          onSave={handleAddNewPatient}
        />
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ email, onLogout }) => {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleNavigation = (path: string) => {
    setCurrentPath(path);
  };

  const handleAddNewPatient = (patientData: any) => {
    console.log('New patient data:', patientData);
    setShowNewPatientForm(false);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/patients':
        return <PatientManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome to Clear Health Pass
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with your patients and IVR requests today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                      {React.cloneElement(stat.icon as React.ReactElement, {
                        className: `w-6 h-6 ${stat.color.replace('bg-', 'text-')}`
                      })}
                    </div>
                    <p className="ml-3 text-sm font-medium text-gray-600">{stat.title}</p>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </h3>
                    <p className={`mt-1 text-sm ${
                      stat.trend > 0 ? 'text-green-600' : stat.trend < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.trend > 0 ? '↑' : stat.trend < 0 ? '↓' : '•'} {Math.abs(stat.trend)}% from last week
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => {
                      if (action.name === 'New Patient Intake') {
                        handleNavigation('/doctor/patients/intake');
                      } else if (action.name === 'Submit IVR Request') {
                        handleNavigation('/doctor/patients/select');
                      } else if (action.name === 'Track Orders') {
                        handleNavigation('/doctor/orders');
                      } else if (action.name === 'Review IVR Queue') {
                        handleNavigation('/doctor/ivr');
                      }
                    }}
                    className="flex flex-col p-4 rounded-lg border-2 border-gray-100 hover:border-[#4A6FA5] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${action.color} bg-opacity-10`}>
                        {React.cloneElement(action.icon as React.ReactElement, {
                          className: `w-5 h-5 ${action.color.replace('bg-', 'text-')}`
                        })}
                      </div>
                      <span className="ml-3 font-medium text-gray-900">{action.name}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-left pl-11">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Data Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">IVR Processing Trends</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ivrTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      label={{ value: 'Days of Week', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      domain={[0, 60]}
                      label={{ value: 'Number of IVRs', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#4A6FA5"
                      name="Daily IVR Submissions"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="approvals"
                      stroke="#10B981"
                      name="Daily IVR Approvals"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-lg bg-gray-50">
                  <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      IVR Submitted: Diabetic foot ulcer skin graft case #2847
                    </p>
                    <p className="text-sm text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50">
                  <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      Order Approved: Collagen matrix for burn patient #1923
                    </p>
                    <p className="text-sm text-gray-500">12 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50">
                  <div className="p-2 rounded-lg bg-purple-500 bg-opacity-10">
                    <Activity className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      Shipment Dispatched: Negative pressure therapy unit
                    </p>
                    <p className="text-sm text-gray-500">18 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50">
                  <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                    <Activity className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      IVR Under Review: Complex wound assessment case #4821
                    </p>
                    <p className="text-sm text-gray-500">25 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgent Items */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Urgent Items</h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-lg bg-red-50">
                  <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-900">
                        Skin Graft IVR Missing Clinical Photos
                      </p>
                      <span className="text-xs text-red-500">10 mins ago</span>
                    </div>
                    <p className="text-sm text-red-500">Critical Priority</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-orange-50">
                  <div className="p-2 rounded-lg bg-orange-500 bg-opacity-10">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-orange-900">
                        Advanced Wound Matrix Pre-Auth Denied
                      </p>
                      <span className="text-xs text-orange-500">25 mins ago</span>
                    </div>
                    <p className="text-sm text-orange-500">High Priority</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-yellow-50">
                  <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-yellow-900">
                        Temperature-Controlled Shipment Delayed
                      </p>
                      <span className="text-xs text-yellow-500">1 hour ago</span>
                    </div>
                    <p className="text-sm text-yellow-500">Medium Priority</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-yellow-50">
                  <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-yellow-900">
                        Negative Pressure Therapy Documentation Required
                      </p>
                      <span className="text-xs text-yellow-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-yellow-500">Medium Priority</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Approval Rates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Approval Rates</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productApprovalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="approvalRate"
                      fill="#4A6FA5"
                      name="Approval Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed w-[250px] h-full bg-[#1E293B] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <img
            src="/logo2.png"
            alt="Clear Health Pass"
            className="w-[180px] h-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                currentPath === item.path
                  ? 'bg-[#4A6FA5] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white font-medium">
              {getInitials(email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{email}</p>
              <button
                onClick={onLogout}
                className="text-sm text-gray-400 hover:text-white flex items-center mt-1"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[250px]">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center flex-1">
              <div className="w-64">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A6FA5] focus:border-transparent"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-[#4A6FA5] relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};