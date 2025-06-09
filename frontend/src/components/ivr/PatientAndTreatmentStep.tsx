import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Patient, TreatmentInfo, ProductsWithSizes, FrequencyOptions, Document } from '../../types/ivr';
import { ExclamationCircleIcon, CheckCircleIcon, DocumentIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  selectedProducts?: string;
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
      case 'selectedProducts':
        const hasProducts = treatmentInfo.selectedProducts?.some(product =>
          product.sizes.some(size => size.quantity > 0)
        );
        return !hasProducts ? 'At least one product with quantity is required' : undefined;
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
      if (field !== 'diagnosisCodes' && field !== 'clinicalNotes' && field !== 'skinSubstituteAcknowledged' && field !== 'qCode' && field !== 'qCodeProduct' && field !== 'qCodeSize') {
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

  // Product selection handlers
  const addProduct = (productCode: string) => {
    const productData = ProductsWithSizes.find(p => p.productCode === productCode);
    if (!productData) return;

    const newProduct = {
      productCode: productData.productCode,
      productName: productData.productName,
      sizes: productData.sizes.map(size => ({
        ...size,
        quantity: 0
      }))
    };

    const updatedProducts = [...(treatmentInfo.selectedProducts || []), newProduct];
    handleInputChange('selectedProducts', updatedProducts);
  };

  const removeProduct = (productIndex: number) => {
    const updatedProducts = treatmentInfo.selectedProducts?.filter((_, index) => index !== productIndex) || [];
    handleInputChange('selectedProducts', updatedProducts);
  };

  const updateProductQuantity = (productIndex: number, sizeIndex: number, quantity: number) => {
    if (!treatmentInfo.selectedProducts) return;

    const updatedProducts = [...treatmentInfo.selectedProducts];
    updatedProducts[productIndex].sizes[sizeIndex].quantity = Math.max(0, quantity);
    handleInputChange('selectedProducts', updatedProducts);
  };

  const calculateTotalCost = (product: any) => {
    return product.sizes.reduce((total: number, size: any) => {
      return total + (size.quantity * (size.unitPrice || 0));
    }, 0);
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

          {/* Product Selection */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Product Selection *</h4>
              <div className="flex space-x-2">
                {ProductsWithSizes.map(product => (
                  <button
                    key={product.productCode}
                    type="button"
                    onClick={() => addProduct(product.productCode)}
                    disabled={treatmentInfo.selectedProducts?.some(p => p.productCode === product.productCode)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add {product.productName}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Products */}
            {treatmentInfo.selectedProducts && treatmentInfo.selectedProducts.length > 0 ? (
              <div className="space-y-6">
                {treatmentInfo.selectedProducts.map((product, productIndex) => (
                  <div key={productIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-md font-medium text-gray-900">
                        {product.productCode} - {product.productName}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeProduct(productIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dimensions
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {product.sizes.map((size, sizeIndex) => (
                            <tr key={sizeIndex}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {size.size}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {size.dimensions}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                ${size.unitPrice?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={size.quantity}
                                  onChange={(e) => updateProductQuantity(productIndex, sizeIndex, parseInt(e.target.value) || 0)}
                                  className="w-20 rounded-md border border-gray-300 py-1 px-2 text-sm focus:border-[#2C3E50] focus:ring-[#2C3E50]"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                ${((size.quantity || 0) * (size.unitPrice || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                              Product Total:
                            </td>
                            <td className="px-4 py-2 text-sm font-bold text-gray-900">
                              ${calculateTotalCost(product).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No products selected. Click "Add Product" to begin.</p>
              </div>
            )}

            {touched.selectedProducts && errors.selectedProducts && (
              <p className="mt-2 text-sm text-red-600">{errors.selectedProducts}</p>
            )}
          </div>

          {/* Treatment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnosis Codes</h3>
            <div className="space-y-4">
              {treatmentInfo.diagnosisCodes.map((diagnosis, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {index === 0 ? 'Primary Diagnosis Code *' : `Additional Diagnosis Code ${index}`}
                    </label>
                    <input
                      type="text"
                      value={diagnosis.code}
                      onChange={(e) => handleDiagnosisCodeChange(index, 'code', e.target.value)}
                      required={index === 0}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                      placeholder="Enter ICD-10 code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={diagnosis.description}
                      onChange={(e) => handleDiagnosisCodeChange(index, 'description', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                      placeholder="Enter diagnosis description"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addDiagnosisCode}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50]"
              >
                + Add More Diagnosis Codes
              </button>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="border-t border-gray-200 pt-6">
            <label htmlFor="clinicalNotes" className="block text-sm font-medium text-gray-700">
              Clinical Notes
            </label>
            <textarea
              id="clinicalNotes"
              rows={4}
              value={treatmentInfo.clinicalNotes}
              onChange={(e) => handleInputChange('clinicalNotes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
              placeholder="Enter any additional clinical notes or observations"
            />
          </div>
        </div>
      </div>

      {/* Supporting Documents */}
      {onDocumentsChange && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>

                     <UniversalFileUpload
             label="Upload Treatment Document"
             description="Upload medical records, wound photos, lab results, or other supporting documentation"
             onChange={handleDocumentUpload}
             acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
             maxSizeMB={10}
             multiple={false}
             className="mb-4"
           />

          {uploadingFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Uploading {uploadingFile.name}...</span>
                <span className="text-sm text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Uploaded Documents</h4>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : ''} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderDocumentStatus(doc.status)}
                    <button
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientAndTreatmentStep;