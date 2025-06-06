import { AxiosError } from 'axios';
import api from './api';
import config from '../config';

const PATIENTS_ENDPOINT = `/api/v1/patients`;

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email?: string;
  phone?: string;
  governmentIdType?: string;
  governmentId?: File | null;
  primaryInsurance?: {
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
}

class PatientService {
  private static instance: PatientService;

  private constructor() {}

  static getInstance(): PatientService {
    if (!PatientService.instance) {
      PatientService.instance = new PatientService();
    }
    return PatientService.instance;
  }

  async registerPatient(patientData: PatientFormData): Promise<any> {
    try {
      // First, register the patient with basic info
      const payload = {
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        email: patientData.email || `${patientData.firstName.toLowerCase()}.${patientData.lastName.toLowerCase()}@temp.com`,
        date_of_birth: patientData.dateOfBirth,
        phone: patientData.phone || '',
        address: `${patientData.address}, ${patientData.city}, ${patientData.state} ${patientData.zip}`,
      };

      const response = await api.post(`${PATIENTS_ENDPOINT}/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const patient = response.data;

      // Upload documents if they exist
      if (patientData.governmentId) {
        await this.uploadDocument(patient.id, patientData.governmentId, 'identification', 'government_id', 'Government ID');
      }

      if (patientData.primaryInsurance?.cardFront) {
        await this.uploadDocument(patient.id, patientData.primaryInsurance.cardFront, 'insurance', 'primary_front', 'Primary Insurance Card (Front)');
      }

      if (patientData.primaryInsurance?.cardBack) {
        await this.uploadDocument(patient.id, patientData.primaryInsurance.cardBack, 'insurance', 'primary_back', 'Primary Insurance Card (Back)');
      }

      return patient;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to register patient');
      }
      throw error;
    }
  }

  async uploadDocument(
    patientId: string,
    file: File,
    documentType: string,
    documentCategory: string,
    displayName?: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documentType);
      formData.append('document_category', documentCategory);
      if (displayName) {
        formData.append('display_name', displayName);
      }

      const response = await api.post(`${PATIENTS_ENDPOINT}/${patientId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to upload document');
      }
      throw error;
    }
  }

  async searchPatients(query: string = ''): Promise<any[]> {
    try {
      const response = await api.get(PATIENTS_ENDPOINT, {
        params: { query },
      });
      return response.data.patients;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to search patients');
      }
      throw error;
    }
  }

  async getPatient(patientId: string): Promise<any> {
    try {
      const response = await api.get(`${PATIENTS_ENDPOINT}/${patientId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to get patient details');
      }
      throw error;
    }
  }

  async downloadDocument(patientId: string, documentId: string): Promise<void> {
    try {
      const response = await api.get(`${PATIENTS_ENDPOINT}/${patientId}/documents/${documentId}/download`);
      const { download_url, filename } = response.data;

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = download_url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to download document');
      }
      throw error;
    }
  }
}

// Export the singleton instance
const patientService = PatientService.getInstance();
export default patientService;