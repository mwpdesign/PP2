import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon as UsersIconSolid,
  PhoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import { getDoctorById, updateDoctor } from '../../services/api';
import { createSalesNavigation } from '../../components/sales/SimpleSalesDashboard';

// Types for API response
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

interface DoctorFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialty: string;
  facility: string;
  npi: string;
  license_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  years_experience: string;
  wound_care_percentage: string;
  status: 'active' | 'inactive';
}

const DoctorEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { logout, user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    facility: '',
    npi: '',
    license_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    years_experience: '',
    wound_care_percentage: '',
    status: 'active'
  });

  // Check if user has permission to manage doctors
  const canManageDoctors = user?.role && ['Sales', 'Distributor', 'Master Distributor', 'Admin', 'CHP Admin'].includes(user.role);

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
        const doctorData = await getDoctorById(id);
        setDoctor(doctorData);

        // Pre-populate form with existing data
        setFormData({
          first_name: doctorData.first_name || '',
          last_name: doctorData.last_name || '',
          email: doctorData.email || '',
          phone: doctorData.phone || '',
          specialty: doctorData.specialty || '',
          facility: doctorData.facility || '',
          npi: doctorData.npi || '',
          license_number: doctorData.license_number || '',
          address_line_1: doctorData.address_line_1 || '',
          address_line_2: doctorData.address_line_2 || '',
          city: doctorData.city || '',
          state: doctorData.state || '',
          zip_code: doctorData.zip_code || '',
          years_experience: doctorData.years_experience?.toString() || '',
          wound_care_percentage: doctorData.wound_care_percentage?.toString() || '',
          status: doctorData.status || 'active'
        });
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError('Failed to load doctor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = createSalesNavigation(logout);

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !doctor) return;

    try {
      setSaving(true);
      setError(null);

      // Convert string numbers back to numbers for API
      const updateData = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
        wound_care_percentage: formData.wound_care_percentage ? parseInt(formData.wound_care_percentage) : undefined
      };

      await updateDoctor(id, updateData);

      // Navigate back to doctor detail page
      navigate(`/sales/doctors/${id}`);
    } catch (err) {
      console.error('Error updating doctor:', err);
      setError('Failed to update doctor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/sales/doctors/${id}`);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading doctor details...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error && !doctor) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="text-center py-12">
          <UserPlusIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading doctor</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
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
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/sales/doctors/${id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Details
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Doctor</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update doctor information and practice details
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <UserPlusIcon className="h-8 w-8 text-gray-600" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Doctor Information</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Update the doctor's personal and professional information
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                        Medical Specialty *
                      </label>
                      <input
                        type="text"
                        name="specialty"
                        id="specialty"
                        required
                        value={formData.specialty}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="npi" className="block text-sm font-medium text-gray-700">
                        NPI Number
                      </label>
                      <input
                        type="text"
                        name="npi"
                        id="npi"
                        value={formData.npi}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="license_number" className="block text-sm font-medium text-gray-700">
                        License Number
                      </label>
                      <input
                        type="text"
                        name="license_number"
                        id="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="years_experience"
                        id="years_experience"
                        min="0"
                        max="50"
                        value={formData.years_experience}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="wound_care_percentage" className="block text-sm font-medium text-gray-700">
                        Wound Care Percentage
                      </label>
                      <input
                        type="number"
                        name="wound_care_percentage"
                        id="wound_care_percentage"
                        min="0"
                        max="100"
                        value={formData.wound_care_percentage}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Account Status
                      </label>
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Practice Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Practice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="facility" className="block text-sm font-medium text-gray-700">
                        Facility/Practice Name *
                      </label>
                      <input
                        type="text"
                        name="facility"
                        id="facility"
                        required
                        value={formData.facility}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        name="address_line_1"
                        id="address_line_1"
                        value={formData.address_line_1}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address_line_2" className="block text-sm font-medium text-gray-700">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="address_line_2"
                        id="address_line_2"
                        value={formData.address_line_2}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        id="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default DoctorEdit;