import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import axios from 'axios';

import {
  IVRRequest,
  IVRPriority,
  Patient,
  Provider,
} from '../../types/ivr';
import ivrService from '../../services/ivrService';
import config from '../../config';

interface IVRSubmissionForm {
  patientId: string;
  providerId: string;
  facilityId: string;
  serviceType: string;
  priority: IVRPriority;
  notes?: string;
}

// Form validation schema
const schema = yup.object().shape({
  patientId: yup.string().required('Patient is required'),
  providerId: yup.string().required('Provider is required'),
  facilityId: yup.string().required('Facility is required'),
  serviceType: yup.string().required('Service type is required'),
  priority: yup.string().required('Priority is required'),
  notes: yup.string().optional(),
}) as yup.ObjectSchema<IVRSubmissionForm>;

interface IVRSubmissionProps {
  onSubmit?: (data: IVRRequest) => void;
  onSaveDraft?: (data: Partial<IVRSubmissionForm>) => void;
}

const IVRSubmission: React.FC<IVRSubmissionProps> = ({ onSubmit, onSaveDraft }) => {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<{
    patients: Patient[];
    providers: Provider[];
  }>({ patients: [], providers: [] });

  // Form initialization
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<IVRSubmissionForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      priority: IVRPriority.MEDIUM,
    },
  });

  // Auto-save draft
  const formValues = watch();
  const saveDraft = useCallback(
    (data: any) => {
      if (isDirty && onSaveDraft) {
        onSaveDraft(data);
        toast.info('Draft saved');
      }
    },
    [isDirty, onSaveDraft]
  );

  const debouncedSaveDraft = useMemo(
    () => debounce(saveDraft, 10000),
    [saveDraft]
  );

  useEffect(() => {
    debouncedSaveDraft(formValues);
    return () => {
      debouncedSaveDraft.cancel();
    };
  }, [formValues, debouncedSaveDraft]);

  // Document upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDocuments(prev => [...prev, ...acceptedFiles]);
    // Initialize progress for new files
    setUploadProgress(prev => ({
      ...prev,
      ...acceptedFiles.reduce((acc, file) => ({
        ...acc,
        [file.name]: 0,
      }), {}),
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  // Search handlers
  const handlePatientSearch = debounce(async (term: string) => {
    try {
      // Implement patient search API call
      const results = await fetch(`/api/patients/search?term=${term}`);
      const data = await results.json();
      setSearchResults(prev => ({ ...prev, patients: data }));
    } catch (error) {
      console.error('Patient search failed:', error);
      toast.error('Failed to search patients');
    }
  }, 300);

  const handleProviderSearch = debounce(async (term: string) => {
    try {
      // Implement provider search API call
      const results = await fetch(`/api/providers/search?term=${term}`);
      const data = await results.json();
      setSearchResults(prev => ({ ...prev, providers: data }));
    } catch (error) {
      console.error('Provider search failed:', error);
      toast.error('Failed to search providers');
    }
  }, 300);

  // Form submission
  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Create IVR request
      const ivrRequest = await ivrService.createIVRRequest(data);

      // Upload documents with progress tracking
      const uploadPromises = documents.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', file.type);

          await axios.post(
            `${config.API_BASE_URL}/api/v1/ivr/${ivrRequest.id}/documents`,
            formData,
            {
              onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 100)
                );
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: progress,
                }));
              },
            }
          );
        } catch (error) {
          console.error('Document upload failed:', error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      toast.success('IVR request submitted successfully');
      onSubmit?.(ivrRequest);
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to submit IVR request');
    } finally {
      setIsSubmitting(false);
      setUploadProgress({});
    }
  };

  // Document list with progress
  const DocumentList = () => (
    <div className="mt-4 space-y-2">
      {documents.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 bg-gray-50 rounded"
        >
          <div className="flex-1">
            <span className="text-sm text-gray-600">{file.name}</span>
            {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
              <div className="w-full h-1 mt-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress[file.name]}%` }}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setDocuments(documents.filter((_, i) => i !== index));
              setUploadProgress(prev => {
                const { [file.name]: removed, ...rest } = prev;
                return rest;
              });
            }}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Submit IVR Request</h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Patient
          </label>
          <Controller
            name="patientId"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="Search patient..."
                  onChange={(e) => handlePatientSearch(e.target.value)}
                />
                {errors.patientId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.patientId.message}
                  </p>
                )}
                {/* Patient search results dropdown */}
                {searchResults.patients.length > 0 && (
                  <div className="mt-2 border rounded-md shadow-sm">
                    {searchResults.patients.map((patient: Patient) => (
                      <div
                        key={patient.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedPatient(patient);
                          field.onChange(patient.id);
                        }}
                      >
                        {patient.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Provider
          </label>
          <Controller
            name="providerId"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="Search provider..."
                  onChange={(e) => handleProviderSearch(e.target.value)}
                />
                {errors.providerId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.providerId.message}
                  </p>
                )}
                {/* Provider search results dropdown */}
                {searchResults.providers.length > 0 && (
                  <div className="mt-2 border rounded-md shadow-sm">
                    {searchResults.providers.map((provider: Provider) => (
                      <div
                        key={provider.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedProvider(provider);
                          field.onChange(provider.id);
                        }}
                      >
                        {provider.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Service Type
          </label>
          <Controller
            name="serviceType"
            control={control}
            render={({ field }) => (
              <select {...field} className="form-select w-full">
                <option value="">Select service type...</option>
                <option value="consultation">Consultation</option>
                <option value="procedure">Procedure</option>
                <option value="followup">Follow-up</option>
              </select>
            )}
          />
          {errors.serviceType && (
            <p className="text-red-500 text-sm">{errors.serviceType.message}</p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <select {...field} className="form-select w-full">
                {Object.values(IVRPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.priority && (
            <p className="text-red-500 text-sm">{errors.priority.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="form-textarea w-full"
                rows={4}
                placeholder="Add any additional notes..."
              />
            )}
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Documents
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: JPEG, PNG, PDF (max 10MB)
            </p>
          </div>

          {/* Document List with Progress */}
          {documents.length > 0 && <DocumentList />}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => onSaveDraft?.(formValues)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IVRSubmission;