import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import {
  AutoPopulationContext,
  AutoPopulationResult,
  FieldSuggestion,
  InsuranceSearchParams,
  InsuranceSearchResult,
  DuplicationRequest,
  DuplicationResult,
  FormHistory
} from '../types/autoPopulation';
import { IVRFormData, Patient } from '../types/ivr';
import smartAutoPopulationService from '../services/smartAutoPopulationService';

interface UseSmartAutoPopulationOptions {
  patientId: string;
  formType: string;
  currentFieldValues: Record<string, any>;
  userRole: string;
  facilityId?: string;
  enableAutoSuggestions?: boolean;
  enableInsuranceAutoComplete?: boolean;
  debounceMs?: number;
}

interface UseSmartAutoPopulationReturn {
  // Auto-population state
  isLoading: boolean;
  suggestions: FieldSuggestion[];
  prefilledData: Partial<IVRFormData> | null;
  confidence: number;

  // Insurance auto-complete
  insuranceProviders: InsuranceSearchResult['providers'];
  insuranceLoading: boolean;
  searchInsurance: (query: string) => void;

  // Form history
  patientHistory: FormHistory[];
  historyLoading: boolean;

  // Form duplication
  duplicateForm: (request: DuplicationRequest) => Promise<DuplicationResult>;
  duplicationLoading: boolean;

  // Actions
  refreshSuggestions: () => void;
  acceptSuggestion: (suggestionId: string, helpful?: boolean) => void;
  rejectSuggestion: (suggestionId: string, comment?: string) => void;
  saveFormToHistory: (formData: IVRFormData, success?: boolean) => void;

  // Analytics
  analytics: {
    totalSuggestions: number;
    acceptedSuggestions: number;
    accuracyRate: number;
  };
}

export const useSmartAutoPopulation = (
  options: UseSmartAutoPopulationOptions
): UseSmartAutoPopulationReturn => {
  const {
    patientId,
    formType,
    currentFieldValues,
    userRole,
    facilityId,
    enableAutoSuggestions = true,
    enableInsuranceAutoComplete = true,
    debounceMs = 300
  } = options;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [prefilledData, setPrefilledData] = useState<Partial<IVRFormData> | null>(null);
  const [confidence, setConfidence] = useState(0);

  const [insuranceProviders, setInsuranceProviders] = useState<InsuranceSearchResult['providers']>([]);
  const [insuranceLoading, setInsuranceLoading] = useState(false);

  const [patientHistory, setPatientHistory] = useState<FormHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [duplicationLoading, setDuplicationLoading] = useState(false);

  // Create auto-population context
  const context: AutoPopulationContext = useMemo(() => ({
    patientId,
    formType,
    currentFieldValues,
    userRole,
    facilityId
  }), [patientId, formType, currentFieldValues, userRole, facilityId]);

  // Debounced function to get auto-population suggestions
  const debouncedGetSuggestions = useMemo(
    () => debounce(async (ctx: AutoPopulationContext) => {
      if (!enableAutoSuggestions) return;

      try {
        setIsLoading(true);
        const result = await smartAutoPopulationService.getAutoPopulationResult(ctx);

        setSuggestions(result.suggestions);
        setPrefilledData(result.prefilledData);
        setConfidence(result.confidence);

        // Show toast for high-confidence suggestions
        if (result.suggestions.length > 0 && result.confidence > 0.8) {
          toast.success(`Found ${result.suggestions.length} smart suggestions for this form`, {
            duration: 3000,
            icon: '💡'
          });
        }
      } catch (error) {
        console.error('Error getting auto-population suggestions:', error);
        toast.error('Failed to load smart suggestions');
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [enableAutoSuggestions, debounceMs]
  );

  // Debounced insurance search
  const debouncedInsuranceSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!enableInsuranceAutoComplete || !query.trim()) {
        setInsuranceProviders([]);
        return;
      }

      try {
        setInsuranceLoading(true);
        const params: InsuranceSearchParams = {
          query,
          patientState: currentFieldValues.state,
          limit: 5
        };

        const result = await smartAutoPopulationService.searchInsuranceProviders(params);
        setInsuranceProviders(result.providers);
      } catch (error) {
        console.error('Error searching insurance providers:', error);
        toast.error('Failed to search insurance providers');
      } finally {
        setInsuranceLoading(false);
      }
    }, debounceMs),
    [enableInsuranceAutoComplete, currentFieldValues.state, debounceMs]
  );

  // Load patient history
  const loadPatientHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const history = await smartAutoPopulationService.getPatientHistory(patientId);
      setPatientHistory(history);
    } catch (error) {
      console.error('Error loading patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setHistoryLoading(false);
    }
  }, [patientId]);

  // Effect to trigger auto-population when context changes
  useEffect(() => {
    if (patientId && enableAutoSuggestions) {
      debouncedGetSuggestions(context);
    }

    return () => {
      debouncedGetSuggestions.cancel();
    };
  }, [context, debouncedGetSuggestions]);

  // Effect to load patient history on mount
  useEffect(() => {
    if (patientId) {
      loadPatientHistory();
    }
  }, [patientId, loadPatientHistory]);

  // Public API functions
  const searchInsurance = useCallback((query: string) => {
    debouncedInsuranceSearch(query);
  }, [debouncedInsuranceSearch]);

  const refreshSuggestions = useCallback(() => {
    debouncedGetSuggestions(context);
  }, [context, debouncedGetSuggestions]);

  const acceptSuggestion = useCallback(async (suggestionId: string, helpful: boolean = true) => {
    try {
      await smartAutoPopulationService.recordSuggestionFeedback(suggestionId, helpful);

      // Remove accepted suggestion from list
      setSuggestions(prev => prev.filter(s => s.field !== suggestionId));

      toast.success('Suggestion applied successfully', {
        duration: 2000,
        icon: '✅'
      });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  }, []);

  const rejectSuggestion = useCallback(async (suggestionId: string, comment?: string) => {
    try {
      await smartAutoPopulationService.recordSuggestionFeedback(suggestionId, false, comment);

      // Remove rejected suggestion from list
      setSuggestions(prev => prev.filter(s => s.field !== suggestionId));

      toast.info('Suggestion dismissed', {
        duration: 2000,
        icon: '❌'
      });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast.error('Failed to dismiss suggestion');
    }
  }, []);

  const duplicateForm = useCallback(async (request: DuplicationRequest): Promise<DuplicationResult> => {
    try {
      setDuplicationLoading(true);
      const result = await smartAutoPopulationService.duplicateIVRForm(request);

      if (result.success) {
        toast.success('Form duplicated successfully', {
          duration: 3000,
          icon: '📋'
        });

        // Refresh suggestions after duplication
        refreshSuggestions();
      } else {
        toast.error('Failed to duplicate form: ' + result.warnings.join(', '));
      }

      return result;
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Failed to duplicate form');
      throw error;
    } finally {
      setDuplicationLoading(false);
    }
  }, [refreshSuggestions]);

  const saveFormToHistory = useCallback(async (formData: IVRFormData, success: boolean = true) => {
    try {
      await smartAutoPopulationService.saveFormHistory(formData, success);

      // Refresh patient history
      await loadPatientHistory();

      if (success) {
        toast.success('Form saved to history for future auto-population', {
          duration: 2000,
          icon: '💾'
        });
      }
    } catch (error) {
      console.error('Error saving form to history:', error);
      // Don't show error toast for this as it's not critical to user workflow
    }
  }, [loadPatientHistory]);

  // Get analytics data
  const analytics = useMemo(() => {
    const data = smartAutoPopulationService.getAnalytics();
    return {
      totalSuggestions: data.totalSuggestions,
      acceptedSuggestions: data.acceptedSuggestions,
      accuracyRate: data.accuracyRate
    };
  }, [suggestions]); // Re-compute when suggestions change

  return {
    // Auto-population state
    isLoading,
    suggestions,
    prefilledData,
    confidence,

    // Insurance auto-complete
    insuranceProviders,
    insuranceLoading,
    searchInsurance,

    // Form history
    patientHistory,
    historyLoading,

    // Form duplication
    duplicateForm,
    duplicationLoading,

    // Actions
    refreshSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    saveFormToHistory,

    // Analytics
    analytics
  };
};

export default useSmartAutoPopulation;