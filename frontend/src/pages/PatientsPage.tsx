import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { showNotification } from '../components/ui/Notification';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import PhoneInput from '../components/shared/PhoneInput';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: string;
  lastVisit: string;
  medicalConditions?: string[];
  upcomingAppointment?: string;
  insuranceProvider?: string;
}

const PatientsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const patients: Patient[] = [
    {
      id: 'P-1234',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      dateOfBirth: '1980-05-15',
      status: 'Active',
      lastVisit: '2024-03-15',
      medicalConditions: ['Hypertension', 'Type 2 Diabetes'],
      upcomingAppointment: '2024-04-01 10:00 AM',
      insuranceProvider: 'Blue Cross'
    },
    {
      id: 'P-1235',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 234-5678',
      dateOfBirth: '1992-08-21',
      status: 'Scheduled',
      lastVisit: '2024-03-14',
      medicalConditions: ['Asthma'],
      upcomingAppointment: '2024-03-25 2:30 PM',
      insuranceProvider: 'Aetna'
    },
    {
      id: 'P-1236',
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '(555) 345-6789',
      dateOfBirth: '1975-12-03',
      status: 'Active',
      lastVisit: '2024-03-10',
      medicalConditions: ['Arthritis', 'High Cholesterol'],
      upcomingAppointment: '2024-04-05 11:15 AM',
      insuranceProvider: 'UnitedHealth'
    },
    {
      id: 'P-1237',
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '(555) 456-7890',
      dateOfBirth: '1988-03-30',
      status: 'Inactive',
      lastVisit: '2024-02-28',
      medicalConditions: ['Migraine'],
      insuranceProvider: 'Cigna'
    },
    {
      id: 'P-1238',
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '(555) 567-8901',
      dateOfBirth: '1965-09-12',
      status: 'Active',
      lastVisit: '2024-03-18',
      medicalConditions: ['COPD', 'Osteoporosis'],
      upcomingAppointment: '2024-03-28 9:00 AM',
      insuranceProvider: 'Medicare'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Patient added successfully');
      setShowAddForm(false);
    } catch (error) {
      showNotification.error('Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Patient deleted successfully');
      setShowDeleteConfirm(false);
    } catch (error) {
      showNotification.error('Failed to delete patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Patient Directory</h1>
            <p className="text-gray-600 mt-1">Manage and view patient information</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            icon="+"
          >
            Add New Patient
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Patient ID</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Medical Info</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Next Appointment</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-3 px-4">
                      <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-36"></div></td>
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{patient.id}</td>
                  <td className="py-3 px-4 font-medium">{patient.name}</td>
                  <td className="py-3 px-4">
                    <div>{patient.email}</div>
                    <div className="text-gray-500 text-sm">{patient.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {patient.medicalConditions?.map((condition, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' :
                      patient.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {patient.upcomingAppointment || 'No appointment scheduled'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                      >
                        View
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Patient</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  label="Phone Number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                >
                  <option value="">Select Provider</option>
                  <option value="bluecross">Blue Cross</option>
                  <option value="aetna">Aetna</option>
                  <option value="unitedhealth">UnitedHealth</option>
                  <option value="cigna">Cigna</option>
                  <option value="medicare">Medicare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                  rows={3}
                  placeholder="Enter any existing medical conditions..."
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  loadingText="Adding Patient..."
                >
                  Add Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message={`Are you sure you want to delete ${selectedPatient?.name}? This action cannot be undone.`}
        confirmText="Delete Patient"
        type="danger"
        loading={isSubmitting}
      />
    </div>
  );
};

export default PatientsPage;