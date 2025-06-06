import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PageHeader from '../shared/layout/PageHeader';
import DocumentCard from './DocumentCard';
import UniversalFileUpload from '../shared/UniversalFileUpload';
import { Patient, Document } from '../../types/ivr';
import patientService from '../../services/patientService';

const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        if (!id) {
          setError('Patient ID is required');
          return;
        }

        // Use real patient service
        const response = await patientService.getPatient(id);

        // Transform backend response to match frontend Patient type
        const transformedPatient: Patient = {
          id: response.id,
          firstName: response.first_name || response.firstName,
          lastName: response.last_name || response.lastName,
          dateOfBirth: response.date_of_birth || response.dateOfBirth,
          email: response.email,
          phone: response.phone_number || response.phone,
          address: response.address,
          city: response.city,
          state: response.state,
          zipCode: response.zip_code || response.zipCode,
          primaryCondition: response.primary_condition || 'Not specified',
          lastVisitDate: response.last_visit_date || response.lastVisitDate,
          insuranceInfo: {
            provider: response.insurance_provider || 'Not specified',
            policyNumber: response.insurance_id || 'Not specified',
            groupNumber: response.insurance_group || '',
            status: response.insurance_verified ? 'active' : 'pending'
          },
          documents: (response.documents || []).map((doc: any) => ({
            id: doc.id,
            name: doc.display_name || doc.file_name,
            type: doc.document_type,
            url: '', // Will be generated on download
            uploadedAt: doc.created_at,
            status: 'verified' as const,
            size: doc.file_size
          }))
        };

        setPatient(transformedPatient);
        setEditedPatient(transformedPatient);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load patient data';
        setError(errorMessage);
        console.error('Error fetching patient:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedPatient) return;

    const { name, value } = e.target;
    setEditedPatient(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  const handleSave = async () => {
    if (!editedPatient) return;

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPatient(editedPatient);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving patient:', err);
    }
  };

  const handleCancel = () => {
    setEditedPatient(patient);
    setIsEditing(false);
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!editedPatient || !file) return;

    // TODO: Replace with actual API call
    const newDocument: Document = {
      id: `temp-${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'medical' : 'other',
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
      status: 'verified' as const,
      size: file.size
    };

    setEditedPatient(prev => prev ? {
      ...prev,
      documents: [...(prev.documents || []), newDocument]
    } : null);
  };

  const handleDocumentDelete = (documentId: string) => {
    if (!editedPatient) return;

    setEditedPatient(prev => prev ? {
      ...prev,
      documents: prev.documents?.filter(doc => doc.id !== documentId) || []
    } : null);
  };

  const handleDocumentDownload = async (documentId: string) => {
    if (!patient?.id) return;

    try {
      await patientService.downloadDocument(patient.id, documentId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download document';
      setError(errorMessage);
      console.error('Error downloading document:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2C3E50] border-r-transparent"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-600 mb-4">{error || 'Patient not found'}</div>
        <button
          onClick={() => navigate('/doctor/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Patient List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8 pt-6">
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle="Patient Details and Medical Information"
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/doctor/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Patient List
        </button>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
          >
            Edit Patient
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editedPatient?.firstName || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editedPatient?.lastName || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editedPatient?.dateOfBirth || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Condition</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="primaryCondition"
                    value={editedPatient?.primaryCondition || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.primaryCondition || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedPatient?.email || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.email || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editedPatient?.phone || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.phone || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editedPatient?.address || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.address || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={editedPatient?.city || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={editedPatient?.state || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="zipCode"
                    value={editedPatient?.zipCode || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.zipCode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Insurance Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={editedPatient?.insuranceInfo?.provider || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.insuranceInfo?.provider || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={editedPatient?.insuranceInfo?.policyNumber || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                  />
                ) : (
                  <p className="text-gray-900">{patient.insuranceInfo?.policyNumber || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Status</label>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${patient.insuranceInfo?.status === 'active' ? 'bg-green-100 text-green-800' :
                    patient.insuranceInfo?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    patient.insuranceInfo?.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}
                >
                  {patient.insuranceInfo?.status ? patient.insuranceInfo?.status.charAt(0).toUpperCase() + patient.insuranceInfo?.status.slice(1) : 'Unknown'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Visit</label>
                <p className="text-gray-900">
                  {patient.lastVisitDate ? format(new Date(patient.lastVisitDate), 'MM/dd/yyyy') : 'No visits recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Documents</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Upload Card (Edit Mode) */}
              {isEditing && (
                <div className="col-span-full mb-4">
                  <UniversalFileUpload
                    label="Upload Document"
                    description="Upload medical records, insurance cards, or other patient documents"
                    value={null}
                    onChange={handleDocumentUpload}
                    acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                    maxSizeMB={25}
                    showCamera={true}
                  />
                </div>
              )}

              {/* Document Cards */}
              {(isEditing ? editedPatient?.documents : patient?.documents)?.map(document => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  isEditing={isEditing}
                  onDelete={handleDocumentDelete}
                  onDownload={handleDocumentDownload}
                />
              ))}

              {/* Empty State */}
              {(!patient?.documents || patient.documents.length === 0) && !isEditing && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;