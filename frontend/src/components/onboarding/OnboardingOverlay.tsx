import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  PlayIcon,
  ClockIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingProgress, OnboardingStep } from '../../types/onboarding';

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Load onboarding progress
  useEffect(() => {
    if (isOpen && user) {
      loadProgress();
    }
  }, [isOpen, user]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const progressData = await onboardingService.getProgress();
      setProgress(progressData);

      // Find current step index
      const currentStepName = progressData.current_step;
      if (currentStepName) {
        const stepIndex = progressData.steps.findIndex(
          step => step.step_name === currentStepName
        );
        setCurrentStepIndex(Math.max(0, stepIndex));
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepName: string) => {
    try {
      setCompleting(true);
      await onboardingService.completeStep(stepName);
      await loadProgress(); // Reload to get updated progress

      // Move to next step if not the last one
      if (currentStepIndex < (progress?.steps.length || 0) - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // All steps completed
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await onboardingService.skip('User chose to skip onboarding');
      onComplete();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < (progress?.steps.length || 0)) {
      setCurrentStepIndex(index);
    }
  };

  const getRoleConfig = () => {
    const roleConfigs = {
      'Doctor': {
        welcome: 'Welcome to your medical practice management platform!',
        description: 'Streamline patient care and insurance verification',
        color: 'emerald',
        icon: UserIcon
      },
      'IVR': {
        welcome: 'Welcome to the IVR Review Platform!',
        description: 'Help doctors get faster insurance approvals',
        color: 'blue',
        icon: CheckIcon
      },
      'Sales': {
        welcome: 'Welcome to your sales command center!',
        description: 'Manage relationships and grow your territory',
        color: 'purple',
        icon: SparklesIcon
      },
      'Master Distributor': {
        welcome: 'Welcome to Distribution Management!',
        description: 'Oversee regional operations and logistics',
        color: 'orange',
        icon: PlayIcon
      },
      'Distributor': {
        welcome: 'Welcome to Regional Distribution!',
        description: 'Manage local operations efficiently',
        color: 'teal',
        icon: PlayIcon
      },
      'Admin': {
        welcome: 'Welcome to System Administration!',
        description: 'Manage the entire healthcare platform',
        color: 'red',
        icon: UserIcon
      },
      'CHP Admin': {
        welcome: 'Welcome to CHP Administration!',
        description: 'Manage Community Health Programs',
        color: 'indigo',
        icon: UserIcon
      },
      'Shipping and Logistics': {
        welcome: 'Welcome to Logistics Management!',
        description: 'Coordinate shipping and delivery operations',
        color: 'yellow',
        icon: PlayIcon
      }
    };

    return roleConfigs[user?.role as keyof typeof roleConfigs] || roleConfigs['Doctor'];
  };

  if (loading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-lg p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                <p className="mt-4 text-slate-600 text-center">Loading onboarding...</p>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  if (!progress) {
    return null;
  }

  const currentStep = progress.steps[currentStepIndex];
  const roleConfig = getRoleConfig();
  const IconComponent = roleConfig.icon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className={`bg-${roleConfig.color}-600 px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-8 w-8" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {user?.role} Onboarding
                        </h3>
                        <p className="text-sm opacity-90">
                          Step {currentStepIndex + 1} of {progress.steps.length}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="bg-white bg-opacity-20 rounded-full h-2">
                      <div
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${((currentStepIndex + 1) / progress.steps.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-8">
                  {currentStep && (
                    <div className="space-y-6">
                      {/* Step Content */}
                      <div className="text-center">
                        <h4 className="text-xl font-semibold text-slate-900 mb-2">
                          {getStepTitle(currentStep.step_name)}
                        </h4>
                        <p className="text-slate-600">
                          {getStepDescription(currentStep.step_name, user?.role)}
                        </p>
                      </div>

                      {/* Step Visual/Demo */}
                      <div className="bg-slate-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-4">
                          {getStepIcon(currentStep.step_name)}
                        </div>
                        <p className="text-sm text-slate-600">
                          {getStepInstructions(currentStep.step_name, user?.role)}
                        </p>
                      </div>

                      {/* Step Navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => goToStep(currentStepIndex - 1)}
                          disabled={currentStepIndex === 0}
                          className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          <span>Previous</span>
                        </button>

                        <div className="flex space-x-2">
                          {progress.steps.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => goToStep(index)}
                              className={`w-3 h-3 rounded-full transition-colors ${
                                index === currentStepIndex
                                  ? `bg-${roleConfig.color}-600`
                                  : index < currentStepIndex
                                  ? `bg-${roleConfig.color}-300`
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            if (currentStepIndex === progress.steps.length - 1) {
                              handleStepComplete(currentStep.step_name);
                            } else {
                              goToStep(currentStepIndex + 1);
                            }
                          }}
                          disabled={completing}
                          className={`flex items-center space-x-2 px-4 py-2 bg-${roleConfig.color}-600 text-white rounded-lg hover:bg-${roleConfig.color}-700 disabled:opacity-50`}
                        >
                          <span>
                            {currentStepIndex === progress.steps.length - 1 ? 'Complete' : 'Next'}
                          </span>
                          {completing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Estimated time: 5-10 minutes</span>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    Skip for now
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Helper functions for step content
const getStepTitle = (stepName: string): string => {
  const titles = {
    welcome: 'Welcome!',
    profile_setup: 'Complete Your Profile',
    patient_management: 'Patient Management',
    ivr_workflow: 'IVR Request Process',
    dashboard_tour: 'Dashboard Overview',
    review_queue: 'Review Queue',
    approval_workflow: 'Approval Process',
    communication_tools: 'Communication Features',
    doctor_management: 'Doctor Management',
    schedule_setup: 'Schedule Management',
    analytics_overview: 'Analytics Overview',
    order_management: 'Order Management',
    shipping_logistics: 'Shipping & Logistics',
    analytics_reports: 'Analytics & Reports',
    order_queue: 'Order Queue',
    shipment_tracking: 'Shipment Tracking',
    territory_management: 'Territory Management',
    user_management: 'User Management',
    system_configuration: 'System Configuration',
    audit_compliance: 'Audit & Compliance',
    program_management: 'Program Management',
    community_partners: 'Community Partners',
    compliance_tracking: 'Compliance Tracking',
    shipping_queue: 'Shipping Queue',
    carrier_management: 'Carrier Management',
    warehouse_config: 'Warehouse Configuration'
  };
  return titles[stepName as keyof typeof titles] || 'Onboarding Step';
};

const getStepDescription = (stepName: string, role?: string): string => {
  const descriptions = {
    welcome: `Welcome to the Healthcare IVR Platform! Let's get you set up for success.`,
    profile_setup: 'Complete your profile information to personalize your experience.',
    patient_management: 'Learn how to add and manage patient records efficiently.',
    ivr_workflow: 'Understand the insurance verification request process.',
    dashboard_tour: 'Explore your dashboard and discover key features.',
    review_queue: 'Learn to navigate and prioritize IVR requests.',
    approval_workflow: 'Master the approval, rejection, and document request process.',
    communication_tools: 'Communicate effectively with doctors and request documents.',
    doctor_management: 'Add and manage your doctor accounts and relationships.',
    schedule_setup: 'Set up appointments and follow-up schedules.',
    analytics_overview: 'Track your performance and identify opportunities.',
    order_management: 'Process and manage orders across your network.',
    shipping_logistics: 'Coordinate shipments and track deliveries.',
    analytics_reports: 'Monitor performance and generate reports.',
    order_queue: 'Process and fulfill local orders efficiently.',
    shipment_tracking: 'Monitor deliveries in your territory.',
    territory_management: 'Manage your regional coverage and retailers.',
    user_management: 'Create and manage user accounts and roles.',
    system_configuration: 'Configure platform settings and features.',
    audit_compliance: 'Monitor compliance and review audit logs.',
    program_management: 'Oversee health programs and initiatives.',
    community_partners: 'Manage partnerships and collaborations.',
    compliance_tracking: 'Monitor program compliance and outcomes.',
    shipping_queue: 'Process and prioritize shipments.',
    carrier_management: 'Coordinate with shipping carriers.',
    warehouse_config: 'Manage warehouse settings and inventory.'
  };
  return descriptions[stepName as keyof typeof descriptions] || 'Learn about this feature.';
};

const getStepIcon = (stepName: string): string => {
  const icons = {
    welcome: '👋',
    profile_setup: '👤',
    patient_management: '🏥',
    ivr_workflow: '📋',
    dashboard_tour: '📊',
    review_queue: '📝',
    approval_workflow: '✅',
    communication_tools: '💬',
    doctor_management: '👨‍⚕️',
    schedule_setup: '📅',
    analytics_overview: '📈',
    order_management: '📦',
    shipping_logistics: '🚚',
    analytics_reports: '📊',
    order_queue: '📋',
    shipment_tracking: '📍',
    territory_management: '🗺️',
    user_management: '👥',
    system_configuration: '⚙️',
    audit_compliance: '🔍',
    program_management: '🏢',
    community_partners: '🤝',
    compliance_tracking: '📋',
    shipping_queue: '📦',
    carrier_management: '🚛',
    warehouse_config: '🏭'
  };
  return icons[stepName as keyof typeof icons] || '📚';
};

const getStepInstructions = (stepName: string, role?: string): string => {
  const instructions = {
    welcome: 'Click "Next" to begin your personalized tour.',
    profile_setup: 'Navigate to Settings to complete your profile information.',
    patient_management: 'Go to Patients section to add your first patient.',
    ivr_workflow: 'Visit IVR Management to submit your first request.',
    dashboard_tour: 'Explore the dashboard to see all available features.',
    review_queue: 'Check the Review Queue to see pending requests.',
    approval_workflow: 'Practice approving or rejecting sample requests.',
    communication_tools: 'Try sending a message or requesting documents.',
    doctor_management: 'Add your first doctor account in the Doctors section.',
    schedule_setup: 'Set up your calendar and appointment preferences.',
    analytics_overview: 'Review your performance metrics and reports.',
    order_management: 'Process orders and manage your distribution network.',
    shipping_logistics: 'Coordinate shipments and track deliveries.',
    analytics_reports: 'Generate reports and monitor performance.',
    order_queue: 'Process local orders and manage fulfillment.',
    shipment_tracking: 'Track deliveries in your territory.',
    territory_management: 'Manage your regional coverage area.',
    user_management: 'Create user accounts and assign roles.',
    system_configuration: 'Configure platform settings and preferences.',
    audit_compliance: 'Review audit logs and compliance reports.',
    program_management: 'Oversee health programs and initiatives.',
    community_partners: 'Manage partnerships and collaborations.',
    compliance_tracking: 'Monitor program compliance and outcomes.',
    shipping_queue: 'Process and prioritize shipments.',
    carrier_management: 'Coordinate with shipping carriers.',
    warehouse_config: 'Configure warehouse settings and inventory.'
  };
  return instructions[stepName as keyof typeof instructions] || 'Follow the guided steps to learn this feature.';
};

export default OnboardingOverlay;