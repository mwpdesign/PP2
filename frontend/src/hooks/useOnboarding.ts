/**
 * React hook for managing onboarding state.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { onboardingService } from '../services/onboardingService';
import { OnboardingProgress } from '../types/onboarding';

interface UseOnboardingReturn {
  shouldShowOnboarding: boolean;
  progress: OnboardingProgress | null;
  loading: boolean;
  error: string | null;
  startOnboarding: (skipWelcome?: boolean) => Promise<void>;
  completeStep: (stepName: string, data?: Record<string, any>) => Promise<void>;
  skipOnboarding: (reason?: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
  hideOnboarding: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user, isAuthenticated } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if onboarding should be shown
  const checkShouldShow = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setShouldShowOnboarding(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { should_show } = await onboardingService.shouldShow();
      setShouldShowOnboarding(should_show);

      if (should_show) {
        // Load progress if onboarding should be shown
        const progressData = await onboardingService.getProgress();
        setProgress(progressData);
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check onboarding status');
      setShouldShowOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load progress
  const refreshProgress = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      const progressData = await onboardingService.getProgress();
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load onboarding progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Start onboarding
  const startOnboarding = useCallback(async (skipWelcome: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const progressData = await onboardingService.start(skipWelcome);
      setProgress(progressData);
      setShouldShowOnboarding(true);
    } catch (err) {
      console.error('Failed to start onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete a step
  const completeStep = useCallback(async (stepName: string, data?: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      await onboardingService.completeStep(stepName, data);
      await refreshProgress();
    } catch (err) {
      console.error('Failed to complete step:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete step');
    } finally {
      setLoading(false);
    }
  }, [refreshProgress]);

  // Skip onboarding
  const skipOnboarding = useCallback(async (reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await onboardingService.skip(reason);
      setShouldShowOnboarding(false);
      setProgress(null);
    } catch (err) {
      console.error('Failed to skip onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  }, []);

  // Hide onboarding (without skipping)
  const hideOnboarding = useCallback(() => {
    setShouldShowOnboarding(false);
  }, []);

  // Check onboarding status when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      checkShouldShow();
    } else {
      setShouldShowOnboarding(false);
      setProgress(null);
    }
  }, [isAuthenticated, user, checkShouldShow]);

  return {
    shouldShowOnboarding,
    progress,
    loading,
    error,
    startOnboarding,
    completeStep,
    skipOnboarding,
    refreshProgress,
    hideOnboarding,
  };
};