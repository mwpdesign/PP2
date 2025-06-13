export interface TreatmentDocument {
  id: string;
  treatment_id: string;
  document_type: 'before_photo' | 'after_photo' | 'graft_sticker' | 'usage_log' | 'other';
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  documentType: 'before_photo' | 'after_photo' | 'graft_sticker' | 'usage_log' | 'other';
}

export interface TreatmentFormData {
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
  documents?: UploadFile[];
}

export interface Treatment {
  id: string;
  patient_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity_used: number;
  date_applied: string;
  diagnosis?: string;
  procedure_performed?: string;
  wound_location?: string;
  doctor_notes?: string;
  applied_by_id: string;
  applied_by_name: string;
  created_at: string;
  updated_at: string;
  documents?: TreatmentDocument[];
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  total_ordered: number;
  total_used: number;
  on_hand: number;
  usage_percentage: number;
  status: 'plenty' | 'low' | 'out';
}

export interface TreatmentHistoryProps {
  patientId: string;
  treatments: Treatment[];
  loading?: boolean;
  onRefresh?: () => void;
}

export interface InventorySummaryProps {
  patientId: string;
  inventory: InventoryItem[];
  loading?: boolean;
  onRefresh?: () => void;
}