import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Simplified Doctor interface
interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty: string;
  facility: string;
  status: 'active' | 'inactive';
  added_by_name: string;
  created_at: string;
  npi?: string;
  license_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  years_experience?: number;
  wound_care_percentage?: number;
}

const DoctorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for testing - this eliminates API dependency
  const mockDoctors: { [key: string]: Doctor } = {
    'f867a41c-83b1-4ef3-96ec-c3ed1fea07a2': {
      id: 'f867a41c-83b1-4ef3-96ec-c3ed1fea07a2',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@healthcare.com',
      phone: '(555) 123-4567',
      specialty: 'Wound Care Specialist',
      facility: 'City Medical Center',
      status: 'active',
      npi: '1234567890',
      license_number: 'MD123456',
      address_line_1: '123 Medical Drive',
      address_line_2: 'Suite 100',
      city: 'Healthcare City',
      state: 'CA',
      zip_code: '90210',
      years_experience: 15,
      wound_care_percentage: 80,
      added_by_name: 'Sales Representative',
      created_at: new Date().toISOString()
    }
  };

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) {
        setError('Doctor ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use mock data instead of API call
        const doctorData = mockDoctors[id] || {
          id: id,
          first_name: 'Unknown',
          last_name: 'Doctor',
          email: 'unknown@healthcare.com',
          specialty: 'General Practice',
          facility: 'Unknown Medical Center',
          status: 'active' as const,
          added_by_name: 'Sales Representative',
          created_at: new Date().toISOString()
        };

        setDoctor(doctorData);
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError('Failed to load doctor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getFullName = (doctor: Doctor) => {
    if (!doctor) return 'Unknown Doctor';
    const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    return fullName || doctor.email || 'Unknown Doctor';
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <XCircleIcon className="h-4 w-4 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <XCircleIcon className="h-4 w-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading doctor</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Doctor not found'}</p>
          <div className="mt-6 space-x-3">
            <button
              onClick={() => navigate('/sales/doctors')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/sales/doctors')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Doctors
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{getFullName(doctor)}</h1>
              <p className="mt-1 text-sm text-gray-600">Doctor Details</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/sales/doctors/${doctor.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Doctor
          </button>
        </div>

        {/* Doctor Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-slate-700">
                      {(doctor.first_name?.[0] || '') + (doctor.last_name?.[0] || '') || doctor.email?.[0] || 'D'}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{getFullName(doctor)}</h4>
                  <p className="text-sm text-gray-600">{doctor.specialty || 'Specialty not specified'}</p>
                  <div className="mt-2">{getStatusBadge(doctor.status)}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{doctor.email}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{doctor.phone}</span>
                  </div>
                )}
                {doctor.npi && (
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">NPI: {doctor.npi}</span>
                  </div>
                )}
                {doctor.license_number && (
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">License: {doctor.license_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Practice Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Practice Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{doctor.facility || 'Facility not specified'}</span>
              </div>

              {(doctor.address_line_1 || doctor.city || doctor.state) && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    {doctor.address_line_1 && <div>{doctor.address_line_1}</div>}
                    {doctor.address_line_2 && <div>{doctor.address_line_2}</div>}
                    {(doctor.city || doctor.state || doctor.zip_code) && (
                      <div>
                        {doctor.city && doctor.city}
                        {doctor.city && doctor.state && ', '}
                        {doctor.state && doctor.state}
                        {doctor.zip_code && ` ${doctor.zip_code}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {doctor.years_experience && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{doctor.years_experience} years of experience</span>
                </div>
              )}

              {doctor.wound_care_percentage && (
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{doctor.wound_care_percentage}% wound care focus</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Date Added</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(doctor.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Added By</dt>
              <dd className="mt-1 text-sm text-gray-900">{doctor.added_by_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Status</dt>
              <dd className="mt-1">{getStatusBadge(doctor.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Doctor ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{doctor.id}</dd>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🔧 Debug Info (Simplified Version)</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div>✅ No UnifiedDashboardLayout dependency</div>
            <div>✅ No useAuth() hook dependency</div>
            <div>✅ No createSalesNavigation() dependency</div>
            <div>✅ No API call dependency (using mock data)</div>
            <div>✅ Simplified component structure</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;