import axios, { AxiosError } from 'axios';
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
} from '../types/ivr';
import config from '../config';

const IVR_ENDPOINT = `${config.API_BASE_URL}/api/v1/ivr`;

// Error handling types
interface APIError {
  message: string;
  code: string;
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class IVRService {
  private static instance: IVRService;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {}

  static getInstance(): IVRService {
    if (!IVRService.instance) {
      IVRService.instance = new IVRService();
    }
    return IVRService.instance;
  }

  // Error handling
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message);
      }
    }
    throw error;
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    cache.clear();
  }

  // API Methods
  async getReviewQueue(params: IVRQueueParams): Promise<IVRQueueResponse> {
    try {
      const response = await axios.get<IVRQueueResponse>(`${IVR_ENDPOINT}/queue`, {
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getIVRRequest(id: string): Promise<IVRRequest> {
    const cacheKey = `ivr-${id}`;
    const cached = this.getCached<IVRRequest>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get<IVRRequest>(`${IVR_ENDPOINT}/${id}`);
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createIVRRequest(data: Partial<IVRRequest>): Promise<IVRRequest> {
    try {
      const response = await axios.post<IVRRequest>(IVR_ENDPOINT, data);
      this.clearCache();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateIVRRequest(
    id: string,
    data: Partial<IVRRequest>
  ): Promise<IVRRequest> {
    try {
      const response = await axios.put<IVRRequest>(`${IVR_ENDPOINT}/${id}`, data);
      this.clearCache();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async approveIVRRequest(
    id: string,
    approval: Partial<IVRApproval>
  ): Promise<IVRRequest> {
    try {
      const response = await axios.post<IVRRequest>(
        `${IVR_ENDPOINT}/${id}/approve`,
        approval
      );
      this.clearCache();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async rejectIVRRequest(
    id: string,
    rejection: Partial<IVRApproval>
  ): Promise<IVRRequest> {
    try {
      const response = await axios.post<IVRRequest>(
        `${IVR_ENDPOINT}/${id}/reject`,
        rejection
      );
      this.clearCache();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async escalateIVRRequest(
    id: string,
    escalation: Partial<IVREscalation>
  ): Promise<IVRRequest> {
    try {
      const response = await axios.post<IVRRequest>(
        `${IVR_ENDPOINT}/${id}/escalate`,
        escalation
      );
      this.clearCache();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async processBatch(
    action: 'approve' | 'reject',
    requestIds: string[]
  ): Promise<IVRBatchResult> {
    try {
      const batchAction: IVRBatchAction = {
        action,
        requestIds,
      };
      const response = await axios.post<IVRBatchResult>(
        `${IVR_ENDPOINT}/batch`,
        batchAction
      );
      this.clearCache();
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

      const response = await axios.post<IVRRequest>(
        `${IVR_ENDPOINT}/${ivrId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      this.clearCache();
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
      await axios.put(
        `${IVR_ENDPOINT}/documents/${documentId}/annotations/${annotationId}`,
        data
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentUrl(ivrId: string, documentId: string): Promise<string> {
    try {
      const response = await axios.get<{ url: string }>(
        `${IVR_ENDPOINT}/${ivrId}/documents/${documentId}/url`
      );
      return response.data.url;
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const response = await axios.get<Patient[]>(
        `${config.API_BASE_URL}/api/v1/patients/search`,
        {
          params: { query },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchProviders(query: string): Promise<Provider[]> {
    try {
      const response = await axios.get<Provider[]>(
        `${config.API_BASE_URL}/api/v1/providers/search`,
        {
          params: { query },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMetrics(dateRange: '7d' | '30d' | '90d') {
    try {
      const response = await axios.get(`${IVR_ENDPOINT}/metrics`, {
        params: { range: dateRange },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
    try {
      const response = await axios.get<DocumentAnnotation[]>(
        `${IVR_ENDPOINT}/documents/${documentId}/annotations`
      );
      // Add default values for type and color if not present
      return response.data.map(annotation => ({
        ...annotation,
        type: annotation.type || 'highlight',
        color: annotation.color || '#ffff00'
      }));
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Add DocumentAnnotation interface
export interface DocumentAnnotation {
  id: string;
  documentId: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: 'highlight' | 'text' | 'drawing';
  color: string;
  points?: number[];
  createdAt: string;
  updatedAt: string;
}

export default IVRService.getInstance(); 