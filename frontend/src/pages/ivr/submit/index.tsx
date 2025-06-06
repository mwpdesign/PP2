import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/shared/layout/PageHeader';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  insuranceProvider: string;
  insuranceId: string;
}

interface IVRFormData {
  patientId: string;
  requestType: string;
  primaryDiagnosis: string;
  secondaryDiagnosis: string;
  treatmentPlan: string;
  urgencyLevel: string;
  additionalNotes: string;
}

// TODO: Replace with actual API call
const mockPatient: Patient = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-15',
  insuranceProvider: 'Blue Cross',
  insuranceId: 'BC123456789'
};

const initialFormData: IVRFormData = {
  patientId: '',
  requestType: '',
  primaryDiagnosis: '',
  secondaryDiagnosis: '',
  treatmentPlan: '',
  urgencyLevel: 'normal',
  additionalNotes: ''
};

const IVRSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<IVRFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (!patientId) {
      navigate('/patients/select');
      return;
    }

    // TODO: Replace with actual API call to fetch patient details
    setPatient(mockPatient);
    setFormData(prev => ({ ...prev, patientId }));
  }, [searchParams, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to submit IVR request
      console.log('Submitting IVR request:', formData);

      // Navigate to IVR management page after successful submission
      navigate('/doctor/ivr');
    } catch (error) {
      console.error('Error submitting IVR request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Submit IVR Request"
        subtitle="Create a new insurance verification request"
      />

      {/* Patient Information Card */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Insurance Provider</p>
            <p className="text-sm font-medium text-gray-900">{patient.insuranceProvider}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Insurance ID</p>
            <p className="text-sm font-medium text-gray-900">{patient.insuranceId}</p>
          </div>
        </div>
      </div>

      {/* IVR Request Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="requestType" className="block text-sm font-medium text-gray-700">
                Request Type
              </label>
              <select
                id="requestType"
                name="requestType"
                required
                value={formData.requestType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select Request Type</option>
                <option value="initial">Initial Verification</option>
                <option value="renewal">Renewal</option>
                <option value="modification">Treatment Modification</option>
              </select>
            </div>

            <div>
              <label htmlFor="primaryDiagnosis" className="block text-sm font-medium text-gray-700">
                Primary Diagnosis
              </label>
              <input
                type="text"
                id="primaryDiagnosis"
                name="primaryDiagnosis"
                required
                value={formData.primaryDiagnosis}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="secondaryDiagnosis" className="block text-sm font-medium text-gray-700">
                Secondary Diagnosis (if applicable)
              </label>
              <input
                type="text"
                id="secondaryDiagnosis"
                name="secondaryDiagnosis"
                value={formData.secondaryDiagnosis}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700">
                Treatment Plan
              </label>
              <textarea
                id="treatmentPlan"
                name="treatmentPlan"
                required
                rows={3}
                value={formData.treatmentPlan}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700">
                Urgency Level
              </label>
              <select
                id="urgencyLevel"
                name="urgencyLevel"
                required
                value={formData.urgencyLevel}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows={2}
                value={formData.additionalNotes}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients/select')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit IVR Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IVRSubmissionPage;