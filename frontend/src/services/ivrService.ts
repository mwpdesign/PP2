import { AxiosError } from 'axios';
import api from './api';
import config from '../config';
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
      const response = await api.get<IVRQueueResponse>(config.getAPIEndpoint('/api/v1/ivr/queue'), { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReviewQueue(params: IVRQueueParams): Promise<IVRQueueResponse> {
    try {
      const response = await api.get<IVRQueueResponse>(config.getAPIEndpoint('/api/v1/ivr/review-queue'), { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createIVRRequest(request: IVRRequest): Promise<IVRRequest> {
    try {
      const response = await api.post<IVRRequest>(config.getAPIEndpoint('/api/v1/ivr/requests'), request);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async approveIVRRequest(id: string, approval: IVRApproval): Promise<void> {
    try {
      await api.post(config.getAPIEndpoint(`/api/v1/ivr/requests/${id}/approve`), approval);
    } catch (error) {
      this.handleError(error);
    }
  }

  async rejectIVRRequest(id: string, rejection: IVRApproval): Promise<void> {
    try {
      await api.post(config.getAPIEndpoint(`/api/v1/ivr/requests/${id}/reject`), rejection);
    } catch (error) {
      this.handleError(error);
    }
  }

  async processBatch(action: IVRBatchAction): Promise<IVRBatchResult> {
    try {
      const response = await api.post<IVRBatchResult>(
        config.getAPIEndpoint('/api/v1/ivr/batch'),
        action
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async submitRequest(request: IVRRequest): Promise<void> {
    try {
      await api.post(config.getAPIEndpoint('/api/v1/ivr/submit'), request);
    } catch (error) {
      this.handleError(error);
    }
  }

  async batchAction(action: IVRBatchAction): Promise<IVRBatchResult> {
    try {
      const response = await api.post<IVRBatchResult>(
        config.getAPIEndpoint('/api/v1/ivr/batch'),
        action
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async approve(approval: IVRApproval): Promise<void> {
    try {
      await api.post(config.getAPIEndpoint('/api/v1/ivr/approve'), approval);
    } catch (error) {
      this.handleError(error);
    }
  }

  async escalate(escalation: IVREscalation): Promise<void> {
    try {
      await api.post(config.getAPIEndpoint('/api/v1/ivr/escalate'), escalation);
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const response = await api.get<Patient[]>(config.getAPIEndpoint('/api/v1/patients/search'), {
        params: { query },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchProviders(query: string): Promise<Provider[]> {
    try {
      const response = await api.get<Provider[]>(config.getAPIEndpoint('/api/v1/providers/search'), {
        params: { query },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMetrics(dateRange: '7d' | '30d' | '90d'): Promise<any> {
    try {
      const response = await api.get(config.getAPIEndpoint('/api/v1/ivr/metrics'), {
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
        config.getAPIEndpoint(`/api/v1/ivr/${ivrId}/documents`),
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
        config.getAPIEndpoint(`/api/v1/ivr/${ivrId}/documents/${documentId}/url`)
      );
      return response.data.url;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
    try {
      const response = await api.get<DocumentAnnotation[]>(
        config.getAPIEndpoint(`/api/v1/ivr/documents/${documentId}/annotations`)
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
        config.getAPIEndpoint(`/api/v1/ivr/documents/${documentId}/annotations/${annotationId}`),
        data
      );
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default IVRService.getInstance(); 