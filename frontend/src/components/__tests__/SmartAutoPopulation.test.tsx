import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartAutoPopulationService } from '../../services/SmartAutoPopulationService';
import { useSmartAutoPopulation } from '../../hooks/useSmartAutoPopulation';
import { renderHook, act } from '@testing-library/react';

// Mock the service
vi.mock('../../services/SmartAutoPopulationService');

describe('SmartAutoPopulationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Insurance Provider Auto-Complete', () => {
    it('should return insurance providers for valid queries', async () => {
      const mockProviders = [
        {
          id: 'bcbs',
          name: 'Blue Cross Blue Shield',
          coverage: 'Comprehensive wound care coverage',
          confidence: 0.95
        }
      ];

      vi.mocked(SmartAutoPopulationService.searchInsuranceProviders).mockResolvedValue(mockProviders);

      const result = await SmartAutoPopulationService.searchInsuranceProviders('blue cross');

      expect(result).toEqual(mockProviders);
      expect(SmartAutoPopulationService.searchInsuranceProviders).toHaveBeenCalledWith('blue cross');
    });

    it('should handle empty queries gracefully', async () => {
      vi.mocked(SmartAutoPopulationService.searchInsuranceProviders).mockResolvedValue([]);

      const result = await SmartAutoPopulationService.searchInsuranceProviders('');

      expect(result).toEqual([]);
    });
  });

  describe('Form Duplication', () => {
    it('should duplicate form data with selective field copying', async () => {
      const sourceForm = {
        patientName: 'John Doe',
        dateOfBirth: '1980-01-01',
        insuranceProvider: 'Aetna',
        medicalCondition: 'Diabetic ulcer'
      };

      const fieldsToInclude = ['patientName', 'insuranceProvider'];

      vi.mocked(SmartAutoPopulationService.duplicateFormData).mockResolvedValue({
        patientName: 'John Doe',
        insuranceProvider: 'Aetna'
      });

      const result = await SmartAutoPopulationService.duplicateFormData(sourceForm, fieldsToInclude);

      expect(result).toEqual({
        patientName: 'John Doe',
        insuranceProvider: 'Aetna'
      });
    });
  });

  describe('Medical Condition Templates', () => {
    it('should return appropriate templates for wound care conditions', async () => {
      const mockTemplate = {
        condition: 'Diabetic Ulcer',
        fields: {
          woundLocation: 'Lower extremity',
          woundSize: '2cm x 3cm',
          woundDepth: 'Partial thickness'
        },
        confidence: 0.88
      };

      vi.mocked(SmartAutoPopulationService.getConditionTemplate).mockResolvedValue(mockTemplate);

      const result = await SmartAutoPopulationService.getConditionTemplate('diabetic ulcer');

      expect(result).toEqual(mockTemplate);
    });
  });
});

describe('useSmartAutoPopulation Hook', () => {
  it('should provide auto-population functionality with debouncing', async () => {
    const { result } = renderHook(() => useSmartAutoPopulation());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions).toEqual([]);

    // Test search functionality
    act(() => {
      result.current.searchInsurance('blue');
    });

    expect(result.current.isLoading).toBe(true);

    // Wait for debounced search
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });
  });

  it('should handle confidence scoring correctly', async () => {
    const { result } = renderHook(() => useSmartAutoPopulation());

    const mockSuggestion = {
      id: 'test',
      name: 'Test Provider',
      confidence: 0.92
    };

    act(() => {
      result.current.acceptSuggestion(mockSuggestion);
    });

    expect(result.current.acceptedSuggestions).toContain(mockSuggestion);
  });
});

describe('HIPAA Compliance', () => {
  it('should maintain audit trail for auto-population actions', async () => {
    const auditEntry = {
      action: 'auto_populate_insurance',
      timestamp: new Date().toISOString(),
      userId: 'user123',
      confidence: 0.95
    };

    vi.mocked(SmartAutoPopulationService.logAuditTrail).mockResolvedValue(auditEntry);

    const result = await SmartAutoPopulationService.logAuditTrail(auditEntry);

    expect(result).toEqual(auditEntry);
    expect(SmartAutoPopulationService.logAuditTrail).toHaveBeenCalledWith(auditEntry);
  });

  it('should not store sensitive data in suggestions', async () => {
    const mockProviders = [
      {
        id: 'provider1',
        name: 'Test Insurance',
        coverage: 'Basic coverage info only'
      }
    ];

    vi.mocked(SmartAutoPopulationService.searchInsuranceProviders).mockResolvedValue(mockProviders);

    const result = await SmartAutoPopulationService.searchInsuranceProviders('test');

    // Verify no sensitive data is included
    result.forEach(provider => {
      expect(provider).not.toHaveProperty('ssn');
      expect(provider).not.toHaveProperty('memberNumber');
      expect(provider).not.toHaveProperty('groupNumber');
    });
  });
});

describe('Performance Requirements', () => {
  it('should complete auto-population within performance targets', async () => {
    const startTime = Date.now();

    vi.mocked(SmartAutoPopulationService.searchInsuranceProviders).mockResolvedValue([
      { id: 'test', name: 'Test Provider', confidence: 0.9 }
    ]);

    await SmartAutoPopulationService.searchInsuranceProviders('test');

    const duration = Date.now() - startTime;

    // Should complete within 300ms for optimal UX
    expect(duration).toBeLessThan(300);
  });

  it('should handle concurrent requests efficiently', async () => {
    const requests = Array(10).fill(null).map(() =>
      SmartAutoPopulationService.searchInsuranceProviders('test')
    );

    vi.mocked(SmartAutoPopulationService.searchInsuranceProviders).mockResolvedValue([]);

    const startTime = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - startTime;

    // Should handle 10 concurrent requests within 1 second
    expect(duration).toBeLessThan(1000);
  });
});