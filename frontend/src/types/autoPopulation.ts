import { Patient, IVRFormData, TreatmentInfo, InsuranceDetails } from './ivr';

// Auto-population history and suggestions
export interface FormHistory {
  id: string;
  patientId: string;
  formType: 'ivr' | 'patient_intake' | 'assessment';
  formData: Partial<IVRFormData>;
  createdAt: string;
  completedAt?: string;
  success: boolean;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  code: string;
  type: 'primary' | 'secondary' | 'medicare' | 'medicaid';
  commonPolicyFormats: string[];
  contactInfo: {
    phone: string;
    website?: string;
    priorAuthRequired: boolean;
  };
  coverage: {
    woundCare: boolean;
    skinSubstitutes: boolean;
    negativePresssure: boolean;
  };
}

export interface FieldSuggestion {
  field: string;
  value: string;
  confidence: number; // 0-1 scale
  source: 'history' | 'template' | 'ai' | 'database';
  metadata?: {
    lastUsed?: string;
    frequency?: number;
    patientSpecific?: boolean;
  };
}

export interface AutoPopulationContext {
  patientId: string;
  formType: string;
  currentFieldValues: Record<string, any>;
  userRole: string;
  facilityId?: string;
}

export interface AutoPopulationResult {
  suggestions: FieldSuggestion[];
  prefilledData: Partial<IVRFormData>;
  confidence: number;
  source: string;
  auditTrail: {
    action: string;
    timestamp: string;
    userId: string;
    dataSource: string;
  }[];
}

export interface DuplicationRequest {
  sourceIVRId: string;
  targetPatientId: string;
  fieldsToInclude: string[];
  preserveTimestamps: boolean;
}

export interface DuplicationResult {
  success: boolean;
  duplicatedData: Partial<IVRFormData>;
  excludedFields: string[];
  warnings: string[];
  auditTrail: {
    action: string;
    sourceId: string;
    timestamp: string;
    userId: string;
  };
}

// Common medical conditions and their typical form data
export interface MedicalConditionTemplate {
  id: string;
  condition: string;
  icd10Codes: string[];
  commonTreatments: Partial<TreatmentInfo>;
  typicalProducts: string[];
  averageDuration: number; // in days
  frequencyPattern: 'weekly' | 'bi-weekly' | 'monthly';
  notes: string;
}

// Insurance auto-complete search parameters
export interface InsuranceSearchParams {
  query: string;
  patientState?: string;
  facilityType?: string;
  limit?: number;
}

export interface InsuranceSearchResult {
  providers: InsuranceProvider[];
  suggestions: {
    policyFormat: string;
    groupNumberRequired: boolean;
    priorAuthRequired: boolean;
  };
}

// Auto-population service configuration
export interface AutoPopulationConfig {
  enablePatientHistory: boolean;
  enableInsuranceAutoComplete: boolean;
  enableContextualSuggestions: boolean;
  enableFormDuplication: boolean;
  maxHistoryItems: number;
  suggestionThreshold: number; // minimum confidence to show suggestion
  auditLevel: 'basic' | 'detailed' | 'comprehensive';
}

// Analytics for auto-population effectiveness
export interface AutoPopulationAnalytics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  timeSaved: number; // in seconds
  accuracyRate: number; // percentage
  mostUsedSuggestions: string[];
  userFeedback: {
    helpful: number;
    notHelpful: number;
    comments: string[];
  };
}