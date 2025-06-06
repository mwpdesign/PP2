import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Patient, TreatmentInfo, QCodeProductOptions, QCodeSizeOptions, FrequencyOptions, Document } from '../../types/ivr';
import { ExclamationCircleIcon, CheckCircleIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import UniversalFileUpload from '../shared/UniversalFileUpload';
import { toast } from 'react-toastify';

interface PatientAndTreatmentStepProps {
  patient: Patient;
  treatmentInfo: TreatmentInfo;
  onTreatmentInfoChange: (info: TreatmentInfo) => void;
  documents?: Document[];
  onDocumentsChange?: (documents: Document[]) => void;
}

interface ValidationErrors {
  qCode?: string;
  qCodeProduct?: string;
  qCodeSize?: string;
  startDate?: string;
  numberOfApplications?: string;
  frequency?: string;
  totalSurfaceArea?: string;
  diagnosisCodes?: string[];
}

const PatientAndTreatmentStep: React.FC<PatientAndTreatmentStepProps> = ({
  patient,
  treatmentInfo,
  onTreatmentInfoChange,
  documents = [],
  onDocumentsChange
}) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'qCode':
        return !value ? 'Q Code selection is required' : undefined;
      case 'qCodeProduct':
        return !value ? 'Q Code product selection is required' : undefined;
      case 'qCodeSize':
        return !value ? 'Q Code size selection is required' : undefined;
      case 'startDate':
        if (!value) return 'Treatment start date is required';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today ? 'Start date cannot be in the past' : undefined;
      case 'numberOfApplications':
        if (!value || value < 1) return 'Number of applications must be at least 1';
        if (value > 50) return 'Number of applications seems unusually high';
        return undefined;
      case 'frequency':
        return !value ? 'Frequency selection is required' : undefined;
      case 'totalSurfaceArea':
        if (!value || value <= 0) return 'Total surface area must be greater than 0';
        if (value > 1000) return 'Surface area seems unusually large';
        return undefined;
      default:
        return undefined;
    }
  };

  const validateDiagnosisCodes = (): string[] => {
    const errors: string[] = [];
    treatmentInfo.diagnosisCodes.forEach((code, index) => {
      if (!code.code.trim()) {
        errors[index] = 'Diagnosis code is required';
      } else if (!code.description.trim()) {
        errors[index] = 'Diagnosis description is required';
      }
    });
    return errors;
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    // Validate individual fields
    Object.keys(treatmentInfo).forEach(field => {
      if (field !== 'diagnosisCodes' && field !== 'clinicalNotes' && field !== 'skinSubstituteAcknowledged' && field !== 'qCode') {
        const error = validateField(field, treatmentInfo[field as keyof TreatmentInfo]);
        if (error) {
          (newErrors as any)[field] = error;
        }
      }
    });

    // Validate diagnosis codes
    const diagnosisErrors = validateDiagnosisCodes();
    if (diagnosisErrors.length > 0) {
      newErrors.diagnosisCodes = diagnosisErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateForm();
  }, [treatmentInfo]);

  const handleInputChange = (field: keyof TreatmentInfo, value: any) => {
    const updatedTreatmentInfo = {
      ...treatmentInfo,
      [field]: value
    };

    // Auto-update combined qCode when product or size changes
    if (field === 'qCodeProduct' || field === 'qCodeSize') {
      const product = field === 'qCodeProduct' ? value : treatmentInfo.qCodeProduct;
      const size = field === 'qCodeSize' ? value : treatmentInfo.qCodeSize;

      if (product && size) {
        updatedTreatmentInfo.qCode = `${product}-${size}`;
      } else {
        updatedTreatmentInfo.qCode = '';
      }
    }

    onTreatmentInfoChange(updatedTreatmentInfo);

    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleDiagnosisCodeChange = (index: number, field: 'code' | 'description', value: string) => {
    const updatedCodes = [...treatmentInfo.diagnosisCodes];
    updatedCodes[index] = {
      ...updatedCodes[index],
      [field]: value
    };
    handleInputChange('diagnosisCodes', updatedCodes);
    setTouched(prev => ({ ...prev, [`diagnosisCode_${index}`]: true }));
  };

  const addDiagnosisCode = () => {
    handleInputChange('diagnosisCodes', [
      ...treatmentInfo.diagnosisCodes,
      { code: '', description: '', isPrimary: false }
    ]);
  };

  const removeDiagnosisCode = (index: number) => {
    if (treatmentInfo.diagnosisCodes.length > 1) {
      const updatedCodes = treatmentInfo.diagnosisCodes.filter((_, i) => i !== index);
      handleInputChange('diagnosisCodes', updatedCodes);
    }
  };

  const getFieldStatus = (field: string, value: any) => {
    if (!touched[field]) return null;
    const error = validateField(field, value);
    return error ? 'error' : 'success';
  };

  const renderFieldIcon = (field: string, value: any) => {
    const status = getFieldStatus(field, value);
    if (status === 'error') {
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    } else if (status === 'success') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return null;
  };

  // Document upload handler
  const handleDocumentUpload = async (file: File | null) => {
    if (!file || !onDocumentsChange) {
      setUploadingFile(null);
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);

          // Create the document after upload completes
          const newDocument: Document = {
            id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: 'treatment_document',
            url: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            size: file.size,
            file: file
          };

          onDocumentsChange([...documents, newDocument]);
          setUploadingFile(null);
          setUploadProgress(0);
          toast.success(`${file.name} uploaded successfully`);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Remove document handler
  const handleRemoveDocument = (docId: string) => {
    if (!onDocumentsChange) return;

    const newDocs = documents.filter(doc => doc.id !== docId);
    onDocumentsChange(newDocs);
    toast.info('Document removed');
  };

  // Render document status
  const renderDocumentStatus = (status: string | undefined) => {
    if (!status) return <span className="text-sm text-gray-500">Pending</span>;
    if (status === 'verified') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'rejected') {
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    }
    return <span className="text-sm text-gray-500">Pending</span>;
  };

  return (
    <div className="space-y-8">
      {/* Patient Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {patient.firstName} {patient.lastName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}
            </div>
          </div>

          {patient.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {patient.address}
                {patient.city && patient.state && patient.zipCode && (
                  <div className="mt-1">
                    {patient.city}, {patient.state} {patient.zipCode}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {patient.insuranceInfo.provider}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Policy Number</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {patient.insuranceInfo.policyNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-8">
          {/* Skin Substitute Acknowledgment */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="skinSubstituteAcknowledged"
                  type="checkbox"
                  checked={treatmentInfo.skinSubstituteAcknowledged}
                  onChange={(e) => handleInputChange('skinSubstituteAcknowledged', e.target.checked)}
                  className="h-4 w-4 text-[#2C3E50] border-gray-300 rounded focus:ring-[#2C3E50]"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="skinSubstituteAcknowledged" className="text-sm font-medium text-gray-700">
                  15271-15278 for skin substitute application
                </label>
                <p className="text-sm text-gray-500">
                  I acknowledge that these codes are appropriate for the planned treatment.
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="qCodeProduct" className="block text-sm font-medium text-gray-700">
                Q Code Product *
              </label>
              <div className="mt-1 relative">
                <select
                  id="qCodeProduct"
                  value={treatmentInfo.qCodeProduct}
                  onChange={(e) => handleInputChange('qCodeProduct', e.target.value)}
                  onBlur={() => handleBlur('qCodeProduct')}
                  required
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    touched.qCodeProduct && errors.qCodeProduct
                      ? 'border-red-300 focus:border-red-500'
                      : touched.qCodeProduct && !errors.qCodeProduct
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                >
                  <option value="">Select Product Type</option>
                  {QCodeProductOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-8 flex items-center">
                  {renderFieldIcon('qCodeProduct', treatmentInfo.qCodeProduct)}
                </div>
              </div>
              {touched.qCodeProduct && errors.qCodeProduct && (
                <p className="mt-1 text-xs text-red-600">{errors.qCodeProduct}</p>
              )}
            </div>

            <div>
              <label htmlFor="qCodeSize" className="block text-sm font-medium text-gray-700">
                Product Size *
              </label>
              <div className="mt-1 relative">
                <select
                  id="qCodeSize"
                  value={treatmentInfo.qCodeSize}
                  onChange={(e) => handleInputChange('qCodeSize', e.target.value)}
                  onBlur={() => handleBlur('qCodeSize')}
                  required
                  disabled={!treatmentInfo.qCodeProduct}
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    !treatmentInfo.qCodeProduct
                      ? 'bg-gray-100 cursor-not-allowed'
                      : touched.qCodeSize && errors.qCodeSize
                      ? 'border-red-300 focus:border-red-500'
                      : touched.qCodeSize && !errors.qCodeSize
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                >
                  <option value="">
                    {treatmentInfo.qCodeProduct ? 'Select Size' : 'Select Product Type First'}
                  </option>
                  {treatmentInfo.qCodeProduct && QCodeSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-8 flex items-center">
                  {renderFieldIcon('qCodeSize', treatmentInfo.qCodeSize)}
                </div>
              </div>
              {touched.qCodeSize && errors.qCodeSize && (
                <p className="mt-1 text-xs text-red-600">{errors.qCodeSize}</p>
              )}
              {treatmentInfo.qCodeProduct && treatmentInfo.qCodeSize && (
                <p className="mt-1 text-xs text-green-600">
                  Selected: {treatmentInfo.qCodeProduct}-{treatmentInfo.qCodeSize}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Treatment Est. Start Date *
              </label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  id="startDate"
                  value={treatmentInfo.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  onBlur={() => handleBlur('startDate')}
                  required
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    touched.startDate && errors.startDate
                      ? 'border-red-300 focus:border-red-500'
                      : touched.startDate && !errors.startDate
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {renderFieldIcon('startDate', treatmentInfo.startDate)}
                </div>
              </div>
              {touched.startDate && errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="numberOfApplications" className="block text-sm font-medium text-gray-700">
                Number of Applications *
              </label>
              <div className="mt-1 relative">
                <input
                  type="number"
                  id="numberOfApplications"
                  min="1"
                  value={treatmentInfo.numberOfApplications}
                  onChange={(e) => handleInputChange('numberOfApplications', parseInt(e.target.value))}
                  onBlur={() => handleBlur('numberOfApplications')}
                  required
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    touched.numberOfApplications && errors.numberOfApplications
                      ? 'border-red-300 focus:border-red-500'
                      : touched.numberOfApplications && !errors.numberOfApplications
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {renderFieldIcon('numberOfApplications', treatmentInfo.numberOfApplications)}
                </div>
              </div>
              {touched.numberOfApplications && errors.numberOfApplications && (
                <p className="mt-1 text-xs text-red-600">{errors.numberOfApplications}</p>
              )}
            </div>

            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                Frequency *
              </label>
              <div className="mt-1 relative">
                <select
                  id="frequency"
                  value={treatmentInfo.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  onBlur={() => handleBlur('frequency')}
                  required
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    touched.frequency && errors.frequency
                      ? 'border-red-300 focus:border-red-500'
                      : touched.frequency && !errors.frequency
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                >
                  <option value="">Select Frequency</option>
                  {FrequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-8 flex items-center">
                  {renderFieldIcon('frequency', treatmentInfo.frequency)}
                </div>
              </div>
              {touched.frequency && errors.frequency && (
                <p className="mt-1 text-xs text-red-600">{errors.frequency}</p>
              )}
            </div>

            <div>
              <label htmlFor="totalSurfaceArea" className="block text-sm font-medium text-gray-700">
                Total Surface Area (cm²) *
              </label>
              <div className="mt-1 relative">
                <input
                  type="number"
                  id="totalSurfaceArea"
                  min="0"
                  step="0.1"
                  value={treatmentInfo.totalSurfaceArea}
                  onChange={(e) => handleInputChange('totalSurfaceArea', parseFloat(e.target.value))}
                  onBlur={() => handleBlur('totalSurfaceArea')}
                  required
                  className={`block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                    touched.totalSurfaceArea && errors.totalSurfaceArea
                      ? 'border-red-300 focus:border-red-500'
                      : touched.totalSurfaceArea && !errors.totalSurfaceArea
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-[#2C3E50]'
                  }`}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {renderFieldIcon('totalSurfaceArea', treatmentInfo.totalSurfaceArea)}
                </div>
              </div>
              {touched.totalSurfaceArea && errors.totalSurfaceArea && (
                <p className="mt-1 text-xs text-red-600">{errors.totalSurfaceArea}</p>
              )}
            </div>
          </div>

          {/* Diagnosis Codes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Diagnosis Codes *</h4>
              <button
                type="button"
                onClick={addDiagnosisCode}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-[#2C3E50] bg-[#2C3E50]/10 hover:bg-[#2C3E50]/20"
              >
                Add Code
              </button>
            </div>
            <div className="space-y-4">
              {treatmentInfo.diagnosisCodes.map((diagnosisCode, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ICD-10 Code {diagnosisCode.isPrimary && '(Primary)'}
                    </label>
                    <input
                      type="text"
                      value={diagnosisCode.code}
                      onChange={(e) => handleDiagnosisCodeChange(index, 'code', e.target.value)}
                      onBlur={() => handleBlur(`diagnosisCode_${index}`)}
                      className={`mt-1 block w-full rounded-md border py-2 px-3 shadow-sm focus:ring-[#2C3E50] sm:text-sm ${
                        touched[`diagnosisCode_${index}`] && errors.diagnosisCodes?.[index]
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#2C3E50]'
                      }`}
                      placeholder="e.g., L89.003"
                    />
                    {touched[`diagnosisCode_${index}`] && errors.diagnosisCodes?.[index] && (
                      <p className="mt-1 text-xs text-red-600">{errors.diagnosisCodes[index]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={diagnosisCode.description}
                      onChange={(e) => handleDiagnosisCodeChange(index, 'description', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                      placeholder="e.g., Pressure ulcer of unspecified elbow, stage 3"
                    />
                  </div>
                  {treatmentInfo.diagnosisCodes.length > 1 && (
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeDiagnosisCode(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Code
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label htmlFor="clinicalNotes" className="block text-sm font-medium text-gray-700">
              Clinical Notes
            </label>
            <textarea
              id="clinicalNotes"
              rows={4}
              value={treatmentInfo.clinicalNotes}
              onChange={(e) => handleInputChange('clinicalNotes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
              placeholder="Additional clinical information, wound characteristics, treatment rationale..."
            />
          </div>

          {/* Required Documents */}
          <div className="border-t border-gray-200 pt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h4>
            <p className="text-sm text-gray-600 mb-6">
              Upload supporting medical documents for this treatment request. All documents will be reviewed as part of the IVR process.
            </p>

            <UniversalFileUpload
              label="Upload Treatment Document"
              description="Upload medical records, wound photos, lab results, or other supporting documentation"
              value={uploadingFile}
              onChange={handleDocumentUpload}
              onUploadProgress={setUploadProgress}
              status={uploadingFile ? (uploadProgress < 100 ? 'uploading' : 'success') : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.doc', '.docx']}
              maxSizeMB={25}
              showCamera={true}
              className="mb-6"
            />

            {/* Uploaded Documents List */}
            {documents.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-900 mb-4">Uploaded Documents</h5>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            {doc.size && (
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {renderDocumentStatus(doc.status)}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove document"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAndTreatmentStep;