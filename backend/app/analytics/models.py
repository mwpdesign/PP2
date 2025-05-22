# type: ignore
"""Analytics data models for the data warehouse."""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    JSON, Index, Boolean
)
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


# Dimension Tables

class TimeDimension(Base):
    """Time dimension for date-based analytics."""
    __tablename__ = "dim_time"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False, unique=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    week_of_year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)
    is_weekend = Column(Boolean, nullable=False)
    is_holiday = Column(Boolean, nullable=False)
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_time_date', 'date'),
        Index('idx_time_year_month', 'year', 'month')
    )


class GeographyDimension(Base):
    """Geography dimension for location-based analytics."""
    __tablename__ = "dim_geography"
    
    id = Column(Integer, primary_key=True)
    territory_id = Column(String(36), nullable=False)
    state = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    zip_code = Column(String(10), nullable=False)
    timezone = Column(String(50), nullable=False)
    region = Column(String(50), nullable=False)
    
    __table_args__ = (
        Index('idx_geography_territory', 'territory_id'),
        Index('idx_geography_region', 'region')
    )


class OrganizationDimension(Base):
    """Organization dimension for company-based analytics."""
    __tablename__ = "dim_organization"
    
    id = Column(Integer, primary_key=True)
    org_id = Column(String(36), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # hospital, clinic, pharmacy, etc.
    size_category = Column(String(20), nullable=False)
    subscription_tier = Column(String(20), nullable=False)
    territory_id = Column(String(36), nullable=False)
    
    __table_args__ = (
        Index('idx_org_territory', 'territory_id'),
        Index('idx_org_type', 'type')
    )


class InsuranceProviderDimension(Base):
    """Insurance provider dimension for performance analytics."""
    __tablename__ = "dim_insurance_provider"
    
    id = Column(Integer, primary_key=True)
    provider_id = Column(String(36), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    # private, medicare, medicaid
    type = Column(String(50), nullable=False)
    coverage_level = Column(String(50), nullable=False)
    # expected response time in seconds
    response_sla = Column(Integer, nullable=False)
    
    __table_args__ = (
        Index('idx_provider_type', 'type'),
        Index('idx_provider_name', 'name')
    )


class PatientDemographicsDimension(Base):
    """Anonymized patient demographics for population analytics."""
    __tablename__ = "dim_patient_demographics"
    
    id = Column(Integer, primary_key=True)
    age_group = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    # First 3 digits of ZIP for HIPAA compliance
    zip3 = Column(String(3), nullable=False)
    income_bracket = Column(String(20))
    insurance_type = Column(String(50), nullable=False)
    
    __table_args__ = (
        Index('idx_demographics_zip3', 'zip3'),
        Index('idx_demographics_age', 'age_group')
    )


class PatientSatisfactionDimension(Base):
    """Dimension for tracking detailed patient satisfaction metrics."""
    __tablename__ = "dim_patient_satisfaction"
    
    id = Column(Integer, primary_key=True)
    satisfaction_level = Column(String(20), nullable=False)  # high, medium, low
    feedback_category = Column(String(50), nullable=False)  # wait time, service quality, etc.
    response_channel = Column(String(20), nullable=False)  # ivr, sms, email
    sentiment_score = Column(Float, nullable=False)
    
    __table_args__ = (
        Index('idx_satisfaction_level', 'satisfaction_level'),
        Index('idx_feedback_category', 'feedback_category')
    )


class VerificationPerformanceDimension(Base):
    """Dimension for detailed insurance verification performance metrics."""
    __tablename__ = "dim_verification_performance"
    
    id = Column(Integer, primary_key=True)
    verification_type = Column(String(50), nullable=False)  # real-time, batch, manual
    response_time_category = Column(String(20), nullable=False)  # fast, medium, slow
    error_type = Column(String(50))  # timeout, invalid data, system error
    retry_count = Column(Integer, default=0)
    sla_category = Column(String(20), nullable=False)  # met, missed, critical
    
    __table_args__ = (
        Index('idx_verification_type', 'verification_type'),
        Index('idx_sla_category', 'sla_category')
    )


# Fact Tables

class CallFact(Base):
    """Fact table for IVR call analytics."""
    __tablename__ = "fact_calls"
    
    id = Column(Integer, primary_key=True)
    call_id = Column(String(36), nullable=False, unique=True)
    time_id = Column(Integer, ForeignKey('dim_time.id'), nullable=False)
    geography_id = Column(Integer, ForeignKey('dim_geography.id'), nullable=False)
    organization_id = Column(Integer, ForeignKey('dim_organization.id'), nullable=False)
    
    # Metrics
    duration_seconds = Column(Integer, nullable=False)
    menu_selections = Column(JSON, nullable=False)
    outcome = Column(String(50), nullable=False)
    satisfaction_score = Column(Integer)
    error_count = Column(Integer, default=0)
    transfer_count = Column(Integer, default=0)
    
    # Additional metrics for insurance performance
    insurance_provider_id = Column(Integer, ForeignKey('dim_insurance_provider.id'), nullable=False)
    approval_status = Column(String(50), nullable=False)
    verification_time_seconds = Column(Integer, nullable=False)
    patient_demographics_id = Column(Integer, ForeignKey('dim_patient_demographics.id'))
    
    # Additional metrics for satisfaction and verification
    satisfaction_id = Column(Integer, ForeignKey('dim_patient_satisfaction.id'))
    verification_performance_id = Column(Integer, ForeignKey('dim_verification_performance.id'))
    sentiment_score = Column(Float)
    feedback_text = Column(String(500))
    
    # Partitioning by date for performance
    partition_date = Column(DateTime, nullable=False)
    
    __table_args__ = (
        Index('idx_calls_date', 'partition_date'),
        Index('idx_calls_outcome', 'outcome'),
        Index('idx_calls_approval', 'approval_status'),
        Index('idx_calls_satisfaction', 'satisfaction_id'),
        Index('idx_calls_verification', 'verification_performance_id')
    )


class OrderFact(Base):
    """Fact table for order analytics."""
    __tablename__ = "fact_orders"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String(36), nullable=False, unique=True)
    time_id = Column(Integer, ForeignKey('dim_time.id'), nullable=False)
    geography_id = Column(Integer, ForeignKey('dim_geography.id'), nullable=False)
    organization_id = Column(Integer, ForeignKey('dim_organization.id'), nullable=False)
    
    # Metrics
    total_amount = Column(Float, nullable=False)
    item_count = Column(Integer, nullable=False)
    shipping_cost = Column(Float, nullable=False)
    processing_time_seconds = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)
    carrier = Column(String(50), nullable=False)
    delivery_sla_met = Column(Boolean, nullable=False)
    
    # Partitioning by date for performance
    partition_date = Column(DateTime, nullable=False)
    
    __table_args__ = (
        Index('idx_orders_date', 'partition_date'),
        Index('idx_orders_status', 'status')
    )


class NotificationFact(Base):
    """Fact table for notification analytics."""
    __tablename__ = "fact_notifications"
    
    id = Column(Integer, primary_key=True)
    notification_id = Column(String(36), nullable=False, unique=True)
    time_id = Column(Integer, ForeignKey('dim_time.id'), nullable=False)
    geography_id = Column(Integer, ForeignKey('dim_geography.id'), nullable=False)
    organization_id = Column(Integer, ForeignKey('dim_organization.id'), nullable=False)
    
    # Metrics
    channel = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    delivery_time_seconds = Column(Integer)
    retry_count = Column(Integer, default=0)
    priority = Column(String(20), nullable=False)
    
    # Partitioning by date for performance
    partition_date = Column(DateTime, nullable=False)
    
    __table_args__ = (
        Index('idx_notifications_date', 'partition_date'),
        Index('idx_notifications_channel', 'channel')
    )


# Aggregation Tables

class DailyMetrics(Base):
    """Pre-calculated daily metrics for fast dashboard access."""
    __tablename__ = "agg_daily_metrics"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False)
    organization_id = Column(Integer, ForeignKey('dim_organization.id'), nullable=False)
    territory_id = Column(String(36), nullable=False)
    
    # Call metrics
    total_calls = Column(Integer, nullable=False, default=0)
    avg_call_duration = Column(Float, nullable=False, default=0)
    call_success_rate = Column(Float, nullable=False, default=0)
    
    # Order metrics
    total_orders = Column(Integer, nullable=False, default=0)
    total_revenue = Column(Float, nullable=False, default=0)
    avg_order_value = Column(Float, nullable=False, default=0)
    sla_compliance_rate = Column(Float, nullable=False, default=0)
    
    # Notification metrics
    notification_success_rate = Column(Float, nullable=False, default=0)
    avg_delivery_time = Column(Float, nullable=False, default=0)
    
    # System metrics
    error_rate = Column(Float, nullable=False, default=0)
    system_latency = Column(Float, nullable=False, default=0)
    
    # Insurance provider metrics
    verification_success_rate = Column(Float, nullable=False, default=0)
    avg_verification_time = Column(Float, nullable=False, default=0)
    approval_rate_by_provider = Column(JSONB, nullable=False, default={})
    
    # Fulfillment metrics
    avg_fulfillment_time = Column(Float, nullable=False, default=0)
    fulfillment_sla_compliance = Column(Float, nullable=False, default=0)
    
    # Territory metrics
    territory_approval_rates = Column(JSONB, nullable=False, default={})
    territory_response_times = Column(JSONB, nullable=False, default={})
    
    # Additional satisfaction metrics
    satisfaction_by_category = Column(JSONB, nullable=False, default={})
    sentiment_trend = Column(JSONB, nullable=False, default={})
    feedback_categories = Column(JSONB, nullable=False, default={})
    
    # Additional verification metrics
    verification_by_type = Column(JSONB, nullable=False, default={})
    sla_performance = Column(JSONB, nullable=False, default={})
    error_distribution = Column(JSONB, nullable=False, default={})
    
    __table_args__ = (
        Index('idx_daily_metrics_date', 'date'),
        Index('idx_daily_metrics_territory', 'territory_id')
    )


class HourlyMetrics(Base):
    """Pre-calculated hourly metrics for real-time analytics."""
    __tablename__ = "agg_hourly_metrics"
    
    id = Column(Integer, primary_key=True)
    hour = Column(DateTime, nullable=False)
    organization_id = Column(Integer, ForeignKey('dim_organization.id'), nullable=False)
    territory_id = Column(String(36), nullable=False)
    
    # Real-time metrics
    active_calls = Column(Integer, nullable=False, default=0)
    active_orders = Column(Integer, nullable=False, default=0)
    pending_notifications = Column(Integer, nullable=False, default=0)
    system_health_score = Column(Float, nullable=False, default=100)
    
    # Performance metrics
    avg_response_time = Column(Float, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    
    __table_args__ = (
        Index('idx_hourly_metrics_hour', 'hour'),
        Index('idx_hourly_metrics_territory', 'territory_id')
    ) 