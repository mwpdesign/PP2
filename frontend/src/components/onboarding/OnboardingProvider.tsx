/**
 * Onboarding provider that automatically shows onboarding for first-time users.
 */

import React, { useEffect } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingOverlay from './OnboardingOverlay';
import { toast } from 'react-hot-toast';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const {
    shouldShowOnboarding,
    progress,
    loading,
    error,
    skipOnboarding,
    hideOnboarding,
  } = useOnboarding();

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(`Onboarding error: ${error}`);
    }
  }, [error]);

  const handleOnboardingComplete = () => {
    hideOnboarding();
    toast.success('🎉 Welcome! You\'re all set up and ready to go!');
  };

  const handleOnboardingClose = () => {
    hideOnboarding();
  };

  return (
    <>
      {children}

      {/* Onboarding Overlay */}
      <OnboardingOverlay
        isOpen={shouldShowOnboarding && !loading}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default OnboardingProvider;