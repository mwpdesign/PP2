import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface KeyboardShortcutConfig {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  showToast?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    showToast = false
  } = options;

  const shortcutsRef = useRef(shortcuts);
  const lastTriggeredRef = useRef<string>('');

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Only allow certain shortcuts in input fields
      const allowedInInputs = ['ctrl+s', 'ctrl+enter', 'escape'];
      const currentShortcut = getShortcutString(event);
      if (!allowedInInputs.includes(currentShortcut.toLowerCase())) {
        return;
      }
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      if (shortcut.enabled === false) return false;

      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      if (!keyMatches) return false;

      // Check modifiers
      const requiredModifiers = shortcut.modifiers || [];
      const hasCtrl = event.ctrlKey || event.metaKey;
      const hasShift = event.shiftKey;
      const hasAlt = event.altKey;

      const modifierChecks = {
        ctrl: hasCtrl,
        meta: hasCtrl, // Treat meta as ctrl
        shift: hasShift,
        alt: hasAlt
      };

      // Check if all required modifiers are present
      const hasRequiredModifiers = requiredModifiers.every(
        modifier => modifierChecks[modifier]
      );

      // Check if there are no extra modifiers
      const hasExtraModifiers =
        (hasCtrl && !requiredModifiers.includes('ctrl') && !requiredModifiers.includes('meta')) ||
        (hasShift && !requiredModifiers.includes('shift')) ||
        (hasAlt && !requiredModifiers.includes('alt'));

      return hasRequiredModifiers && !hasExtraModifiers;
    });

    if (matchingShortcut) {
      if (preventDefault || matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      // Track last triggered shortcut
      const shortcutString = getShortcutString(event);
      lastTriggeredRef.current = shortcutString;

      // Show toast if enabled
      if (showToast) {
        toast.success(`Shortcut: ${matchingShortcut.description}`);
      }

      // Execute the action
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Keyboard shortcut action failed:', error);
        if (showToast) {
          toast.error('Shortcut action failed');
        }
      }
    }
  }, [enabled, preventDefault, stopPropagation, showToast]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  const getShortcutString = (event: KeyboardEvent): string => {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    parts.push(event.key);

    return parts.join('+');
  };

  const getLastTriggered = () => lastTriggeredRef.current;

  const formatShortcut = (shortcut: KeyboardShortcutConfig): string => {
    const modifiers = shortcut.modifiers || [];
    const parts = [...modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)), shortcut.key];
    return parts.join(' + ');
  };

  return {
    getLastTriggered,
    formatShortcut,
    shortcuts: shortcutsRef.current
  };
};

// Predefined shortcut configurations for wound care IVR
export const createWoundCareShortcuts = (actions: {
  onSave?: () => void;
  onSubmit?: () => void;
  onTemplateOpen?: () => void;
  onVoiceToggle?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
  onApplyTemplate?: (templateId: string) => void;
}): KeyboardShortcutConfig[] => {
  return [
    // Form actions
    {
      key: 's',
      modifiers: ['ctrl'],
      action: () => actions.onSave?.(),
      description: 'Save draft (auto-save every 10s)',
      enabled: !!actions.onSave
    },
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      action: () => actions.onSubmit?.(),
      description: 'Submit IVR form',
      enabled: !!actions.onSubmit
    },

    // Navigation
    {
      key: 'Tab',
      action: () => actions.onNavigateNext?.(),
      description: 'Move to next field',
      enabled: !!actions.onNavigateNext,
      preventDefault: false // Let browser handle tab navigation
    },
    {
      key: 'Tab',
      modifiers: ['shift'],
      action: () => actions.onNavigatePrev?.(),
      description: 'Move to previous field',
      enabled: !!actions.onNavigatePrev,
      preventDefault: false
    },
    {
      key: 'ArrowDown',
      action: () => actions.onNavigateDown?.(),
      description: 'Move to field below',
      enabled: !!actions.onNavigateDown
    },
    {
      key: 'ArrowUp',
      action: () => actions.onNavigateUp?.(),
      description: 'Move to field above',
      enabled: !!actions.onNavigateUp
    },

    // Templates
    {
      key: 't',
      modifiers: ['ctrl'],
      action: () => actions.onTemplateOpen?.(),
      description: 'Open wound care templates',
      enabled: !!actions.onTemplateOpen
    },
    {
      key: '1',
      modifiers: ['ctrl'],
      action: () => actions.onApplyTemplate?.('diabetic-foot-ulcer'),
      description: 'Apply diabetic foot ulcer template',
      enabled: !!actions.onApplyTemplate
    },
    {
      key: '2',
      modifiers: ['ctrl'],
      action: () => actions.onApplyTemplate?.('pressure-ulcer-stage2'),
      description: 'Apply pressure ulcer template',
      enabled: !!actions.onApplyTemplate
    },
    {
      key: '3',
      modifiers: ['ctrl'],
      action: () => actions.onApplyTemplate?.('venous-leg-ulcer'),
      description: 'Apply venous leg ulcer template',
      enabled: !!actions.onApplyTemplate
    },
    {
      key: '4',
      modifiers: ['ctrl'],
      action: () => actions.onApplyTemplate?.('surgical-dehiscence'),
      description: 'Apply surgical wound template',
      enabled: !!actions.onApplyTemplate
    },
    {
      key: '5',
      modifiers: ['ctrl'],
      action: () => actions.onApplyTemplate?.('acute-laceration'),
      description: 'Apply acute laceration template',
      enabled: !!actions.onApplyTemplate
    },

    // Voice
    {
      key: 'v',
      modifiers: ['ctrl'],
      action: () => actions.onVoiceToggle?.(),
      description: 'Toggle voice recording',
      enabled: !!actions.onVoiceToggle
    },
    {
      key: ' ',
      modifiers: ['ctrl'],
      action: () => actions.onVoiceToggle?.(),
      description: 'Start/stop voice recording',
      enabled: !!actions.onVoiceToggle
    },

    // System
    {
      key: '?',
      modifiers: ['ctrl'],
      action: () => actions.onHelp?.(),
      description: 'Show keyboard shortcuts help',
      enabled: !!actions.onHelp
    },
    {
      key: 'Escape',
      action: () => actions.onEscape?.(),
      description: 'Close dialogs/cancel actions',
      enabled: !!actions.onEscape
    }
  ].filter(shortcut => shortcut.enabled !== false);
};

export default useKeyboardShortcuts;