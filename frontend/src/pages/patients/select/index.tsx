import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../../types/ivr';

interface QuickStats {
  totalPatients: number;
  pendingIVRs: number;
  activeOrders: number;
}

// Memoized patient row component for performance
const PatientRow = React.memo(({
  patient,
  index,
  onRowClick,
  onSubmitIVR,
  openMenuId,
  setOpenMenuId,
  navigate
}: {
  patient: Patient;
  index: number;
  onRowClick: (patient: Patient) => void;
  onSubmitIVR: (patientId: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  navigate: (path: string) => void;
}) => {

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    return `${Math.ceil(diffDays / 30)}mo ago`;
  };

  const getInsuranceAbbreviation = (insurance: string) => {
    const abbrevMap: Record<string, string> = {
      'Blue Cross Blue Shield': 'BCBS',
      'UnitedHealthcare': 'UHC',
      'Aetna': 'AET',
      'Cigna': 'CIG',
      'Humana': 'HUM',
      'Medicare': 'MED'
    };
    return abbrevMap[insurance] || insurance.substring(0, 4).toUpperCase();
  };

  return (
            <tr
      className={`group h-12 cursor-pointer transition-colors hover:bg-slate-100 ${
        index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
      }`}
      onClick={() => onRowClick(patient)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick(patient);
      }}
    >
      <td className="px-4 py-3">
        <div
          className={`w-2 h-2 rounded-full ${
            patient.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">
        {patient.name}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getInsuranceAbbreviation(patient.insurance)}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {formatRelativeTime(patient.lastVisit)}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-[150px]">
        {patient.condition}
      </td>
      <td className="px-6 py-2 relative">
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === patient.id ? null : patient.id);
            }}
            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
          >
            •••
          </button>
          {openMenuId === patient.id && (
            <div className={`absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px] ${
              index >= 2 ? 'bottom-8' : 'top-8'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/doctor/patients/${patient.id}`);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/doctor/ivr/submit/${patient.id}`);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-emerald-600"
              >
                Submit IVR
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<Patient[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  const [patients] = useState<Patient[]>([
    {
      id: 'P-1234',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1980-05-15',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      primaryCondition: 'Chronic wound care',
      lastVisitDate: '2024-03-15',
      insuranceInfo: {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS123456',
        groupNumber: 'GRP001',
        status: 'active'
      }
    },
    {
      id: 'P-1235',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: '1992-08-21',
      email: 'sarah@example.com',
      phone: '(555) 234-5678',
      address: '456 Oak Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02102',
      primaryCondition: 'Post-surgical wound',
      lastVisitDate: '2024-03-14',
      insuranceInfo: {
        provider: 'UnitedHealthcare',
        policyNumber: 'UHC789012',
        groupNumber: 'GRP002',
        status: 'active'
      }
    },
    {
      id: 'P-1236',
      firstName: 'Michael',
      lastName: 'Brown',
      dateOfBirth: '1975-12-03',
      email: 'michael@example.com',
      phone: '(555) 345-6789',
      address: '789 Pine St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02103',
      primaryCondition: 'Diabetic ulcer',
      lastVisitDate: '2024-03-10',
      insuranceInfo: {
        provider: 'Aetna',
        policyNumber: 'AET345678',
        groupNumber: 'GRP003',
        status: 'active'
      }
    },
    {
      id: 'P-1237',
      firstName: 'Emily',
      lastName: 'Davis',
      dateOfBirth: '1988-03-30',
      email: 'emily@example.com',
      phone: '(555) 456-7890',
      address: '321 Elm St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02104',
      primaryCondition: 'Pressure sore',
      lastVisitDate: '2024-02-28',
      insuranceInfo: {
        provider: 'Cigna',
        policyNumber: 'CIG901234',
        groupNumber: 'GRP004',
        status: 'pending'
      }
    },
    {
      id: 'P-1238',
      firstName: 'David',
      lastName: 'Wilson',
      dateOfBirth: '1965-09-12',
      email: 'david@example.com',
      phone: '(555) 567-8901',
      address: '654 Maple Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02105',
      primaryCondition: 'Venous leg ulcer',
      lastVisitDate: '2024-03-18',
      insuranceInfo: {
        provider: 'Medicare',
        policyNumber: 'MED567890',
        groupNumber: 'GRP005',
        status: 'active'
      }
    }
  ]);

  const [quickStats] = useState<QuickStats>({
    totalPatients: 247,
    pendingIVRs: 12,
    activeOrders: 34
  });

  // Load recently viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewedPatients');
    if (stored) {
      setRecentlyViewed(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Debounced search
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.primaryCondition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((patient: Patient) => {
    // Update recently viewed
    const patientForStorage = {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      dateOfBirth: patient.dateOfBirth,
      insurance: patient.insuranceInfo.provider,
      lastVisit: patient.lastVisitDate,
      condition: patient.primaryCondition,
      status: patient.insuranceInfo.status as 'active' | 'inactive',
      email: patient.email,
      phone: patient.phone
    };

    const updated = [patientForStorage, ...recentlyViewed.filter(p => p.id !== patient.id)].slice(0, 3);
    setRecentlyViewed(updated);
    localStorage.setItem('recentlyViewedPatients', JSON.stringify(updated));

    // Navigate to patient details
    navigate(`/doctor/patients/${patient.id}`);
  }, [recentlyViewed, navigate]);

  const handleSubmitIVR = useCallback((patientId: string) => {
    navigate(`/doctor/ivr/submit/${patientId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Quick Stats Header */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* Add New Patient CTA Card - Moved to far left */}
        <button
          onClick={() => navigate('/doctor/patients/intake')}
          className="group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg shadow-sm hover:shadow-md p-6 transition-all duration-300 ease-out transform hover:scale-105"
        >
          <div className="flex items-center justify-between h-full">
            <div className="text-left">
              <p className="text-sm font-medium text-blue-700 group-hover:text-blue-800">Quick Action</p>
              <p className="text-lg font-bold text-blue-900 group-hover:text-blue-950 mt-1">Add New Patient</p>
              <p className="text-xs text-blue-600 group-hover:text-blue-700 mt-1">Start patient registration</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 group-hover:bg-blue-300 rounded-lg flex items-center justify-center transition-colors duration-200">
              <svg className="w-7 h-7 text-blue-700 group-hover:text-blue-800 transition-transform group-hover:scale-110 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{quickStats.totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending IVRs</p>
              <p className="text-3xl font-bold text-orange-600">{quickStats.pendingIVRs}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-3xl font-bold text-green-600">{quickStats.activeOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recently Viewed</h3>
          <div className="flex space-x-4">
            {recentlyViewed.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleRowClick(patients.find(p => p.id === patient.id)!)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  patient.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.condition}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Patient Table */}
      <div className="bg-white rounded-lg shadow-sm">
                {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Patient Directory</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DOB
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Insurance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
                             {filteredPatients.map((patient, index) => (
                 <PatientRow
                   key={patient.id}
                   patient={{
                     id: patient.id,
                     name: `${patient.firstName} ${patient.lastName}`,
                     dateOfBirth: patient.dateOfBirth,
                     insurance: patient.insuranceInfo.provider,
                     lastVisit: patient.lastVisitDate,
                     condition: patient.primaryCondition,
                     status: patient.insuranceInfo.status as 'active' | 'inactive',
                     email: patient.email,
                     phone: patient.phone
                   }}
                   index={index}
                   onRowClick={() => handleRowClick(patient)}
                   onSubmitIVR={handleSubmitIVR}
                   openMenuId={openMenuId}
                   setOpenMenuId={setOpenMenuId}
                   navigate={navigate}
                 />
               ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No patients found' : 'No patients yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? `No patients match "${searchTerm}". Try adjusting your search or add a new patient.`
                  : 'Get started by adding your first patient to the system.'
                }
              </p>
                             <button
                 onClick={() => navigate('/doctor/patients/intake')}
                 className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
               >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Patient
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSelectionPage;