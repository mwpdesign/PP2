"""Onboarding service for the healthcare IVR platform."""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.user import User
from app.models.onboarding import OnboardingProgress
from app.schemas.onboarding import (
    OnboardingProgressResponse,
    OnboardingStepResponse,
    OnboardingStepUpdate,
    RoleOnboardingConfig
)


class OnboardingService:
    """Service for managing user onboarding."""

    def __init__(self, db: Session):
        self.db = db

    # Role-specific onboarding configurations
    ROLE_CONFIGS = {
        "Doctor": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to Healthcare IVR Platform",
                    "description": "Get started with your medical practice management",
                    "duration": 2
                },
                {
                    "name": "profile_setup",
                    "title": "Complete Your Profile",
                    "description": "Set up your medical credentials and practice info",
                    "duration": 5
                },
                {
                    "name": "patient_management",
                    "title": "Patient Management",
                    "description": "Learn how to add and manage patient records",
                    "duration": 8
                },
                {
                    "name": "ivr_workflow",
                    "title": "IVR Request Process",
                    "description": "Submit insurance verification requests",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Dashboard Overview",
                    "description": "Explore your dashboard and key features",
                    "duration": 5
                }
            ],
            "estimated_duration": 30,
            "welcome_message": "Welcome to your medical practice management platform! Let's get you set up to streamline your patient care and insurance verification process.",
            "completion_message": "Congratulations! You're all set up and ready to manage your practice efficiently. Start by adding your first patient or submitting an IVR request."
        },
        "IVR": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to IVR Review Platform",
                    "description": "Start reviewing insurance verification requests",
                    "duration": 2
                },
                {
                    "name": "review_queue",
                    "title": "Review Queue Management",
                    "description": "Learn to navigate and prioritize requests",
                    "duration": 8
                },
                {
                    "name": "approval_workflow",
                    "title": "Approval Process",
                    "description": "Approve, reject, or request additional documents",
                    "duration": 10
                },
                {
                    "name": "communication_tools",
                    "title": "Communication Features",
                    "description": "Communicate with doctors and request documents",
                    "duration": 5
                },
                {
                    "name": "dashboard_tour",
                    "title": "Dashboard Overview",
                    "description": "Master your IVR review dashboard",
                    "duration": 5
                }
            ],
            "estimated_duration": 30,
            "welcome_message": "Welcome to the IVR Review Platform! You'll be helping doctors get faster insurance approvals for their patients. Let's get you familiar with the review process.",
            "completion_message": "Excellent! You're ready to start reviewing IVR requests. Your expertise helps doctors provide better patient care through faster approvals."
        },
        "Sales": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to Sales Dashboard",
                    "description": "Manage your doctor relationships and sales pipeline",
                    "duration": 2
                },
                {
                    "name": "doctor_management",
                    "title": "Doctor Management",
                    "description": "Add and manage your doctor accounts",
                    "duration": 8
                },
                {
                    "name": "schedule_setup",
                    "title": "Schedule Management",
                    "description": "Set up appointments and follow-ups",
                    "duration": 5
                },
                {
                    "name": "analytics_overview",
                    "title": "Sales Analytics",
                    "description": "Track your performance and opportunities",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Dashboard Features",
                    "description": "Explore all sales tools and features",
                    "duration": 5
                }
            ],
            "estimated_duration": 30,
            "welcome_message": "Welcome to your sales command center! Manage your doctor relationships, track performance, and grow your territory effectively.",
            "completion_message": "You're all set! Start building relationships with doctors and tracking your sales success. Your dashboard has everything you need to excel."
        },
        "Master Distributor": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to Distribution Management",
                    "description": "Oversee regional distribution operations",
                    "duration": 2
                },
                {
                    "name": "order_management",
                    "title": "Order Processing",
                    "description": "Manage orders across your distribution network",
                    "duration": 10
                },
                {
                    "name": "shipping_logistics",
                    "title": "Shipping & Logistics",
                    "description": "Coordinate shipments and track deliveries",
                    "duration": 8
                },
                {
                    "name": "analytics_reports",
                    "title": "Analytics & Reporting",
                    "description": "Monitor performance across regions",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Master Dashboard",
                    "description": "Navigate your comprehensive control center",
                    "duration": 5
                }
            ],
            "estimated_duration": 35,
            "welcome_message": "Welcome to the Master Distribution Platform! You'll oversee regional operations, manage logistics, and ensure efficient product distribution.",
            "completion_message": "Perfect! You're ready to manage your distribution network efficiently. Use your dashboard to monitor operations and optimize performance."
        },
        "Distributor": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to Regional Distribution",
                    "description": "Manage your local distribution operations",
                    "duration": 2
                },
                {
                    "name": "order_queue",
                    "title": "Order Queue Management",
                    "description": "Process and fulfill local orders",
                    "duration": 8
                },
                {
                    "name": "shipment_tracking",
                    "title": "Shipment Tracking",
                    "description": "Monitor deliveries in your territory",
                    "duration": 5
                },
                {
                    "name": "territory_management",
                    "title": "Territory Operations",
                    "description": "Manage your regional coverage and retailers",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Regional Dashboard",
                    "description": "Master your regional control center",
                    "duration": 5
                }
            ],
            "estimated_duration": 30,
            "welcome_message": "Welcome to Regional Distribution! You'll manage local operations, fulfill orders, and serve your territory effectively.",
            "completion_message": "Great! You're ready to manage your regional operations. Your dashboard provides everything needed for efficient local distribution."
        },
        "Admin": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to System Administration",
                    "description": "Manage the entire healthcare platform",
                    "duration": 2
                },
                {
                    "name": "user_management",
                    "title": "User Management",
                    "description": "Create and manage user accounts and roles",
                    "duration": 10
                },
                {
                    "name": "system_configuration",
                    "title": "System Configuration",
                    "description": "Configure platform settings and features",
                    "duration": 8
                },
                {
                    "name": "audit_compliance",
                    "title": "Audit & Compliance",
                    "description": "Monitor compliance and review audit logs",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Admin Dashboard",
                    "description": "Navigate the comprehensive admin interface",
                    "duration": 5
                }
            ],
            "estimated_duration": 35,
            "welcome_message": "Welcome to System Administration! You have full control over the platform. Let's ensure you can manage users, monitor compliance, and maintain system health.",
            "completion_message": "Excellent! You're ready to administer the platform. Use your tools to maintain security, compliance, and optimal performance for all users."
        },
        "CHP Admin": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to CHP Administration",
                    "description": "Manage Community Health Programs",
                    "duration": 2
                },
                {
                    "name": "program_management",
                    "title": "Program Management",
                    "description": "Oversee health programs and initiatives",
                    "duration": 10
                },
                {
                    "name": "community_partners",
                    "title": "Community Partners",
                    "description": "Manage partnerships and collaborations",
                    "duration": 8
                },
                {
                    "name": "compliance_tracking",
                    "title": "Compliance Tracking",
                    "description": "Monitor program compliance and outcomes",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "CHP Dashboard",
                    "description": "Navigate your program management center",
                    "duration": 5
                }
            ],
            "estimated_duration": 35,
            "welcome_message": "Welcome to Community Health Program Administration! You'll oversee health initiatives, manage partnerships, and ensure program success.",
            "completion_message": "Perfect! You're ready to lead community health initiatives. Your dashboard provides comprehensive tools for program management and impact tracking."
        },
        "Shipping and Logistics": {
            "steps": [
                {
                    "name": "welcome",
                    "title": "Welcome to Logistics Management",
                    "description": "Coordinate shipping and delivery operations",
                    "duration": 2
                },
                {
                    "name": "shipping_queue",
                    "title": "Shipping Queue",
                    "description": "Process and prioritize shipments",
                    "duration": 8
                },
                {
                    "name": "carrier_management",
                    "title": "Carrier Management",
                    "description": "Coordinate with shipping carriers",
                    "duration": 5
                },
                {
                    "name": "warehouse_config",
                    "title": "Warehouse Configuration",
                    "description": "Manage warehouse settings and inventory",
                    "duration": 10
                },
                {
                    "name": "dashboard_tour",
                    "title": "Logistics Dashboard",
                    "description": "Master your logistics control center",
                    "duration": 5
                }
            ],
            "estimated_duration": 30,
            "welcome_message": "Welcome to Logistics Management! You'll coordinate shipments, manage carriers, and ensure timely deliveries across the network.",
            "completion_message": "Excellent! You're ready to manage logistics operations efficiently. Your dashboard provides all tools needed for smooth shipping coordination."
        }
    }

    def get_user_onboarding_progress(self, user_id: str):
        """Get user's onboarding progress."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        steps = (
            self.db.query(OnboardingProgress)
            .filter(OnboardingProgress.user_id == user_id)
            .order_by(OnboardingProgress.step_order)
            .all()
        )

        total_steps = len(steps)
        completed_steps = sum(1 for step in steps if step.completed)
        progress_percentage = (
            (completed_steps / total_steps * 100) if total_steps > 0 else 0
        )

        # Find current step (first incomplete step)
        current_step = None
        for step in steps:
            if not step.completed:
                current_step = step.step_name
                break

        return {
            "user_id": str(user_id),
            "total_steps": total_steps,
            "completed_steps": completed_steps,
            "current_step": current_step,
            "progress_percentage": progress_percentage,
            "onboarding_completed": user.onboarding_completed or False,
            "onboarding_started_at": user.onboarding_started_at,
            "onboarding_completed_at": user.onboarding_completed_at,
            "steps": [step.to_dict() for step in steps]
        }

    def start_onboarding(self, user_id: str, skip_welcome: bool = False):
        """Start onboarding for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Mark onboarding as started
        if not user.onboarding_started_at:
            user.onboarding_started_at = datetime.utcnow()
            user.onboarding_step = 1

        # If skipping welcome, mark welcome step as completed
        if skip_welcome:
            welcome_step = (
                self.db.query(OnboardingProgress)
                .filter(
                    and_(
                        OnboardingProgress.user_id == user_id,
                        OnboardingProgress.step_name == "welcome"
                    )
                )
                .first()
            )
            if welcome_step:
                welcome_step.mark_completed()

        self.db.commit()
        return self.get_user_onboarding_progress(user_id)

    def complete_step(self, user_id: str, step_name: str, data: Optional[Dict[str, Any]] = None):
        """Complete an onboarding step."""
        step = (
            self.db.query(OnboardingProgress)
            .filter(
                and_(
                    OnboardingProgress.user_id == user_id,
                    OnboardingProgress.step_name == step_name
                )
            )
            .first()
        )

        if not step:
            raise ValueError(f"Onboarding step '{step_name}' not found for user")

        step.mark_completed()
        if data:
            step.data.update(data)

        # Update user's current step
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.onboarding_step = step.step_order + 1

        # Check if all steps are completed
        total_steps = (
            self.db.query(OnboardingProgress)
            .filter(OnboardingProgress.user_id == user_id)
            .count()
        )
        completed_steps = (
            self.db.query(OnboardingProgress)
            .filter(
                and_(
                    OnboardingProgress.user_id == user_id,
                    OnboardingProgress.completed == True
                )
            )
            .count()
        )

        if completed_steps >= total_steps and user:
            user.onboarding_completed = True
            user.onboarding_completed_at = datetime.utcnow()

        self.db.commit()
        return step.to_dict()

    def skip_onboarding(self, user_id: str, reason: Optional[str] = None) -> None:
        """Skip onboarding for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        user.onboarding_skipped = True
        user.onboarding_completed = True
        user.onboarding_completed_at = datetime.utcnow()

        # Mark all steps as completed
        steps = (
            self.db.query(OnboardingProgress)
            .filter(OnboardingProgress.user_id == user_id)
            .all()
        )

        for step in steps:
            if not step.completed:
                step.mark_completed()
                if reason:
                    step.data["skip_reason"] = reason

        self.db.commit()

    def get_role_config(self, role: str) -> RoleOnboardingConfig:
        """Get onboarding configuration for a role."""
        config = self.ROLE_CONFIGS.get(role)
        if not config:
            # Default configuration for unknown roles
            config = {
                "steps": [
                    {
                        "name": "welcome",
                        "title": "Welcome",
                        "description": "Welcome to the platform",
                        "duration": 2
                    },
                    {
                        "name": "dashboard_tour",
                        "title": "Dashboard Tour",
                        "description": "Explore your dashboard",
                        "duration": 5
                    }
                ],
                "estimated_duration": 10,
                "welcome_message": "Welcome to the Healthcare IVR Platform!",
                "completion_message": "You're all set up and ready to go!"
            }

        return RoleOnboardingConfig(
            role=role,
            steps=config["steps"],
            estimated_duration=config["estimated_duration"],
            welcome_message=config["welcome_message"],
            completion_message=config["completion_message"]
        )

    def reset_onboarding(self, user_id: str) -> OnboardingProgressResponse:
        """Reset onboarding for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Reset user onboarding fields
        user.onboarding_completed = False
        user.onboarding_started_at = None
        user.onboarding_completed_at = None
        user.onboarding_step = 0
        user.onboarding_skipped = False

        # Reset all steps
        steps = (
            self.db.query(OnboardingProgress)
            .filter(OnboardingProgress.user_id == user_id)
            .all()
        )

        for step in steps:
            step.completed = False
            step.completed_at = None
            step.data = {}

        self.db.commit()
        return self.get_user_onboarding_progress(user_id)

    def should_show_onboarding(self, user_id: str) -> bool:
        """Check if onboarding should be shown for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Show onboarding if:
        # 1. User hasn't completed onboarding
        # 2. User hasn't skipped onboarding
        # 3. User has logged in (first_login_at is set)
        return (
            not user.onboarding_completed and
            not user.onboarding_skipped and
            user.first_login_at is not None
        )