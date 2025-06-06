import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpeedToolsComponent } from '../speed-tools/SpeedToolsComponent';
import { useSpeedTools } from '../../hooks/useSpeedTools';
import { renderHook, act } from '@testing-library/react';

// Mock services
vi.mock('../../services/AutoSaveService');
vi.mock('../../services/KeyboardShortcutService');

describe('SpeedToolsComponent', () => {
  const mockProps = {
    formData: {
      patientName: 'John Doe',
      dateOfBirth: '1980-01-01',
      medicalCondition: ''
    },
    onFormUpdate: vi.fn(),
    onQuickSave: vi.fn(),
    targetCompletionTime: 120 // 2 minutes
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render speed tools interface', () => {
    render(<SpeedToolsComponent {...mockProps} />);

    expect(screen.getByText(/speed tools/i)).toBeInTheDocument();
    expect(screen.getByText(/target: 2:00/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quick save/i })).toBeInTheDocument();
  });

  it('should display completion time progress', () => {
    render(<SpeedToolsComponent {...mockProps} />);

    expect(screen.getByTestId('completion-timer')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('should show keyboard shortcuts panel', () => {
    render(<SpeedToolsComponent {...mockProps} />);

    const shortcutsButton = screen.getByRole('button', { name: /shortcuts/i });
    fireEvent.click(shortcutsButton);

    expect(screen.getByText(/ctrl \+ s/i)).toBeInTheDocument(); // Quick save
    expect(screen.getByText(/ctrl \+ enter/i)).toBeInTheDocument(); // Submit
    expect(screen.getByText(/tab/i)).toBeInTheDocument(); // Next field
  });

  it('should handle quick save functionality', async () => {
    render(<SpeedToolsComponent {...mockProps} />);

    const quickSaveButton = screen.getByRole('button', { name: /quick save/i });
    fireEvent.click(quickSaveButton);

    await waitFor(() => {
      expect(mockProps.onQuickSave).toHaveBeenCalledWith(mockProps.formData);
    });

    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('should provide field completion suggestions', async () => {
    render(<SpeedToolsComponent {...mockProps} />);

    // Type in a field to trigger suggestions
    const conditionInput = screen.getByLabelText(/medical condition/i);
    fireEvent.change(conditionInput, { target: { value: 'diab' } });

    await waitFor(() => {
      expect(screen.getByText(/diabetic ulcer/i)).toBeInTheDocument();
      expect(screen.getByText(/diabetes/i)).toBeInTheDocument();
    });
  });
});

describe('useSpeedTools Hook', () => {
  it('should provide speed optimization functionality', () => {
    const { result } = renderHook(() => useSpeedTools());

    expect(result.current.completionTime).toBe(0);
    expect(result.current.isAutoSaveEnabled).toBe(true);
    expect(result.current.shortcuts).toBeDefined();

    // Test timer start
    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isTimerRunning).toBe(true);
  });

  it('should handle auto-save with debouncing', async () => {
    const { result } = renderHook(() => useSpeedTools());

    const formData = { patientName: 'John Doe' };

    act(() => {
      result.current.triggerAutoSave(formData);
    });

    // Should debounce multiple rapid saves
    act(() => {
      result.current.triggerAutoSave({ ...formData, dateOfBirth: '1980-01-01' });
    });

    await waitFor(() => {
      expect(result.current.lastSaveTime).toBeDefined();
    }, { timeout: 1000 });
  });

  it('should track completion time accurately', async () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.startTimer();
    });

    // Simulate time passing
    await new Promise(resolve => setTimeout(resolve, 100));

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.completionTime).toBeGreaterThan(0);
    expect(result.current.completionTime).toBeLessThan(200); // Should be around 100ms
  });
});

describe('Auto-Save Functionality', () => {
  it('should auto-save form data at regular intervals', async () => {
    const { result } = renderHook(() => useSpeedTools());

    const formData = { patientName: 'John Doe', medicalCondition: 'Diabetic ulcer' };

    act(() => {
      result.current.enableAutoSave(formData, 500); // 500ms interval
    });

    await waitFor(() => {
      expect(result.current.autoSaveCount).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it('should handle auto-save failures gracefully', async () => {
    const { result } = renderHook(() => useSpeedTools());

    // Mock auto-save failure
    vi.mocked(result.current.triggerAutoSave).mockRejectedValue(new Error('Save failed'));

    const formData = { patientName: 'John Doe' };

    act(() => {
      result.current.triggerAutoSave(formData);
    });

    await waitFor(() => {
      expect(result.current.autoSaveError).toBe('Save failed');
    });
  });

  it('should prevent data loss on page unload', () => {
    const { result } = renderHook(() => useSpeedTools());

    const formData = { patientName: 'John Doe', unsaved: true };

    act(() => {
      result.current.setFormData(formData);
    });

    // Simulate page unload
    const beforeUnloadEvent = new Event('beforeunload');
    fireEvent(window, beforeUnloadEvent);

    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});

describe('Keyboard Shortcuts', () => {
  it('should register and handle keyboard shortcuts', () => {
    const { result } = renderHook(() => useSpeedTools());

    const shortcuts = result.current.shortcuts;

    expect(shortcuts).toContain('Ctrl+S'); // Quick save
    expect(shortcuts).toContain('Ctrl+Enter'); // Submit
    expect(shortcuts).toContain('Ctrl+Z'); // Undo
    expect(shortcuts).toContain('Ctrl+Y'); // Redo
  });

  it('should execute quick save on Ctrl+S', () => {
    render(<SpeedToolsComponent {...mockProps} />);

    fireEvent.keyDown(document, { key: 's', ctrlKey: true });

    expect(mockProps.onQuickSave).toHaveBeenCalled();
  });

  it('should navigate fields with Tab efficiently', () => {
    render(<SpeedToolsComponent {...mockProps} />);

    const firstInput = screen.getByLabelText(/patient name/i);
    const secondInput = screen.getByLabelText(/date of birth/i);

    firstInput.focus();
    fireEvent.keyDown(firstInput, { key: 'Tab' });

    expect(document.activeElement).toBe(secondInput);
  });

  it('should support custom shortcut configuration', () => {
    const customShortcuts = {
      'Ctrl+Q': 'quickSave',
      'Ctrl+D': 'duplicate',
      'F1': 'help'
    };

    const { result } = renderHook(() => useSpeedTools({ shortcuts: customShortcuts }));

    expect(result.current.shortcuts).toContain('Ctrl+Q');
    expect(result.current.shortcuts).toContain('F1');
  });
});

describe('Performance Optimization', () => {
  it('should achieve sub-2-minute completion target', async () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.startTimer();
    });

    // Simulate efficient form completion
    const formSteps = [
      { field: 'patientName', value: 'John Doe' },
      { field: 'dateOfBirth', value: '1980-01-01' },
      { field: 'medicalCondition', value: 'Diabetic ulcer' },
      { field: 'woundLocation', value: 'Left foot' }
    ];

    for (const step of formSteps) {
      act(() => {
        result.current.updateField(step.field, step.value);
      });
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate typing
    }

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.completionTime).toBeLessThan(120000); // Less than 2 minutes
  });

  it('should provide completion time analytics', () => {
    const { result } = renderHook(() => useSpeedTools());

    const completionTimes = [95, 110, 87, 125, 98]; // seconds

    act(() => {
      result.current.recordCompletionTimes(completionTimes);
    });

    expect(result.current.averageCompletionTime).toBe(103); // Average
    expect(result.current.bestCompletionTime).toBe(87); // Fastest
    expect(result.current.completionTrend).toBe('improving'); // Trend analysis
  });

  it('should optimize field order for efficiency', () => {
    const { result } = renderHook(() => useSpeedTools());

    const fieldUsageData = {
      patientName: { frequency: 100, avgTime: 5 },
      dateOfBirth: { frequency: 100, avgTime: 8 },
      medicalCondition: { frequency: 95, avgTime: 12 },
      woundLocation: { frequency: 90, avgTime: 10 }
    };

    act(() => {
      result.current.optimizeFieldOrder(fieldUsageData);
    });

    const optimizedOrder = result.current.optimizedFieldOrder;

    // Should prioritize high-frequency, low-time fields first
    expect(optimizedOrder[0]).toBe('patientName');
    expect(optimizedOrder[1]).toBe('dateOfBirth');
  });
});

describe('Smart Suggestions', () => {
  it('should provide contextual field suggestions', async () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.updateField('medicalCondition', 'diab');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toContain('Diabetic ulcer');
      expect(result.current.suggestions).toContain('Diabetic foot');
    });
  });

  it('should learn from user patterns', () => {
    const { result } = renderHook(() => useSpeedTools());

    const userHistory = [
      { field: 'woundLocation', value: 'Left foot' },
      { field: 'woundLocation', value: 'Left foot' },
      { field: 'woundLocation', value: 'Right foot' }
    ];

    act(() => {
      result.current.learnFromHistory(userHistory);
    });

    act(() => {
      result.current.updateField('woundLocation', 'L');
    });

    expect(result.current.suggestions[0]).toBe('Left foot'); // Most frequent
  });

  it('should provide smart auto-completion', async () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.updateField('patientName', 'John D');
    });

    await waitFor(() => {
      expect(result.current.autoCompleteSuggestion).toBe('John Doe');
    });

    act(() => {
      result.current.acceptAutoComplete();
    });

    expect(result.current.formData.patientName).toBe('John Doe');
  });
});

describe('Progress Tracking', () => {
  it('should track form completion progress', () => {
    const { result } = renderHook(() => useSpeedTools());

    const requiredFields = ['patientName', 'dateOfBirth', 'medicalCondition'];

    act(() => {
      result.current.setRequiredFields(requiredFields);
      result.current.updateField('patientName', 'John Doe');
    });

    expect(result.current.completionProgress).toBe(33.33); // 1 of 3 fields

    act(() => {
      result.current.updateField('dateOfBirth', '1980-01-01');
    });

    expect(result.current.completionProgress).toBe(66.67); // 2 of 3 fields
  });

  it('should provide time-to-completion estimates', () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.startTimer();
      result.current.updateField('patientName', 'John Doe');
    });

    // Based on current progress and historical data
    expect(result.current.estimatedTimeToCompletion).toBeLessThan(120); // seconds
  });

  it('should warn about completion time targets', () => {
    const { result } = renderHook(() => useSpeedTools());

    act(() => {
      result.current.startTimer();
      result.current.setTargetTime(120); // 2 minutes
    });

    // Simulate 90 seconds elapsed
    act(() => {
      result.current.simulateTimeElapsed(90);
    });

    expect(result.current.timeWarning).toBe('30 seconds remaining');
    expect(result.current.isApproachingDeadline).toBe(true);
  });
});