import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  PrinterIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { Patient, Document } from '../../types/ivr';
import patientService from '../../services/patientService';
import DocumentPreviewModal from './DocumentPreviewModal';
import { NewPatientForm } from './NewPatientForm';
import RecordTreatmentModal from '../treatments/RecordTreatmentModal';
import TreatmentHistory from '../treatments/TreatmentHistory';
import InventorySummary from '../treatments/InventorySummary';
import { Treatment, InventoryItem, TreatmentFormData } from '../../types/treatments';
import {
  getMockTreatmentsByPatient,
  getMockInventoryByPatient,
  DEMO_MODE
} from '../../data/mockTreatmentData';

const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'ivr' | 'orders' | 'documents' | 'notes' | 'treatments'>('ivr');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isRecordTreatmentOpen, setIsRecordTreatmentOpen] = useState(false);
  const [isSavingTreatment, setIsSavingTreatment] = useState(false);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);

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

  // Load treatments and inventory when patient is loaded or tab changes to treatments
  useEffect(() => {
    if (patient?.id && activeTab === 'treatments') {
      loadTreatmentsAndInventory();
    }
  }, [patient?.id, activeTab]);

  const loadTreatmentsAndInventory = async () => {
    if (!patient?.id) return;

    setTreatmentsLoading(true);
    try {
      if (DEMO_MODE) {
        console.log('🎭 Demo mode: Loading mock treatment data');
        // Simulate loading delay for realistic demo
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockTreatments = getMockTreatmentsByPatient(patient.id);
        const mockInventory = getMockInventoryByPatient(patient.id);

        setTreatments(mockTreatments);
        setInventory(mockInventory);
      } else {
        // Real API calls (commented out for demo)
        /*
        const [treatmentsResult, inventoryResult] = await Promise.all([
          treatmentService.getTreatmentsByPatient(patient.id),
          treatmentService.getPatientInventory(patient.id)
        ]);

        setTreatments(treatmentsResult.treatments);
        setInventory(inventoryResult);
        */
        setTreatments([]);
        setInventory([]);
      }
    } catch (error) {
      console.error('Failed to load treatments and inventory:', error);
      setError('Failed to load treatment data. Please try again.');
    } finally {
      setTreatmentsLoading(false);
    }
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

  const handleDocumentPreview = (document: Document) => {
    setPreviewDocument(document);
    setIsPreviewOpen(true);
  };

  const handleEditPatient = () => {
    setIsEditFormOpen(true);
  };

  const handleEditFormClose = () => {
    setIsEditFormOpen(false);
  };

  const handleEditFormSave = (updatedPatientData: any) => {
    // TODO: Update patient data in state and backend
    console.log('Updated patient data:', updatedPatientData);
    setIsEditFormOpen(false);
    // Optionally refresh patient data
  };

  const handleRecordTreatment = () => {
    setIsRecordTreatmentOpen(true);
  };

  const handleRecordTreatmentClose = () => {
    setIsRecordTreatmentOpen(false);
  };

  const handleRecordTreatmentSave = async (treatmentData: TreatmentFormData) => {
    // The modal handles the API call, so we just need to refresh the data
    try {
      // Refresh treatments and inventory after successful save
      await loadTreatmentsAndInventory();
    } catch (error) {
      console.error('Failed to refresh treatment data:', error);
      // Don't show error here as the treatment was already saved successfully
    }
  };

  const refreshTreatments = async () => {
    if (!patient?.id) return;

    setTreatmentsLoading(true);
    try {
      if (DEMO_MODE) {
        console.log('🎭 Demo mode: Refreshing mock treatment data');
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const mockTreatments = getMockTreatmentsByPatient(patient.id);
        const mockInventory = getMockInventoryByPatient(patient.id);

        setTreatments(mockTreatments);
        setInventory(mockInventory);
      } else {
        // Real API calls (commented out for demo)
        /*
        const [treatmentsResult, inventoryResult] = await Promise.all([
          treatmentService.getTreatmentsByPatient(patient.id),
          treatmentService.getPatientInventory(patient.id)
        ]);

        setTreatments(treatmentsResult.treatments);
        setInventory(inventoryResult);
        */
        setTreatments([]);
        setInventory([]);
      }
    } catch (error) {
      console.error('Failed to refresh treatments:', error);
      setError('Failed to refresh treatment data. Please try again.');
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    const extension = fileName.toLowerCase().split('.').pop();

    if (extension === 'pdf' || fileType === 'medical') {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <DocumentTextIcon className="w-5 h-5 text-red-600" />
        </div>
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '') || fileType === 'insurance') {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
        <DocumentTextIcon className="w-5 h-5 text-slate-600" />
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4 text-lg">{error || 'Patient not found'}</div>
        <button
          onClick={() => navigate('/doctor/patients/select')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Patient List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={() => navigate('/doctor/patients/select')}
              className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Patients
            </button>

            {/* Action Bar */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEditPatient}
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Patient
              </button>
              <button
                onClick={() => navigate(`/doctor/ivr/submit/${patient.id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Submit IVR
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Records
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-slate-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="flex items-center mt-1 space-x-4">
                    <span className="text-slate-600">
                      Age {formatAge(patient.dateOfBirth)} • DOB: {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{patient.insuranceInfo.provider}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(patient.insuranceInfo.status)}`}>
                      {patient.insuranceInfo.status.charAt(0).toUpperCase() + patient.insuranceInfo.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">Patient ID</div>
                <div className="font-mono text-slate-900">{patient.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Demographics */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Demographics</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700">Full Name</div>
                <div className="text-slate-900">{patient.firstName} {patient.lastName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Date of Birth</div>
                <div className="text-slate-900">{format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Age</div>
                <div className="text-slate-900">{formatAge(patient.dateOfBirth)} years old</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Address</div>
                <div className="text-slate-900">
                  {patient.address && (
                    <>
                      {patient.address}<br />
                      {patient.city}, {patient.state} {patient.zipCode}
                    </>
                  )}
                  {!patient.address && <span className="text-slate-500">Not provided</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Medical History</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700">Primary Condition</div>
                <div className="text-slate-900">{patient.primaryCondition || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Last Visit</div>
                <div className="text-slate-900">
                  {patient.lastVisitDate ? format(new Date(patient.lastVisitDate), 'MMMM d, yyyy') : 'No visits recorded'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Insurance Provider</div>
                <div className="text-slate-900">{patient.insuranceInfo.provider}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Policy Number</div>
                <div className="text-slate-900 font-mono">{patient.insuranceInfo.policyNumber}</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Contact Info</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Phone
                </div>
                <div className="text-slate-900">{patient.phone || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Email
                </div>
                <div className="text-slate-900">{patient.email || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Location
                </div>
                <div className="text-slate-900">
                  {patient.city && patient.state ? `${patient.city}, ${patient.state}` : 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'ivr', name: 'IVR History', icon: ClipboardDocumentListIcon },
                { id: 'treatments', name: 'Treatment Tracking', icon: ClipboardDocumentCheckIcon },
                { id: 'orders', name: 'Medical Orders', icon: ClipboardDocumentListIcon },
                { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
                { id: 'notes', name: 'Notes', icon: ChatBubbleLeftRightIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {activeTab === 'ivr' && (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No IVR history</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    This patient hasn't submitted any IVR requests yet.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(`/doctor/ivr/submit/${patient.id}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Submit New IVR
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No medical orders</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No medical orders have been placed for this patient yet.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {patient.documents && patient.documents.length > 0 ? (
                  <div className="space-y-3">
                    {patient.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(document.name, document.type)}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-900">
                              {document.name}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-slate-500 capitalize">
                                {document.type}
                              </span>
                              <span className="text-xs text-slate-500">
                                {document.size ? formatFileSize(document.size) : 'Unknown size'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDocumentPreview(document)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Preview"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDocumentDownload(document.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No documents</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      No documents have been uploaded for this patient yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <div className="space-y-6">
                {/* Header with Record Treatment Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">Treatment Tracking</h3>
                    <p className="text-sm text-slate-500">Track product usage for clinical documentation and inventory management</p>
                    {DEMO_MODE && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🎭 Demo Mode
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRecordTreatment}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Record Treatment
                  </button>
                </div>

                {/* Inventory Summary */}
                <InventorySummary
                  patientId={patient?.id || ''}
                  inventory={inventory}
                  loading={treatmentsLoading}
                  onRefresh={refreshTreatments}
                />

                {/* Treatment History */}
                <TreatmentHistory
                  patientId={patient?.id || ''}
                  treatments={treatments}
                  loading={treatmentsLoading}
                  onRefresh={refreshTreatments}
                />
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No notes</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No clinical notes have been added for this patient yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDocumentDownload}
      />

      {/* Edit Patient Form Modal */}
      {isEditFormOpen && (
        <NewPatientForm
          onClose={handleEditFormClose}
          onSave={handleEditFormSave}
          editMode={true}
          initialData={patient}
        />
      )}

      {/* Record Treatment Modal */}
      <RecordTreatmentModal
        isOpen={isRecordTreatmentOpen}
        onClose={handleRecordTreatmentClose}
        onSave={handleRecordTreatmentSave}
        patientId={patient?.id || ''}
        isLoading={isSavingTreatment}
      />
    </div>
  );
};

export default PatientDetail;