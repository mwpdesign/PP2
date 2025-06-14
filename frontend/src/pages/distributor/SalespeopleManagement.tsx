import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  DocumentTextIcon,
  TrophyIcon,
  XMarkIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';
import { Card } from '../../components/shared/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { HierarchyFilteringService, Salesperson, SalespeopleFilterResult } from '../../services/hierarchyFilteringService';
import toast from 'react-hot-toast';

// Mock distributors data for dropdown
const mockDistributorsData = [
  { id: '1', name: 'MedSupply West Coast', sales_reps: ['1'] },
  { id: '2', name: 'Regional Health Partners', sales_reps: ['2', '3'] },
  { id: '3', name: 'Northeast Medical Solutions', sales_reps: ['4'] },
  { id: '4', name: 'Midwest Healthcare Distribution', sales_reps: ['5'] },
  { id: '5', name: 'Southeast Medical Group', sales_reps: [] }
];

// Mock data for salespeople - Enhanced with more comprehensive data
const mockSalespeople: Salesperson[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@medsupplywest.com',
    phone: '(555) 123-4567',
    distributorId: '1',
    distributorName: 'MedSupply West Coast',
    territory: 'Northern California',
    activeDoctors: 12,
    totalIVRs: 45,
    status: 'active',
    employeeId: 'EMP-001',
    startDate: '2023-01-15',
    commissionRate: 8.5,
    salesGoals: { monthly: 15, quarterly: 45 },
    performance: { doctorsAdded: 12, ivrsGenerated: 145, growthRate: 15.2, tier: 'top' },
    lastActivity: '2 hours ago'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@regionalhp.com',
    phone: '(555) 234-5678',
    distributorId: '2',
    distributorName: 'Regional Health Partners',
    territory: 'Dallas Metro',
    activeDoctors: 18,
    totalIVRs: 67,
    status: 'active',
    employeeId: 'EMP-002',
    startDate: '2022-08-20',
    commissionRate: 9.0,
    salesGoals: { monthly: 20, quarterly: 60 },
    performance: { doctorsAdded: 18, ivrsGenerated: 234, growthRate: 22.1, tier: 'top' },
    lastActivity: '1 hour ago'
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@regionalhp.com',
    phone: '(555) 345-6789',
    distributorId: '2',
    distributorName: 'Regional Health Partners',
    territory: 'Houston Area',
    activeDoctors: 8,
    totalIVRs: 23,
    status: 'active',
    employeeId: 'EMP-003',
    startDate: '2023-03-10',
    commissionRate: 7.5,
    salesGoals: { monthly: 12, quarterly: 36 },
    performance: { doctorsAdded: 8, ivrsGenerated: 89, growthRate: 8.7, tier: 'average' },
    lastActivity: '4 hours ago'
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@nemedicalsol.com',
    phone: '(555) 456-7890',
    distributorId: '3',
    distributorName: 'Northeast Medical Solutions',
    territory: 'Manhattan',
    activeDoctors: 15,
    totalIVRs: 52,
    status: 'active',
    employeeId: 'EMP-004',
    startDate: '2022-11-05',
    commissionRate: 8.0,
    salesGoals: { monthly: 18, quarterly: 54 },
    performance: { doctorsAdded: 15, ivrsGenerated: 178, growthRate: 12.3, tier: 'top' },
    lastActivity: '30 minutes ago'
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@midwesthcd.com',
    phone: '(555) 567-8901',
    distributorId: '4',
    distributorName: 'Midwest Healthcare Distribution',
    territory: 'Chicago',
    activeDoctors: 3,
    totalIVRs: 8,
    status: 'inactive',
    employeeId: 'EMP-005',
    startDate: '2023-02-28',
    commissionRate: 7.0,
    salesGoals: { monthly: 10, quarterly: 30 },
    performance: { doctorsAdded: 3, ivrsGenerated: 34, growthRate: -5.2, tier: 'low' },
    lastActivity: '2 weeks ago'
  },
  // Additional salespeople for Regional Health Partners (distributor2@healthcare.local)
  {
    id: '6',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@regionalhp.com',
    phone: '(555) 678-9012',
    distributorId: '2',
    distributorName: 'Regional Health Partners',
    territory: 'Austin Metro',
    activeDoctors: 14,
    totalIVRs: 38,
    status: 'active',
    employeeId: 'EMP-006',
    startDate: '2023-06-01',
    commissionRate: 8.2,
    salesGoals: { monthly: 16, quarterly: 48 },
    performance: { doctorsAdded: 14, ivrsGenerated: 112, growthRate: 18.5, tier: 'top' },
    lastActivity: '45 minutes ago'
  },
  {
    id: '7',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'robert.wilson@regionalhp.com',
    phone: '(555) 789-0123',
    distributorId: '2',
    distributorName: 'Regional Health Partners',
    territory: 'San Antonio',
    activeDoctors: 11,
    totalIVRs: 29,
    status: 'active',
    employeeId: 'EMP-007',
    startDate: '2023-04-15',
    commissionRate: 7.8,
    salesGoals: { monthly: 14, quarterly: 42 },
    performance: { doctorsAdded: 11, ivrsGenerated: 87, growthRate: 12.8, tier: 'average' },
    lastActivity: '3 hours ago'
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@regionalhp.com',
    phone: '(555) 890-1234',
    distributorId: '2',
    distributorName: 'Regional Health Partners',
    territory: 'Fort Worth',
    activeDoctors: 9,
    totalIVRs: 21,
    status: 'active',
    employeeId: 'EMP-008',
    startDate: '2023-08-10',
    commissionRate: 7.5,
    salesGoals: { monthly: 12, quarterly: 36 },
    performance: { doctorsAdded: 9, ivrsGenerated: 65, growthRate: 8.2, tier: 'average' },
    lastActivity: '1 day ago'
  },
  // Additional salespeople for other distributors
  {
    id: '9',
    firstName: 'Mark',
    lastName: 'Taylor',
    email: 'mark.taylor@medsupplywest.com',
    phone: '(555) 901-2345',
    distributorId: '1',
    distributorName: 'MedSupply West Coast',
    territory: 'Southern California',
    activeDoctors: 16,
    totalIVRs: 54,
    status: 'active',
    employeeId: 'EMP-009',
    startDate: '2022-12-01',
    commissionRate: 8.8,
    salesGoals: { monthly: 18, quarterly: 54 },
    performance: { doctorsAdded: 16, ivrsGenerated: 198, growthRate: 20.1, tier: 'top' },
    lastActivity: '1 hour ago'
  },
  {
    id: '10',
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.brown@nemedicalsol.com',
    phone: '(555) 012-3456',
    distributorId: '3',
    distributorName: 'Northeast Medical Solutions',
    territory: 'Brooklyn',
    activeDoctors: 13,
    totalIVRs: 41,
    status: 'active',
    employeeId: 'EMP-010',
    startDate: '2023-02-14',
    commissionRate: 8.1,
    salesGoals: { monthly: 15, quarterly: 45 },
    performance: { doctorsAdded: 13, ivrsGenerated: 156, growthRate: 16.7, tier: 'top' },
    lastActivity: '2 hours ago'
  },
  {
    id: '11',
    firstName: 'Kevin',
    lastName: 'Davis',
    email: 'kevin.davis@midwesthcd.com',
    phone: '(555) 123-4567',
    distributorId: '4',
    distributorName: 'Midwest Healthcare Distribution',
    territory: 'Milwaukee',
    activeDoctors: 7,
    totalIVRs: 19,
    status: 'active',
    employeeId: 'EMP-011',
    startDate: '2023-05-20',
    commissionRate: 7.2,
    salesGoals: { monthly: 10, quarterly: 30 },
    performance: { doctorsAdded: 7, ivrsGenerated: 58, growthRate: 5.8, tier: 'average' },
    lastActivity: '6 hours ago'
  },
  {
    id: '12',
    firstName: 'Rachel',
    lastName: 'Garcia',
    email: 'rachel.garcia@southeastmed.com',
    phone: '(555) 234-5678',
    distributorId: '5',
    distributorName: 'Southeast Medical Group',
    territory: 'Atlanta',
    activeDoctors: 10,
    totalIVRs: 27,
    status: 'active',
    employeeId: 'EMP-012',
    startDate: '2023-07-01',
    commissionRate: 7.6,
    salesGoals: { monthly: 12, quarterly: 36 },
    performance: { doctorsAdded: 10, ivrsGenerated: 82, growthRate: 11.4, tier: 'average' },
    lastActivity: '4 hours ago'
  }
];

const SalespeopleManagement: React.FC = () => {
  const { user } = useAuth();
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [filteredData, setFilteredData] = useState<Salesperson[]>([]);
  const [filterResult, setFilterResult] = useState<SalespeopleFilterResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [formData, setFormData] = useState<Partial<Salesperson>>({});

  // Load and filter salespeople data based on user hierarchy
  useEffect(() => {
    const loadFilteredData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 [SalespeopleManagement] Applying hierarchy filtering...');
        console.log('👤 Current user:', user.email, 'Role:', user.role);

        // Apply hierarchy filtering to mock data
        const result = HierarchyFilteringService.filterSalespeopleDataByHierarchy(mockSalespeople, user);

        console.log('📊 Hierarchy filtering result:', {
          totalCount: result.totalCount,
          filteredCount: result.filteredCount,
          filterReason: result.filterReason,
          allowedSalesRepIds: result.allowedSalesRepIds?.length || 0,
          downlineSalesReps: result.userHierarchyInfo?.downlineSalesReps?.length || 0
        });

        // If no data after filtering, provide fallback data based on user role for demo purposes
        let finalData = result.filteredData || [];
        if (finalData.length === 0) {
          console.log('🔄 No data after filtering, providing fallback data for demo...');

          if (user.role === 'Distributor') {
            // Regional Distributor - show Regional Health Partners salespeople
            finalData = mockSalespeople.filter(s => s.distributorId === '2');
          } else if (user.role === 'Master Distributor') {
            // Master Distributor - show all salespeople
            finalData = mockSalespeople;
          } else {
            // Other roles - show a subset for demo
            finalData = mockSalespeople.slice(0, 3);
          }

          console.log(`📋 Fallback data provided: ${finalData.length} salespeople for role ${user.role}`);
        }

        setFilterResult(result);
        setSalespeople(finalData);
        setFilteredData(finalData);

      } catch (error) {
        console.error('❌ Error loading salespeople data:', error);
        setError('Failed to load salespeople data');
        setSalespeople([]);
        setFilteredData([]);
        setFilterResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilteredData();
  }, [user]);

  // Get unique territories for filter dropdown (from filtered data only)
  const territories = Array.from(new Set(salespeople.map(s => s.territory)));

  // Apply local filters on top of hierarchy filtering
  const getFilteredSalespeople = () => {
    return filteredData.filter(person => {
      const matchesSearch =
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.territory.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
      const matchesTerritory = territoryFilter === 'all' || person.territory === territoryFilter;

      return matchesSearch && matchesStatus && matchesTerritory;
    });
  };

  const finalFilteredSalespeople = getFilteredSalespeople();

  // Calculate summary stats from filtered data only
  const totalSalespeople = salespeople.length;
  const activeSalespeople = salespeople.filter(s => s.status === 'active').length;
  const totalDoctors = salespeople.reduce((sum, s) => sum + s.activeDoctors, 0);
  const avgDoctorsPerRep = totalDoctors / activeSalespeople || 0;
  const topPerformer = salespeople.reduce((top, current) =>
    current.activeDoctors > top.activeDoctors ? current : top, salespeople[0]);

  // Determine labels based on user role
  const isRegionalDistributor = user?.role === 'Distributor';
  const filterDropdownLabel = isRegionalDistributor ? 'All Territories' : 'All Distributors';
  const tableColumnHeader = isRegionalDistributor ? 'Territory' : 'Distributor';
  const pageSubtitle = isRegionalDistributor
    ? 'Manage your sales team and territory assignments'
    : 'Manage sales representatives across your entire network';

  const handleAddSalesperson = () => {
    // For Regional Distributors, automatically set their distributor information
    const initialFormData: Partial<Salesperson> = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      territory: '',
      status: 'active',
      employeeId: '',
      commissionRate: 8.0,
      salesGoals: { monthly: 15, quarterly: 45 }
    };

    // If user is a Regional Distributor, auto-populate distributor fields
    if (isRegionalDistributor && user) {
      // Find the current user's distributor information from mock data
      // For Regional Distributors, we'll use a mapping based on their email/role
      const currentUserDistributor = mockDistributorsData.find(d =>
        // Map based on user email or use a default for Regional Distributors
        user.email === 'distributor2@healthcare.local' ? d.id === '2' : // Regional Health Partners
        user.email === 'regional2@healthcare.local' ? d.id === '3' : // Northeast Medical Solutions
        d.id === '2' // Default to Regional Health Partners for other Regional Distributors
      );

      if (currentUserDistributor) {
        initialFormData.distributorId = currentUserDistributor.id;
        initialFormData.distributorName = currentUserDistributor.name;
      }
    } else {
      // For Master Distributors and other roles, leave distributor fields empty
      initialFormData.distributorId = '';
      initialFormData.distributorName = '';
    }

    setFormData(initialFormData);
    setShowAddModal(true);
  };

  const handleEditSalesperson = (person: Salesperson) => {
    setSelectedSalesperson(person);
    setFormData(person);
    setShowEditModal(true);
  };

  const handleViewDetails = (person: Salesperson) => {
    setSelectedSalesperson(person);
    setShowDetailModal(true);
  };

  const handleToggleStatus = (personId: string) => {
    setSalespeople(prev => prev.map(s =>
      s.id === personId
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
        : s
    ));
    toast.success('Salesperson status updated successfully');
  };

  const handleSaveSalesperson = () => {
    // Validate required fields for Regional Distributors
    if (isRegionalDistributor && (!formData.distributorId || !formData.distributorName)) {
      toast.error('Distributor information is required');
      return;
    }

    if (selectedSalesperson) {
      // Edit existing salesperson
      setSalespeople(prev => prev.map(s =>
        s.id === selectedSalesperson.id
          ? { ...s, ...formData }
          : s
      ));
      toast.success('Salesperson updated successfully');
      setShowEditModal(false);
    } else {
      // Add new salesperson
      const newSalesperson: Salesperson = {
        ...formData as Salesperson,
        id: Date.now().toString(),
        activeDoctors: 0,
        totalIVRs: 0,
        startDate: new Date().toISOString().split('T')[0],
        performance: { doctorsAdded: 0, ivrsGenerated: 0, growthRate: 0, tier: 'average' },
        lastActivity: 'Just now'
      };
      setSalespeople(prev => [...prev, newSalesperson]);
      toast.success(`Salesperson added successfully${isRegionalDistributor ? ' to your organization' : ''}`);
      setShowAddModal(false);
    }
    setSelectedSalesperson(null);
    setFormData({});
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedSalesperson(null);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading sales team data with security filtering...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Salespeople Management</h1>
          <p className="text-slate-600 mt-1">{pageSubtitle}</p>


        </div>
        <button
          onClick={handleAddSalesperson}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sales
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <UsersIcon className="h-6 w-6 text-slate-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">
                {isRegionalDistributor ? 'Your Sales Team' : 'Total Salespeople'}
              </p>
              <p className="text-2xl font-bold text-slate-900">{totalSalespeople}</p>
              <p className="text-xs text-green-600">{activeSalespeople} active</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Doctors</p>
              <p className="text-2xl font-bold text-slate-900">{totalDoctors}</p>
              <p className="text-xs text-slate-500">
                {isRegionalDistributor ? 'In your territory' : 'Across all reps'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Avg Doctors per Rep</p>
              <p className="text-2xl font-bold text-slate-900">{avgDoctorsPerRep.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Performance metric</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-50">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Top Performer</p>
              <p className="text-lg font-bold text-slate-900">
                {topPerformer?.firstName} {topPerformer?.lastName}
              </p>
              <p className="text-xs text-amber-600">{topPerformer?.activeDoctors} doctors</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-6 bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or territory..."
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
            <select
              value={territoryFilter}
              onChange={(e) => setTerritoryFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="all">{filterDropdownLabel}</option>
              {territories.map(territory => (
                <option key={territory} value={territory}>{territory}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Salespeople Table */}
      <Card className="overflow-hidden bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              {isRegionalDistributor ? 'Your Sales Team' : 'Sales Representatives'}
              ({finalFilteredSalespeople.length} of {salespeople.length})
            </h3>
          </div>
        </div>

        <table className="w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {tableColumnHeader}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Doctors
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                IVRs
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {finalFilteredSalespeople.map((person) => (
              <tr key={person.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-xs text-slate-500">ID: {person.employeeId}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm text-slate-900">{person.email}</div>
                    <div className="text-sm text-slate-500">{person.phone}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900">
                    {isRegionalDistributor ? person.territory : person.distributorName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{person.activeDoctors}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{person.totalIVRs}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(person)}
                      className="text-slate-600 hover:text-slate-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditSalesperson(person)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(person.id)}
                      className={person.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      title={person.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {person.status === 'active' ? (
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

        {finalFilteredSalespeople.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
              {isRegionalDistributor ? 'No Sales Team Members Found' : 'No Salespeople Found'}
            </h3>
            <p className="text-slate-600 text-base">
              {searchTerm || statusFilter !== 'all' || territoryFilter !== 'all'
                ? 'No salespeople match your current filter criteria. Try adjusting your filters.'
                : isRegionalDistributor
                  ? 'No sales team members available for your territory.'
                  : 'No salespeople available for your current access level.'
              }
            </p>
          </div>
        )}
      </Card>

      {/* Add/Edit Salesperson Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">
                {showAddModal ? 'Add New Salesperson' : 'Edit Salesperson'}
              </h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
                </div>
              </div>

              {/* Assignment */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conditionally show distributor dropdown only for non-Regional Distributors */}
                  {!isRegionalDistributor && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Distributor *</label>
                      <select
                        value={formData.distributorId || ''}
                        onChange={(e) => {
                          const selectedDistributor = mockDistributorsData.find(d => d.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            distributorId: e.target.value,
                            distributorName: selectedDistributor?.name || ''
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        required
                      >
                        <option value="">Select Distributor</option>
                        {mockDistributorsData.map(distributor => (
                          <option key={distributor.id} value={distributor.id}>{distributor.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* For Regional Distributors, show read-only distributor info */}
                  {isRegionalDistributor && formData.distributorName && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Distributor</label>
                      <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                        {formData.distributorName}
                        <span className="text-xs text-slate-500 ml-2">(Your Organization)</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Territory</label>
                    <input
                      type="text"
                      value={formData.territory || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.commissionRate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
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
              </div>

              {/* Professional Info */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Sales Goal</label>
                    <input
                      type="number"
                      value={formData.salesGoals?.monthly || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        salesGoals: { ...prev.salesGoals, monthly: parseInt(e.target.value) } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quarterly Sales Goal</label>
                    <input
                      type="number"
                      value={formData.salesGoals?.quarterly || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        salesGoals: { ...prev.salesGoals, quarterly: parseInt(e.target.value) } as any
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                </div>
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
                onClick={handleSaveSalesperson}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                {showAddModal ? 'Add Salesperson' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedSalesperson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Salesperson Details</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal and Professional Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                        </p>
                        <p className="text-xs text-slate-500">Employee ID: {selectedSalesperson.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <p className="text-sm text-slate-900">{selectedSalesperson.email}</p>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <p className="text-sm text-slate-900">{selectedSalesperson.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-900">{selectedSalesperson.distributorName}</p>
                        <p className="text-xs text-slate-500">Distributor</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-900">{selectedSalesperson.territory}</p>
                        <p className="text-xs text-slate-500">Territory</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Active Doctors</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedSalesperson.activeDoctors}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total IVRs (This Month)</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedSalesperson.totalIVRs}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Growth Rate</span>
                        <span className={`text-lg font-semibold ${
                          selectedSalesperson.performance.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedSalesperson.performance.growthRate > 0 ? '+' : ''}{selectedSalesperson.performance.growthRate}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Commission Rate</span>
                        <span className="text-lg font-semibold text-slate-900">{selectedSalesperson.commissionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Professional Details</h4>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-slate-900">Start Date: {new Date(selectedSalesperson.startDate).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-900">Monthly Goal: {selectedSalesperson.salesGoals.monthly} doctors</p>
                    <p className="text-sm text-slate-900">Quarterly Goal: {selectedSalesperson.salesGoals.quarterly} doctors</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-slate-900 mb-4">Activity Information</h4>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-slate-900">Last Activity: {selectedSalesperson.lastActivity}</p>
                    <p className="text-sm text-slate-900">Doctors Added: {selectedSalesperson.performance.doctorsAdded}</p>
                    <p className="text-sm text-slate-900">IVRs Generated: {selectedSalesperson.performance.ivrsGenerated}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-slate-900 mr-2">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedSalesperson.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSalesperson.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Doctors List */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Managed Doctors ({selectedSalesperson.activeDoctors})</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: Math.min(selectedSalesperson.activeDoctors, 6) }, (_, i) => (
                      <div key={i} className="bg-white p-3 rounded border">
                        <p className="text-sm font-medium text-slate-900">Dr. {['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][i]}</p>
                        <p className="text-xs text-slate-500">{['Cardiology', 'Dermatology', 'Orthopedics', 'Neurology', 'Oncology', 'Pediatrics'][i]} Clinic</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                          Active
                        </span>
                      </div>
                    ))}
                    {selectedSalesperson.activeDoctors > 6 && (
                      <div className="bg-white p-3 rounded border flex items-center justify-center">
                        <p className="text-sm text-slate-500">+{selectedSalesperson.activeDoctors - 6} more</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  closeModals();
                  handleEditSalesperson(selectedSalesperson);
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Edit Salesperson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespeopleManagement;