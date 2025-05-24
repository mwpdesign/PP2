import axios from 'axios';
import config from '../config';

const PATIENTS_ENDPOINT = `${config.API_BASE_URL}/api/v1/patients`;

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
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): PatientService {
    if (!PatientService.instance) {
      PatientService.instance = new PatientService();
    }
    return PatientService.instance;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(isFormData = false) {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (isFormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }
    return headers;
  }

  async registerPatient(formData: PatientFormData): Promise<any> {
    try {
      // Create form data for file uploads
      const data = new FormData();

      // Add patient information
      data.append('first_name', formData.firstName);
      data.append('last_name', formData.lastName);
      data.append('date_of_birth', formData.dateOfBirth);
      data.append('gender', formData.gender);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('zip', formData.zip);
      data.append('government_id_type', formData.governmentIdType);

      // Add government ID if provided
      if (formData.governmentId) {
        data.append('id_document', formData.governmentId);
      }

      // Add primary insurance information
      data.append('primary_insurance_provider', formData.primaryInsurance.provider);
      data.append('primary_insurance_policy_number', formData.primaryInsurance.policyNumber);
      data.append('primary_insurance_payer_phone', formData.primaryInsurance.payerPhone);

      // Add primary insurance cards if provided
      if (formData.primaryInsurance.cardFront) {
        data.append('insurance_card_front', formData.primaryInsurance.cardFront);
      }
      if (formData.primaryInsurance.cardBack) {
        data.append('insurance_card_back', formData.primaryInsurance.cardBack);
      }

      // Add secondary insurance information if provided
      if (formData.secondaryInsurance.provider) {
        data.append('secondary_insurance_provider', formData.secondaryInsurance.provider);
        data.append('secondary_insurance_policy_number', formData.secondaryInsurance.policyNumber);
        data.append('secondary_insurance_payer_phone', formData.secondaryInsurance.payerPhone);

        if (formData.secondaryInsurance.cardFront) {
          data.append('secondary_insurance_card_front', formData.secondaryInsurance.cardFront);
        }
        if (formData.secondaryInsurance.cardBack) {
          data.append('secondary_insurance_card_back', formData.secondaryInsurance.cardBack);
        }
      }

      const response = await axios.post(PATIENTS_ENDPOINT, data, {
        headers: this.getHeaders(true),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to register patient');
      }
      throw error;
    }
  }

  async searchPatients(query: string): Promise<any[]> {
    try {
      const response = await axios.get(`${PATIENTS_ENDPOINT}/search`, {
        params: { query },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to search patients');
      }
      throw error;
    }
  }
}

export default PatientService; 