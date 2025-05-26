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
  governmentIdType: string;
  governmentId: File | null;
  primaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: File | null;
    cardBack: File | null;
  };
  secondaryInsurance: {
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
      const formData = new FormData();
      
      // Add patient info
      formData.append('firstName', patientData.firstName);
      formData.append('lastName', patientData.lastName);
      formData.append('dateOfBirth', patientData.dateOfBirth);
      formData.append('gender', patientData.gender);
      formData.append('address', patientData.address);
      formData.append('city', patientData.city);
      formData.append('state', patientData.state);
      formData.append('zip', patientData.zip);
      formData.append('governmentIdType', patientData.governmentIdType);
      
      if (patientData.governmentId) {
        formData.append('governmentId', patientData.governmentId);
      }
      
      // Add primary insurance info
      formData.append('primaryInsurance.provider', patientData.primaryInsurance.provider);
      formData.append('primaryInsurance.policyNumber', patientData.primaryInsurance.policyNumber);
      formData.append('primaryInsurance.payerPhone', patientData.primaryInsurance.payerPhone);
      
      if (patientData.primaryInsurance.cardFront) {
        formData.append('primaryInsurance.cardFront', patientData.primaryInsurance.cardFront);
      }
      if (patientData.primaryInsurance.cardBack) {
        formData.append('primaryInsurance.cardBack', patientData.primaryInsurance.cardBack);
      }
      
      // Add secondary insurance info if present
      if (patientData.secondaryInsurance.provider) {
        formData.append('secondaryInsurance.provider', patientData.secondaryInsurance.provider);
        formData.append('secondaryInsurance.policyNumber', patientData.secondaryInsurance.policyNumber);
        formData.append('secondaryInsurance.payerPhone', patientData.secondaryInsurance.payerPhone);
        
        if (patientData.secondaryInsurance.cardFront) {
          formData.append('secondaryInsurance.cardFront', patientData.secondaryInsurance.cardFront);
        }
        if (patientData.secondaryInsurance.cardBack) {
          formData.append('secondaryInsurance.cardBack', patientData.secondaryInsurance.cardBack);
        }
      }

      const response = await api.post(`${PATIENTS_ENDPOINT}/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Failed to register patient');
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
}

// Export the singleton instance
const patientService = PatientService.getInstance();
export default patientService; 