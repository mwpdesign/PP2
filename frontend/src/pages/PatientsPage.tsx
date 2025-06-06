import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  insurance: string;
  lastVisit: string;
  condition: string;
  status: 'active' | 'inactive';
  email: string;
  phone: string;
}

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
  onSubmitIVR
}: {
  patient: Patient;
  index: number;
  onRowClick: (patient: Patient) => void;
  onSubmitIVR: (patientId: string) => void;
}) => {
  const [showActions, setShowActions] = useState(false);

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
      className={`h-12 cursor-pointer transition-colors hover:bg-slate-100 ${
        index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
      }`}
      onClick={() => onRowClick(patient)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
      <td className="px-4 py-3">
        <div className={`flex items-center space-x-2 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(patient);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSubmitIVR(patient.id);
            }}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Submit IVR"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
});

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<Patient[]>([]);

  // Mock data - replace with actual API calls
  const [patients] = useState<Patient[]>([
    {
      id: 'P-1234',
      name: 'John Smith',
      dateOfBirth: '1980-05-15',
      insurance: 'Blue Cross Blue Shield',
      lastVisit: '2024-03-15',
      condition: 'Chronic wound care',
      status: 'active',
      email: 'john@example.com',
      phone: '(555) 123-4567'
    },
    {
      id: 'P-1235',
      name: 'Sarah Johnson',
      dateOfBirth: '1992-08-21',
      insurance: 'UnitedHealthcare',
      lastVisit: '2024-03-14',
      condition: 'Post-surgical wound',
      status: 'active',
      email: 'sarah@example.com',
      phone: '(555) 234-5678'
    },
    {
      id: 'P-1236',
      name: 'Michael Brown',
      dateOfBirth: '1975-12-03',
      insurance: 'Aetna',
      lastVisit: '2024-03-10',
      condition: 'Diabetic ulcer',
      status: 'active',
      email: 'michael@example.com',
      phone: '(555) 345-6789'
    },
    {
      id: 'P-1237',
      name: 'Emily Davis',
      dateOfBirth: '1988-03-30',
      insurance: 'Cigna',
      lastVisit: '2024-02-28',
      condition: 'Pressure sore',
      status: 'inactive',
      email: 'emily@example.com',
      phone: '(555) 456-7890'
    },
    {
      id: 'P-1238',
      name: 'David Wilson',
      dateOfBirth: '1965-09-12',
      insurance: 'Medicare',
      lastVisit: '2024-03-18',
      condition: 'Venous leg ulcer',
      status: 'active',
      email: 'david@example.com',
      phone: '(555) 567-8901'
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

  // Debounced search
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((patient: Patient) => {
    // Update recently viewed
    const updated = [patient, ...recentlyViewed.filter(p => p.id !== patient.id)].slice(0, 3);
    setRecentlyViewed(updated);
    localStorage.setItem('recentlyViewedPatients', JSON.stringify(updated));

    // Navigate to patient details
    navigate(`/patients/${patient.id}`);
  }, [recentlyViewed, navigate]);

  const handleSubmitIVR = useCallback((patientId: string) => {
    navigate(`/ivr/new?patientId=${patientId}`);
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
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{quickStats.totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                onClick={() => handleRowClick(patient)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, index) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  index={index}
                  onRowClick={handleRowClick}
                  onSubmitIVR={handleSubmitIVR}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No patients found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsPage;