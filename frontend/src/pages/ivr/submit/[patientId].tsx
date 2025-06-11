import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRightIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/layout/PageHeader';
import {
  Patient,
  PhysicianInfo,
  IVRFormData,
  InsuranceDetails,
  Document,
  IVRStatus,
  IVRPriority
} from '../../../types/ivr';
import IVRFormHeader from '../../../components/ivr/IVRFormHeader';

import InsuranceDetailsStep from '../../../components/ivr/InsuranceDetailsStep';
import SupportingDocumentsStep from '../../../components/ivr/SupportingDocumentsStep';
import ReviewStep from '../../../components/ivr/ReviewStep';
import { createInitialTracking, updateIVRStatus } from '../../../utils/ivrUtils';
import PatientAndTreatmentStep from '../../../components/ivr/PatientAndTreatmentStep';
import ivrService from '../../../services/ivrService';
import { toast } from 'react-hot-toast';
import { useSmartAutoPopulation } from '../../../hooks/useSmartAutoPopulation';
import { FieldSuggestion } from '../../../types/autoPopulation';

type FormStep = 'patient-treatment' | 'insurance' | 'documents' | 'review';

const steps: { id: FormStep; name: string }[] = [
  { id: 'patient-treatment', name: 'Patient & Treatment Information' },
  { id: 'insurance', name: 'Insurance Details' },
  { id: 'documents', name: 'Supporting Documents' },
  { id: 'review', name: 'Review & Submit' }
];

// Mock physician data - TODO: Replace with actual logged-in user data
const mockPhysician: PhysicianInfo = {
  id: 'PHY123',
  name: 'Dr. Jane Smith',
  npi: '1234567890',
  medicaidProviderNumber: 'MED123456',
  medicarePTAN: 'AB12345',
  taxId: '12-3456789',
  facility: {
    id: 'FAC123',
    name: 'Medical Center',
    address: '123 Medical Dr, City, ST 12345',
    phone: '(555) 123-4567'
  }
};

const IVRSubmissionPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FormStep>('patient-treatment');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<IVRFormData | null>(null);

  // Smart Auto-Population Integration
  const autoPopulation = useSmartAutoPopulation({
    patientId: patientId || '',
    formType: 'ivr',
    currentFieldValues: {
      primaryCondition: patient?.primaryCondition,
      qCode: formData?.treatmentInfo?.qCode,
      frequency: formData?.treatmentInfo?.frequency,
      state: patient?.state
    },
    userRole: 'doctor', // TODO: Get from auth context
    enableAutoSuggestions: true,
    enableInsuranceAutoComplete: true,
    debounceMs: 300
  });

  // Auto-Population Suggestions Component
  const AutoPopulationSuggestions: React.FC<{ suggestions: FieldSuggestion[] }> = ({ suggestions }) => {
    if (suggestions.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-3">
          <LightBulbIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-blue-900">Smart Suggestions</h3>
        </div>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {suggestion.field}: {suggestion.value}
                </span>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 mr-2">
                    Confidence: {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    Source: {suggestion.source}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => autoPopulation.acceptSuggestion(suggestion.field, true)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Apply
                </button>
                <button
                  onClick={() => autoPopulation.rejectSuggestion(suggestion.field)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Patient History Component
  const PatientHistoryPanel: React.FC = () => {
    if (autoPopulation.patientHistory.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center mb-3">
          <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Previous Forms</h3>
        </div>
        <div className="space-y-2">
          {autoPopulation.patientHistory.slice(0, 3).map((history) => (
            <div key={history.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex-1">
                <span className="text-sm text-gray-900">
                  {history.formType.toUpperCase()} - {new Date(history.createdAt).toLocaleDateString()}
                </span>
                <div className="text-xs text-gray-500">
                  {history.success ? 'Completed' : 'Draft'} • Q-Code: {history.formData.treatmentInfo?.qCode || 'N/A'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (history.formData.treatmentInfo) {
                    autoPopulation.duplicateForm({
                      sourceIVRId: history.id,
                      targetPatientId: patientId || '',
                      fieldsToInclude: ['treatmentInfo', 'selectedProducts'],
                      preserveTimestamps: false
                    });
                  }
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                disabled={autoPopulation.duplicationLoading}
              >
                {autoPopulation.duplicationLoading ? 'Copying...' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        setError('No patient ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock patient data
        const mockPatient: Patient = {
          id: patientId,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          email: '', // Removed per requirements
          phone: '', // Removed per requirements
          address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          primaryCondition: 'Chronic Wound - Stage 2',
          lastVisitDate: '2024-03-15',
          insuranceInfo: {
            provider: 'Blue Cross Blue Shield',
            policyNumber: 'BCBS123456789',
            groupNumber: 'GRP123',
            status: 'active'
          }
        };
        setPatient(mockPatient);

        // Initialize form data with patient info
        const initialFormData: IVRFormData = {
          patientId: mockPatient.id,
          status: IVRStatus.SUBMITTED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          selectedProducts: [],
          treatmentInfo: {
            skinSubstituteAcknowledged: false,
            qCode: '',
            selectedProducts: [],
            // Legacy fields for backward compatibility
            qCodeProduct: '',
            qCodeSize: '',
            startDate: '',
            numberOfApplications: 1,
            frequency: 'weekly',
            totalSurfaceArea: 0,
            diagnosisCodes: [
              { code: '', description: '', isPrimary: true }
            ],
            clinicalNotes: ''
          },
          insuranceDetails: {
            verificationStatus: 'pending',
            verificationDate: new Date().toISOString(),
            policyNumber: mockPatient.insuranceInfo.policyNumber,
            groupNumber: mockPatient.insuranceInfo.groupNumber,
            preAuthRequired: false,
            preAuthNumber: undefined,
            coverageNotes: undefined
          },
          supportingDocuments: [],
          tracking: createInitialTracking('USER123'), // TODO: Replace with actual user ID
          physician: mockPhysician
        };
        setFormData(initialFormData);
      } catch (error) {
        console.error('Error fetching patient:', error);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);



    const handleSubmit = async () => {
    if (!formData || !patient) return;

    try {
      setIsSubmitting(true);
      // Update status to submitted
      const updatedTracking = updateIVRStatus(
        formData.tracking,
        IVRStatus.SUBMITTED,
        'USER123', // TODO: Replace with actual user ID
        'IVR request submitted'
      );
      const updatedFormData = {
        ...formData,
        status: IVRStatus.SUBMITTED,
        tracking: updatedTracking,
        updatedAt: new Date().toISOString()
      };

      // Submit IVR using the service - convert form data to IVR request format
      const ivrRequestData = {
        id: '', // Will be generated by backend
        patient: patient,
        provider: {
          id: formData.physician.id,
          name: formData.physician.name,
          speciality: 'Wound Care', // Default speciality
          npi: formData.physician.npi
        },
        serviceType: 'Insurance Verification Request',
        priority: IVRPriority.MEDIUM,
        status: updatedFormData.status,
        documents: [],
        statusHistory: [],
        approvals: [],
        escalations: [],
        facilityId: formData.physician.facility.id,
        createdAt: updatedFormData.createdAt,
        updatedAt: updatedFormData.updatedAt,
        reviewNotes: [],
        communication: [],
        reviews: []
      };

      const submittedIVR = await ivrService.createIVRRequest(ivrRequestData);

      // Upload any supporting documents
      if (formData.supportingDocuments.length > 0) {
        const uploadPromises = formData.supportingDocuments.map(doc => {
          return ivrService.uploadDocument(submittedIVR.id, doc as unknown as File, doc.type);
        });
        await Promise.all(uploadPromises);
      }

      // Save to auto-population history
      autoPopulation.saveFormToHistory(updatedFormData, true);

      // Navigate to IVR management page after successful submission
      navigate('/doctor/ivr', { replace: true });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit IVR request. Please try again.');

      // Save as failed attempt to history
      if (formData) {
        autoPopulation.saveFormToHistory(formData, false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentsChange = (documents: Document[] | ((current: Document[]) => Document[])) => {
    if (!formData) return;

    if (typeof documents === 'function') {
      setFormData(currentFormData => currentFormData ? {
        ...currentFormData,
        supportingDocuments: documents(currentFormData.supportingDocuments)
      } : null);
    } else {
      setFormData(currentFormData => currentFormData ? {
        ...currentFormData,
        supportingDocuments: documents
      } : null);
    }
  };

  const renderStepContent = () => {
    if (!patient || !formData) return null;

    return (
      <div>
        {/* Auto-Population Components */}
        {autoPopulation.isLoading && patient && formData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
              <span className="text-sm text-blue-700">Loading smart suggestions...</span>
            </div>
          </div>
        )}

        <AutoPopulationSuggestions suggestions={autoPopulation.suggestions} />
        <PatientHistoryPanel />

        {/* Existing Step Content */}
        {(() => {
          switch (currentStep) {
            case 'patient-treatment':
              return (
                <PatientAndTreatmentStep
                  patient={patient}
                  treatmentInfo={formData.treatmentInfo}
                  onTreatmentInfoChange={(treatmentInfo) =>
                    setFormData(prev => prev ? { ...prev, treatmentInfo } : null)
                  }
                  documents={formData.supportingDocuments}
                  onDocumentsChange={handleDocumentsChange}
                />
              );
            case 'insurance':
              return (
                <InsuranceDetailsStep
                  patient={patient}
                  insuranceDetails={formData.insuranceDetails}
                  onInsuranceDetailsChange={(details: InsuranceDetails) =>
                    setFormData(prev => prev ? { ...prev, insuranceDetails: details } : null)
                  }
                  documents={formData.supportingDocuments}
                  onDocumentsChange={handleDocumentsChange}
                />
              );
            case 'documents':
              return (
                <SupportingDocumentsStep
                  documents={formData.supportingDocuments}
                  onDocumentsChange={handleDocumentsChange}
                />
              );
            case 'review':
              return <ReviewStep patient={patient} formData={formData} />;
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Return to Patient Selection
        </button>
      </div>
    );
  }

  if (!patient || !formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-600 mb-4">No patient data available</div>
        <button
          onClick={() => navigate('/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Return to Patient Selection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8 pt-6">
      <PageHeader
        title="Submit Insurance Verification Request"
        subtitle={`Creating IVR for ${patient.firstName} ${patient.lastName}`}
      />

      <IVRFormHeader
        tracking={formData.tracking}
        patient={patient}
        physician={formData.physician}
      />

      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="md:flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`
                  group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0
                  ${currentStep === step.id
                    ? 'border-[#2C3E50] hover:border-[#2C3E50]'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Step {stepIdx + 1}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="mt-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8">
        <button
          type="button"
          onClick={() => navigate('/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex space-x-3">
          {currentStep === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit IVR Request'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const currentIndex = steps.findIndex(step => step.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id);
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
            >
              Next Step
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IVRSubmissionPage;