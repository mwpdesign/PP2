import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { NewPatientForm } from '../../components/patients/NewPatientForm';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import patientService from '../../services/patientService';

interface PatientFormData {
  // Basic patient data
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  // Contact information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Insurance information
  primaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: File | null;
    cardBack: File | null;
  };
  secondaryInsurance?: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: File | null;
    cardBack: File | null;
  };
  // Documents
  governmentId: File | null;
  additionalDocuments: File[];
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="p-6 bg-red-50 rounded-lg">
    <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
    <p className="text-sm text-red-600 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
    >
      Try again
    </button>
  </div>
);

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSave = async (patientData: PatientFormData) => {
    try {
      setIsSubmitting(true);

      // Register patient with all data in one call
      await patientService.registerPatient({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        address: patientData.address,
        city: patientData.city,
        state: patientData.state,
        zip: patientData.zipCode,
        governmentIdType: 'ID', // TODO: Make this configurable
        governmentId: patientData.governmentId,
        primaryInsurance: {
          provider: patientData.primaryInsurance.provider,
          policyNumber: patientData.primaryInsurance.policyNumber,
          payerPhone: patientData.primaryInsurance.payerPhone,
          cardFront: patientData.primaryInsurance.cardFront,
          cardBack: patientData.primaryInsurance.cardBack
        },
        secondaryInsurance: patientData.secondaryInsurance || {
          provider: '',
          policyNumber: '',
          payerPhone: '',
          cardFront: null,
          cardBack: null
        }
      });

      toast.success('Patient record created successfully');
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to create patient record');
      throw error; // Re-throw to trigger error boundary
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage patient records</p>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to List
        </button>
      </div>

      <ErrorBoundary
        fallback={<ErrorFallback error={new Error('Failed to load patient form')} resetErrorBoundary={() => setIsSubmitting(false)} />}
        onReset={() => {
          setIsSubmitting(false);
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <NewPatientForm
              onClose={handleClose}
              onSave={handleSave}
            />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default PatientsPage; 