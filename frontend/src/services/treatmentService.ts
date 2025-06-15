import { Treatment, TreatmentFormData, InventoryItem } from '../types/treatments';

const API_BASE_URL = '';  // Use empty string for relative URLs with Vite proxy

interface TreatmentCreateRequest {
  patient_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity_used: number;
  date_applied: string;
  diagnosis: string;
  procedure_performed: string;
  wound_location: string;
  doctor_notes: string;
}

interface TreatmentListResponse {
  total: number;
  treatments: Treatment[];
  limit: number;
  offset: number;
}

interface InventorySummaryResponse {
  patient_id: string;
  total_products: number;
  total_ordered: number;
  total_used: number;
  total_on_hand: number;
  products: InventoryItem[];
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  products: Array<{
    id: string;
    product_name: string;
    quantity: number;
    used_quantity?: number;
    available_quantity: number;
  }>;
}

class TreatmentService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async createTreatment(treatmentData: TreatmentFormData): Promise<Treatment> {
    const requestData: TreatmentCreateRequest = {
      patient_id: treatmentData.patient_id,
      order_id: treatmentData.order_id,
      product_id: treatmentData.product_id,
      product_name: treatmentData.product_name,
      quantity_used: treatmentData.quantity_used,
      date_applied: treatmentData.date_applied,
      diagnosis: treatmentData.diagnosis,
      procedure_performed: treatmentData.procedure_performed,
      wound_location: treatmentData.wound_location,
      doctor_notes: treatmentData.doctor_notes,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/treatments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const result = await this.handleResponse<Treatment>(response);

    // Transform backend response to frontend format
    return {
      id: result.id,
      patient_id: result.patient_id,
      order_id: result.order_id,
      product_id: result.product_id,
      product_name: result.product_name,
      quantity_used: result.quantity_used,
      date_applied: result.date_applied,
      diagnosis: result.diagnosis,
      procedure_performed: result.procedure_performed,
      wound_location: result.wound_location,
      doctor_notes: result.doctor_notes,
      applied_by_id: result.recorded_by,
      applied_by_name: result.recorded_by_name || 'Unknown',
      created_at: result.created_at,
      updated_at: result.updated_at,
      documents: [], // Documents will be handled separately
    };
  }

  async getTreatmentsByPatient(
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ treatments: Treatment[]; total: number }> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/treatments/patient/${patientId}?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    const result = await this.handleResponse<TreatmentListResponse>(response);

    // Transform backend response to frontend format
    const treatments = result.treatments.map(treatment => ({
      id: treatment.id,
      patient_id: treatment.patient_id,
      order_id: treatment.order_id,
      product_id: treatment.product_id,
      product_name: treatment.product_name,
      quantity_used: treatment.quantity_used,
      date_applied: treatment.date_applied,
      diagnosis: treatment.diagnosis,
      procedure_performed: treatment.procedure_performed,
      wound_location: treatment.wound_location,
      doctor_notes: treatment.doctor_notes,
      applied_by_id: treatment.recorded_by,
      applied_by_name: treatment.recorded_by_name || 'Unknown',
      created_at: treatment.created_at,
      updated_at: treatment.updated_at,
      documents: [], // Documents will be handled separately
    }));

    return {
      treatments,
      total: result.total,
    };
  }

  async getPatientInventory(patientId: string): Promise<InventoryItem[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/treatments/patients/${patientId}/inventory`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    const result = await this.handleResponse<InventorySummaryResponse>(response);
    return result.products;
  }

  async getPatientOrders(patientId: string): Promise<Order[]> {
    // For now, we'll use mock data since orders API might not be fully implemented
    // TODO: Replace with actual API call when orders endpoint is available
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/orders?patient_id=${patientId}&status=received,completed`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Orders API not available');
      }

      return await this.handleResponse<Order[]>(response);
    } catch (error) {
      console.warn('Orders API not available, using mock data:', error);

      // Return mock orders for development
      return [
        {
          id: 'order-1',
          order_number: 'ORD-2024-001',
          status: 'received',
          products: [
            {
              id: 'prod-1',
              product_name: 'Apligraf Skin Graft 4x4 inch',
              quantity: 10,
              used_quantity: 3,
              available_quantity: 7,
            },
            {
              id: 'prod-2',
              product_name: 'Dermagraft Wound Dressing 2x2 inch',
              quantity: 5,
              used_quantity: 1,
              available_quantity: 4,
            },
          ],
        },
        {
          id: 'order-2',
          order_number: 'ORD-2024-002',
          status: 'completed',
          products: [
            {
              id: 'prod-3',
              product_name: 'Integra Bilayer Matrix 6x6 inch',
              quantity: 20,
              used_quantity: 5,
              available_quantity: 15,
            },
          ],
        },
      ];
    }
  }

  async uploadTreatmentDocuments(
    treatmentId: string,
    files: File[]
  ): Promise<Array<{ id: string; file_name: string; file_url: string }>> {
    // For now, simulate document upload since S3 isn't set up
    // TODO: Implement actual document upload when S3 is configured
    console.log('Simulating document upload for treatment:', treatmentId, files);

    return files.map((file, index) => ({
      id: `doc-${treatmentId}-${index}`,
      file_name: file.name,
      file_url: URL.createObjectURL(file), // Temporary URL for preview
    }));
  }
}

export default new TreatmentService();