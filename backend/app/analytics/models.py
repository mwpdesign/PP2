"""
Analytics models for the healthcare IVR platform.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID, uuid4
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


# Dimension Tables


class DimTime(Base):
    """Time dimension for date-based analytics."""

    __tablename__ = "dim_time"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, unique=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    hour: Mapped[int] = mapped_column(Integer, nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    week_of_year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    is_weekend: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_holiday: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Indexes for common queries
    __table_args__ = (
        Index("idx_time_date", "date"),
        Index("idx_time_year_month", "year", "month"),
    )


class DimGeography(Base):
    """Geography dimension for location-based analytics."""

    __tablename__ = "dim_geography"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    territory_id: Mapped[str] = mapped_column(String(36), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=False)

    __table_args__ = (
        Index("idx_geography_territory", "territory_id"),
        Index("idx_geography_region", "region"),
    )


class DimOrganization(Base):
    """Organization dimension for company-based analytics."""

    __tablename__ = "dim_organization"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    org_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # hospital, clinic, pharmacy, etc.
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    size_category: Mapped[str] = mapped_column(String(20), nullable=False)
    subscription_tier: Mapped[str] = mapped_column(String(20), nullable=False)
    territory_id: Mapped[str] = mapped_column(String(36), nullable=False)

    __table_args__ = (
        Index("idx_org_territory", "territory_id"),
        Index("idx_org_type", "type"),
    )


class DimInsuranceProvider(Base):
    """Insurance provider dimension for performance analytics."""

    __tablename__ = "dim_insurance_provider"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # private, medicare, medicaid
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    coverage_level: Mapped[str] = mapped_column(String(50), nullable=False)
    # expected response time in seconds
    response_sla: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_provider_type", "type"),
        Index("idx_provider_name", "name"),
    )


class DimPatientDemographics(Base):
    """Anonymized patient demographics for population analytics."""

    __tablename__ = "dim_patient_demographics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    # First 3 digits of ZIP for HIPAA compliance
    zip3: Mapped[str] = mapped_column(String(3), nullable=False)
    income_bracket: Mapped[Optional[str]] = mapped_column(String(20))
    insurance_type: Mapped[str] = mapped_column(String(50), nullable=False)

    __table_args__ = (
        Index("idx_demographics_zip3", "zip3"),
        Index("idx_demographics_age", "age_group"),
    )


class DimPatientSatisfaction(Base):
    """Dimension for tracking detailed patient satisfaction metrics."""

    __tablename__ = "dim_patient_satisfaction"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # high, medium, low
    satisfaction_level: Mapped[str] = mapped_column(String(20), nullable=False)
    # wait time, service quality, etc.
    feedback_category: Mapped[str] = mapped_column(String(50), nullable=False)
    # ivr, sms, email
    response_channel: Mapped[str] = mapped_column(String(20), nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (
        Index("idx_satisfaction_level", "satisfaction_level"),
        Index("idx_feedback_category", "feedback_category"),
    )


class DimVerificationPerformance(Base):
    """Dimension for detailed insurance verification performance metrics."""

    __tablename__ = "dim_verification_performance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # real-time, batch, manual
    verification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # fast, medium, slow
    response_time_category: Mapped[str] = mapped_column(String(20), nullable=False)
    # timeout, invalid data, system error
    error_type: Mapped[Optional[str]] = mapped_column(String(50))
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    # met, missed, critical
    sla_category: Mapped[str] = mapped_column(String(20), nullable=False)

    __table_args__ = (
        Index("idx_verification_type", "verification_type"),
        Index("idx_sla_category", "sla_category"),
    )


# Fact Tables


class FactIVRCall(Base):
    """Fact table for IVR call analytics."""

    __tablename__ = "fact_ivr_call"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    call_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    time_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_time.id"), nullable=False
    )
    geography_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_geography.id"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_organization.id"), nullable=False
    )

    # Metrics
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    menu_selections: Mapped[dict] = mapped_column(JSON, nullable=False)
    outcome: Mapped[str] = mapped_column(String(50), nullable=False)
    satisfaction_score: Mapped[Optional[int]] = mapped_column(Integer)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    transfer_count: Mapped[int] = mapped_column(Integer, default=0)

    # Additional metrics for insurance performance
    insurance_provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_insurance_provider.id"), nullable=False
    )
    approval_status: Mapped[str] = mapped_column(String(50), nullable=False)
    verification_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    patient_demographics_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("dim_patient_demographics.id")
    )

    # Additional metrics for satisfaction and verification
    satisfaction_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("dim_patient_satisfaction.id")
    )
    verification_performance_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("dim_verification_performance.id")
    )
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float)
    feedback_text: Mapped[Optional[str]] = mapped_column(String(500))

    # Partitioning by date for performance
    partition_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (
        Index("idx_calls_date", "partition_date"),
        Index("idx_calls_outcome", "outcome"),
        Index("idx_calls_approval", "approval_status"),
        Index("idx_calls_satisfaction", "satisfaction_id"),
        Index("idx_calls_verification", "verification_performance_id"),
    )


class FactOrder(Base):
    """Fact table for order analytics."""

    __tablename__ = "fact_order"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    time_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_time.id"), nullable=False
    )
    geography_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_geography.id"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_organization.id"), nullable=False
    )

    # Metrics
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    item_count: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_cost: Mapped[float] = mapped_column(Float, nullable=False)
    processing_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    carrier: Mapped[str] = mapped_column(String(50), nullable=False)
    delivery_sla_met: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Partitioning by date for performance
    partition_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (
        Index("idx_orders_date", "partition_date"),
        Index("idx_orders_status", "status"),
    )


class FactNotification(Base):
    """Fact table for notification analytics."""

    __tablename__ = "fact_notification"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    notification_id: Mapped[str] = mapped_column(
        String(36), nullable=False, unique=True
    )
    time_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_time.id"), nullable=False
    )
    geography_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_geography.id"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dim_organization.id"), nullable=False
    )

    # Metrics
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    delivery_time_seconds: Mapped[int] = mapped_column(Integer)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)

    # Partitioning by date for performance
    partition_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (
        Index("idx_notifications_date", "partition_date"),
        Index("idx_notifications_channel", "channel"),
        Index("idx_notifications_status", "status"),
        Index("idx_notifications_priority", "priority"),
    )


# Aggregation Tables


class GeographicMetrics(Base):
    """Geographic metrics model."""

    __tablename__ = "geographic_metrics"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    state: Mapped[str] = mapped_column(String(2))
    region: Mapped[str] = mapped_column(String(50))
    total_orders: Mapped[int] = mapped_column(default=0)
    total_patients: Mapped[int] = mapped_column(default=0)
    total_providers: Mapped[int] = mapped_column(default=0)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Indexes
    __table_args__ = (
        Index("idx_geography_org", "organization_id"),
        Index("idx_geography_state", "state"),
        Index("idx_geographic_metrics_region", "region"),
    )


class OrganizationMetrics(Base):
    """Organization metrics model."""

    __tablename__ = "organization_metrics"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    total_orders: Mapped[int] = mapped_column(default=0)
    total_patients: Mapped[int] = mapped_column(default=0)
    total_providers: Mapped[int] = mapped_column(default=0)
    total_facilities: Mapped[int] = mapped_column(default=0)
    total_users: Mapped[int] = mapped_column(default=0)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Indexes
    __table_args__ = (Index("idx_org_metrics", "organization_id"),)


class DailyMetrics(Base):
    """Daily metrics model."""

    __tablename__ = "daily_metrics"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    total_orders: Mapped[int] = mapped_column(default=0)
    total_patients: Mapped[int] = mapped_column(default=0)
    total_providers: Mapped[int] = mapped_column(default=0)
    total_facilities: Mapped[int] = mapped_column(default=0)
    total_users: Mapped[int] = mapped_column(default=0)
    active_users: Mapped[int] = mapped_column(default=0)
    new_orders: Mapped[int] = mapped_column(default=0)
    completed_orders: Mapped[int] = mapped_column(default=0)
    cancelled_orders: Mapped[int] = mapped_column(default=0)
    new_patients: Mapped[int] = mapped_column(default=0)
    new_providers: Mapped[int] = mapped_column(default=0)
    provider_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    patient_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    order_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Indexes
    __table_args__ = (
        Index("idx_daily_metrics_org", "organization_id"),
        Index("idx_daily_metrics_date", "date"),
    )


class HourlyMetrics(Base):
    """Hourly metrics model."""

    __tablename__ = "hourly_metrics"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    total_orders: Mapped[int] = mapped_column(default=0)
    total_patients: Mapped[int] = mapped_column(default=0)
    total_providers: Mapped[int] = mapped_column(default=0)
    total_facilities: Mapped[int] = mapped_column(default=0)
    total_users: Mapped[int] = mapped_column(default=0)
    active_users: Mapped[int] = mapped_column(default=0)
    new_orders: Mapped[int] = mapped_column(default=0)
    completed_orders: Mapped[int] = mapped_column(default=0)
    cancelled_orders: Mapped[int] = mapped_column(default=0)
    new_patients: Mapped[int] = mapped_column(default=0)
    new_providers: Mapped[int] = mapped_column(default=0)
    provider_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    patient_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    order_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Indexes
    __table_args__ = (
        Index("idx_hourly_metrics_org", "organization_id"),
        Index("idx_hourly_metrics_timestamp", "timestamp"),
    )


class AnalyticsEvent(Base):
    """Analytics event model."""

    __tablename__ = "analytics_events"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_source: Mapped[str] = mapped_column(String(50), nullable=False)
    event_data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    user_id: Mapped[Optional[UUID]] = mapped_column(
        PyUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
