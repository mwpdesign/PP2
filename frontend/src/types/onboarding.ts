/**
 * Onboarding types for the healthcare IVR platform.
 */

export interface OnboardingStep {
  id: string;
  user_id: string;
  step_name: string;
  step_order: number;
  completed: boolean;
  completed_at?: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  user_id: string;
  total_steps: number;
  completed_steps: number;
  current_step?: string;
  progress_percentage: number;
  onboarding_completed: boolean;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  steps: OnboardingStep[];
}

export interface OnboardingStepUpdate {
  completed?: boolean;
  data?: Record<string, any>;
}

export interface OnboardingStartRequest {
  skip_welcome?: boolean;
}

export interface OnboardingCompleteRequest {
  feedback?: string;
  rating?: number;
}

export interface RoleOnboardingConfig {
  role: string;
  steps: OnboardingStepConfig[];
  estimated_duration: number;
  welcome_message: string;
  completion_message: string;
}

export interface OnboardingStepConfig {
  name: string;
  title: string;
  description: string;
  duration: number;
  icon?: string;
  instructions?: string;
}

export interface OnboardingAnalytics {
  total_users: number;
  completed_users: number;
  completion_rate: number;
  average_completion_time?: number;
  step_completion_rates: Record<string, number>;
  role_completion_rates: Record<string, number>;
}

export type OnboardingStepName =
  | 'welcome'
  | 'profile_setup'
  | 'patient_management'
  | 'ivr_workflow'
  | 'dashboard_tour'
  | 'review_queue'
  | 'approval_workflow'
  | 'communication_tools'
  | 'doctor_management'
  | 'schedule_setup'
  | 'analytics_overview'
  | 'order_management'
  | 'shipping_logistics'
  | 'analytics_reports'
  | 'order_queue'
  | 'shipment_tracking'
  | 'territory_management'
  | 'user_management'
  | 'system_configuration'
  | 'audit_compliance'
  | 'program_management'
  | 'community_partners'
  | 'compliance_tracking'
  | 'shipping_queue'
  | 'carrier_management'
  | 'warehouse_config';

export type UserRole =
  | 'Doctor'
  | 'IVR'
  | 'Sales'
  | 'Master Distributor'
  | 'Distributor'
  | 'Admin'
  | 'CHP Admin'
  | 'Shipping and Logistics';