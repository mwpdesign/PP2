import {
  FormHistory,
  InsuranceProvider,
  FieldSuggestion,
  AutoPopulationContext,
  AutoPopulationResult,
  DuplicationRequest,
  DuplicationResult,
  MedicalConditionTemplate,
  InsuranceSearchParams,
  InsuranceSearchResult,
  AutoPopulationConfig,
  AutoPopulationAnalytics
} from '../types/autoPopulation';
import { Patient, IVRFormData, TreatmentInfo } from '../types/ivr';
import { mockPatientService } from './mockPatientService';

// Mock insurance providers database
const mockInsuranceProviders: InsuranceProvider[] = [
  {
    id: 'ins_001',
    name: 'Blue Cross Blue Shield',
    code: 'BCBS',
    type: 'primary',
    commonPolicyFormats: ['ABC123456789', 'XYZ-123-456-789'],
    contactInfo: {
      phone: '1-800-BCBS-123',
      website: 'https://bcbs.com',
      priorAuthRequired: true
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: true,
      negativePresssure: true
    }
  },
  {
    id: 'ins_002',
    name: 'Aetna',
    code: 'AET',
    type: 'primary',
    commonPolicyFormats: ['W123456789', 'AET-123-456'],
    contactInfo: {
      phone: '1-800-AETNA-01',
      website: 'https://aetna.com',
      priorAuthRequired: true
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: false,
      negativePresssure: true
    }
  },
  {
    id: 'ins_003',
    name: 'UnitedHealthcare',
    code: 'UHC',
    type: 'primary',
    commonPolicyFormats: ['UHC123456789', '123456789UHC'],
    contactInfo: {
      phone: '1-800-UHC-1234',
      website: 'https://uhc.com',
      priorAuthRequired: false
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: true,
      negativePresssure: true
    }
  },
  {
    id: 'ins_004',
    name: 'Cigna',
    code: 'CIG',
    type: 'primary',
    commonPolicyFormats: ['CIG123456789', 'C-123-456-789'],
    contactInfo: {
      phone: '1-800-CIGNA-24',
      website: 'https://cigna.com',
      priorAuthRequired: true
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: true,
      negativePresssure: false
    }
  },
  {
    id: 'ins_005',
    name: 'Humana',
    code: 'HUM',
    type: 'primary',
    commonPolicyFormats: ['H123456789', 'HUM-123-456'],
    contactInfo: {
      phone: '1-800-HUMANA-1',
      website: 'https://humana.com',
      priorAuthRequired: false
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: false,
      negativePresssure: true
    }
  },
  {
    id: 'ins_006',
    name: 'Medicare',
    code: 'MED',
    type: 'medicare',
    commonPolicyFormats: ['1AB2CD3EF45', '123-45-6789A'],
    contactInfo: {
      phone: '1-800-MEDICARE',
      website: 'https://medicare.gov',
      priorAuthRequired: true
    },
    coverage: {
      woundCare: true,
      skinSubstitutes: true,
      negativePresssure: true
    }
  }
];

// Mock medical condition templates
const mockConditionTemplates: MedicalConditionTemplate[] = [
  {
    id: 'cond_001',
    condition: 'Diabetic Foot Ulcer',
    icd10Codes: ['E11.621', 'E10.621', 'L97.4'],
    commonTreatments: {
      qCode: 'Q4102',
      frequency: 'weekly',
      numberOfApplications: 4,
      totalSurfaceArea: 5.0,
      clinicalNotes: 'Diabetic foot ulcer requiring advanced wound care matrix'
    },
    typicalProducts: ['Q4102', 'Q4106', 'Q4110'],
    averageDuration: 28,
    frequencyPattern: 'weekly',
    notes: 'Monitor blood glucose levels and offloading'
  },
  {
    id: 'cond_002',
    condition: 'Pressure Ulcer Stage 3',
    icd10Codes: ['L89.003', 'L89.103', 'L89.203'],
    commonTreatments: {
      qCode: 'Q4124',
      frequency: 'bi-weekly',
      numberOfApplications: 6,
      totalSurfaceArea: 8.0,
      clinicalNotes: 'Stage 3 pressure ulcer requiring bioengineered tissue matrix'
    },
    typicalProducts: ['Q4124', 'Q4128', 'Q4132'],
    averageDuration: 42,
    frequencyPattern: 'bi-weekly',
    notes: 'Ensure proper pressure relief and nutrition'
  },
  {
    id: 'cond_003',
    condition: 'Venous Leg Ulcer',
    icd10Codes: ['I87.2', 'L97.2', 'I83.0'],
    commonTreatments: {
      qCode: 'Q4101',
      frequency: 'weekly',
      numberOfApplications: 8,
      totalSurfaceArea: 12.0,
      clinicalNotes: 'Chronic venous leg ulcer with compression therapy'
    },
    typicalProducts: ['Q4101', 'Q4121', 'Q4133'],
    averageDuration: 56,
    frequencyPattern: 'weekly',
    notes: 'Compression therapy essential for healing'
  }
];

// Mock form history storage (in real app, this would be in database)
let mockFormHistory: FormHistory[] = [];

class SmartAutoPopulationService {
  private config: AutoPopulationConfig = {
    enablePatientHistory: true,
    enableInsuranceAutoComplete: true,
    enableContextualSuggestions: true,
    enableFormDuplication: true,
    maxHistoryItems: 10,
    suggestionThreshold: 0.6,
    auditLevel: 'detailed'
  };

  private analytics: AutoPopulationAnalytics = {
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    rejectedSuggestions: 0,
    timeSaved: 0,
    accuracyRate: 0,
    mostUsedSuggestions: [],
    userFeedback: {
      helpful: 0,
      notHelpful: 0,
      comments: []
    }
  };

  /**
   * Get patient form history for auto-population
   */
  async getPatientHistory(patientId: string): Promise<FormHistory[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const history = mockFormHistory
      .filter(h => h.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, this.config.maxHistoryItems);

    return history;
  }

  /**
   * Search insurance providers with auto-complete
   */
  async searchInsuranceProviders(params: InsuranceSearchParams): Promise<InsuranceSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const query = params.query.toLowerCase();
    const filteredProviders = mockInsuranceProviders.filter(provider =>
      provider.name.toLowerCase().includes(query) ||
      provider.code.toLowerCase().includes(query)
    ).slice(0, params.limit || 5);

    // Generate suggestions based on first match
    const firstMatch = filteredProviders[0];
    const suggestions = firstMatch ? {
      policyFormat: firstMatch.commonPolicyFormats[0],
      groupNumberRequired: firstMatch.type !== 'medicare',
      priorAuthRequired: firstMatch.contactInfo.priorAuthRequired
    } : {
      policyFormat: 'ABC123456789',
      groupNumberRequired: true,
      priorAuthRequired: true
    };

    return {
      providers: filteredProviders,
      suggestions
    };
  }

  /**
   * Duplicate IVR form data from previous submission
   */
  async duplicateIVRForm(request: DuplicationRequest): Promise<DuplicationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      // Find source form in history
      const sourceHistory = mockFormHistory.find(h => h.id === request.sourceIVRId);
      if (!sourceHistory) {
        return {
          success: false,
          duplicatedData: {},
          excludedFields: [],
          warnings: ['Source IVR form not found'],
          auditTrail: {
            action: 'duplicate_form_failed',
            sourceId: request.sourceIVRId,
            timestamp: new Date().toISOString(),
            userId: 'current_user' // In real app, get from auth context
          }
        };
      }

      // Extract only requested fields
      const duplicatedData: Partial<IVRFormData> = {};
      const excludedFields: string[] = [];

      if (request.fieldsToInclude.includes('treatmentInfo') && sourceHistory.formData.treatmentInfo) {
        duplicatedData.treatmentInfo = {
          ...sourceHistory.formData.treatmentInfo,
          // Reset time-sensitive fields
          startDate: request.preserveTimestamps ? sourceHistory.formData.treatmentInfo.startDate : '',
        };
      }

      if (request.fieldsToInclude.includes('selectedProducts') && sourceHistory.formData.selectedProducts) {
        duplicatedData.selectedProducts = sourceHistory.formData.selectedProducts;
      }

      // Always exclude patient-specific data when duplicating to different patient
      if (request.targetPatientId !== sourceHistory.patientId) {
        excludedFields.push('patientId', 'insuranceDetails');
      }

      return {
        success: true,
        duplicatedData,
        excludedFields,
        warnings: excludedFields.length > 0 ? ['Some patient-specific fields were excluded'] : [],
        auditTrail: {
          action: 'duplicate_form_success',
          sourceId: request.sourceIVRId,
          timestamp: new Date().toISOString(),
          userId: 'current_user'
        }
      };
    } catch (error) {
      return {
        success: false,
        duplicatedData: {},
        excludedFields: [],
        warnings: ['Error during form duplication'],
        auditTrail: {
          action: 'duplicate_form_error',
          sourceId: request.sourceIVRId,
          timestamp: new Date().toISOString(),
          userId: 'current_user'
        }
      };
    }
  }

  /**
   * Get contextual field suggestions based on current form state
   */
  async getFieldSuggestions(context: AutoPopulationContext): Promise<FieldSuggestion[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));

    const suggestions: FieldSuggestion[] = [];

    // Get patient history for context
    const history = await this.getPatientHistory(context.patientId);

    // Suggest based on patient history
    if (history.length > 0) {
      const lastForm = history[0];
      if (lastForm.formData.treatmentInfo?.qCode) {
        suggestions.push({
          field: 'qCode',
          value: lastForm.formData.treatmentInfo.qCode,
          confidence: 0.8,
          source: 'history',
          metadata: {
            lastUsed: lastForm.createdAt,
            frequency: 1,
            patientSpecific: true
          }
        });
      }
    }

    // Suggest based on medical condition templates
    const currentCondition = context.currentFieldValues.primaryCondition;
    if (currentCondition) {
      const matchingTemplate = mockConditionTemplates.find(t =>
        t.condition.toLowerCase().includes(currentCondition.toLowerCase()) ||
        currentCondition.toLowerCase().includes(t.condition.toLowerCase())
      );

      if (matchingTemplate) {
        if (matchingTemplate.commonTreatments.qCode) {
          suggestions.push({
            field: 'qCode',
            value: matchingTemplate.commonTreatments.qCode,
            confidence: 0.9,
            source: 'template',
            metadata: {
              frequency: 5,
              patientSpecific: false
            }
          });
        }

        if (matchingTemplate.commonTreatments.frequency) {
          suggestions.push({
            field: 'frequency',
            value: matchingTemplate.commonTreatments.frequency,
            confidence: 0.85,
            source: 'template'
          });
        }
      }
    }

    // Filter by confidence threshold
    return suggestions.filter(s => s.confidence >= this.config.suggestionThreshold);
  }

  /**
   * Get comprehensive auto-population result for a form
   */
  async getAutoPopulationResult(context: AutoPopulationContext): Promise<AutoPopulationResult> {
    const [history, suggestions] = await Promise.all([
      this.getPatientHistory(context.patientId),
      this.getFieldSuggestions(context)
    ]);

    // Build prefilled data from history and suggestions
    const prefilledData: Partial<IVRFormData> = {};

    if (history.length > 0 && this.config.enablePatientHistory) {
      const lastForm = history[0];
      if (lastForm.formData.treatmentInfo) {
        prefilledData.treatmentInfo = {
          ...lastForm.formData.treatmentInfo,
          // Reset time-sensitive fields
          startDate: '',
          clinicalNotes: ''
        };
      }
    }

    // Apply high-confidence suggestions
    suggestions.forEach(suggestion => {
      if (suggestion.confidence > 0.8) {
        if (suggestion.field === 'qCode' && prefilledData.treatmentInfo) {
          prefilledData.treatmentInfo.qCode = suggestion.value;
        }
        if (suggestion.field === 'frequency' && prefilledData.treatmentInfo) {
          prefilledData.treatmentInfo.frequency = suggestion.value as any;
        }
      }
    });

    const auditTrail = [{
      action: 'auto_population_generated',
      timestamp: new Date().toISOString(),
      userId: 'current_user',
      dataSource: 'history_and_templates'
    }];

    this.analytics.totalSuggestions += suggestions.length;

    return {
      suggestions,
      prefilledData,
      confidence: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0,
      source: 'smart_auto_population',
      auditTrail
    };
  }

  /**
   * Save form data to history for future auto-population
   */
  async saveFormHistory(formData: IVRFormData, success: boolean = true): Promise<void> {
    const historyEntry: FormHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: formData.patientId,
      formType: 'ivr',
      formData,
      createdAt: new Date().toISOString(),
      completedAt: success ? new Date().toISOString() : undefined,
      success
    };

    mockFormHistory.push(historyEntry);

    // Keep only recent history to prevent memory issues
    if (mockFormHistory.length > 100) {
      mockFormHistory = mockFormHistory.slice(-50);
    }
  }

  /**
   * Record user feedback on suggestions
   */
  async recordSuggestionFeedback(suggestionId: string, helpful: boolean, comment?: string): Promise<void> {
    if (helpful) {
      this.analytics.acceptedSuggestions++;
      this.analytics.userFeedback.helpful++;
    } else {
      this.analytics.rejectedSuggestions++;
      this.analytics.userFeedback.notHelpful++;
    }

    if (comment) {
      this.analytics.userFeedback.comments.push(comment);
    }

    // Update accuracy rate
    const total = this.analytics.acceptedSuggestions + this.analytics.rejectedSuggestions;
    this.analytics.accuracyRate = total > 0 ? (this.analytics.acceptedSuggestions / total) * 100 : 0;
  }

  /**
   * Get analytics data
   */
  getAnalytics(): AutoPopulationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoPopulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoPopulationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const smartAutoPopulationService = new SmartAutoPopulationService();
export default smartAutoPopulationService;