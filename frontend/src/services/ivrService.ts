import { AxiosError } from 'axios';
import api from './api';
import {
  IVRRequest,
  IVRQueueParams,
  IVRQueueResponse,
  IVRBatchAction,
  IVRBatchResult,
  IVRApproval,
  IVREscalation,
  Patient,
  Provider,
  DocumentAnnotation,
} from '../types/ivr';

const IVR_ENDPOINT = `/api/v1/ivr`;

// Error handling types
interface APIError {
  message: string;
  code: string;
}

class IVRService {
  private static instance: IVRService;

  private constructor() {}

  static getInstance(): IVRService {
    if (!IVRService.instance) {
      IVRService.instance = new IVRService();
    }
    return IVRService.instance;
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as APIError;
      throw new Error(apiError?.message || 'An error occurred');
    }
    throw error;
  }

  async getQueue(params: IVRQueueParams): Promise<IVRQueueResponse> {
    try {
      const response = await api.get<IVRQueueResponse>(IVR_ENDPOINT, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async submitRequest(request: IVRRequest): Promise<void> {
    try {
      await api.post(`${IVR_ENDPOINT}/submit`, request);
    } catch (error) {
      this.handleError(error);
    }
  }

  async batchAction(action: IVRBatchAction): Promise<IVRBatchResult> {
    try {
      const response = await api.post<IVRBatchResult>(
        `${IVR_ENDPOINT}/batch`,
        action
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async approve(approval: IVRApproval): Promise<void> {
    try {
      await api.post(`${IVR_ENDPOINT}/approve`, approval);
    } catch (error) {
      this.handleError(error);
    }
  }

  async escalate(escalation: IVREscalation): Promise<void> {
    try {
      await api.post(`${IVR_ENDPOINT}/escalate`, escalation);
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const response = await api.get<Patient[]>(`/api/v1/patients/search`, {
        params: { query },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchProviders(query: string): Promise<Provider[]> {
    try {
      const response = await api.get<Provider[]>(`/api/v1/providers/search`, {
        params: { query },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMetrics(dateRange: '7d' | '30d' | '90d'): Promise<any> {
    try {
      const response = await api.get(`${IVR_ENDPOINT}/metrics`, {
        params: { range: dateRange },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadDocument(
    ivrId: string,
    file: File,
    documentType: string
  ): Promise<IVRRequest> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await api.post<IVRRequest>(
        `${IVR_ENDPOINT}/${ivrId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentUrl(ivrId: string, documentId: string): Promise<string> {
    try {
      const response = await api.get<{ url: string }>(
        `${IVR_ENDPOINT}/${ivrId}/documents/${documentId}/url`
      );
      return response.data.url;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
    try {
      const response = await api.get<DocumentAnnotation[]>(
        `${IVR_ENDPOINT}/documents/${documentId}/annotations`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDocumentAnnotation(
    documentId: string,
    annotationId: string,
    data: { text?: string; x?: number; y?: number }
  ): Promise<void> {
    try {
      await api.put(
        `${IVR_ENDPOINT}/documents/${documentId}/annotations/${annotationId}`,
        data
      );
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default IVRService.getInstance(); 