/**
 * Onboarding service for the healthcare IVR platform frontend.
 */

import {
  OnboardingProgress,
  OnboardingStep,
  OnboardingStepUpdate,
  OnboardingStartRequest,
  OnboardingCompleteRequest
} from '../types/onboarding';

class OnboardingService {
  private baseUrl = '/api/v1/onboarding';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current user's onboarding progress
   */
  async getProgress(): Promise<OnboardingProgress> {
    return this.request<OnboardingProgress>('/progress');
  }

  /**
   * Start onboarding for the current user
   */
  async start(skipWelcome: boolean = false): Promise<OnboardingProgress> {
    return this.request<OnboardingProgress>('/start', {
      method: 'POST',
      body: JSON.stringify({ skip_welcome: skipWelcome }),
    });
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(
    stepName: string,
    data?: Record<string, any>
  ): Promise<OnboardingStep> {
    return this.request<OnboardingStep>(`/steps/${stepName}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  /**
   * Skip onboarding
   */
  async skip(reason?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/skip', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Check if onboarding should be shown
   */
  async shouldShow(): Promise<{ should_show: boolean }> {
    return this.request<{ should_show: boolean }>('/should-show');
  }

  /**
   * Update user's first login timestamp (called from auth context)
   */
  async markFirstLogin(): Promise<void> {
    try {
      // This will be handled by the backend when user logs in
      // Just trigger a check to see if onboarding should start
      await this.shouldShow();
    } catch (error) {
      console.error('Failed to mark first login:', error);
    }
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;