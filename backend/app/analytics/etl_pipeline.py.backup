"""ETL pipeline for analytics data warehouse with data quality validation."""

from datetime import datetime
from typing import Dict, List, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.analytics.models import (
    CallFact, NotificationFact,
    DailyMetrics,
    PatientSatisfactionDimension,
    VerificationPerformanceDimension
)
from app.services.redis_cache import RedisCache


class DataQualityValidator:
    """Validates data quality before ETL processing."""
    
    @staticmethod
    def validate_completeness(data: Dict) -> Tuple[bool, List[str]]:
        """Check for missing required fields."""
        errors = []
        required_fields = {
            'time_id', 'geography_id', 'organization_id',
            'insurance_provider_id', 'approval_status',
            'satisfaction_level', 'verification_type'
        }
        
        missing = required_fields - set(data.keys())
        if missing:
            errors.append(f"Missing required fields: {missing}")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_data_types(data: Dict) -> Tuple[bool, List[str]]:
        """Validate data types of fields."""
        errors = []
        type_checks = {
            'time_id': int,
            'duration_seconds': int,
            'verification_time_seconds': int,
            'approval_status': str,
            'satisfaction_level': str,
            'sentiment_score': float,
            'verification_type': str
        }
        
        for field, expected_type in type_checks.items():
            if field in data and not isinstance(data[field], expected_type):
                errors.append(
                    f"Invalid type for {field}: expected {expected_type}, "
                    f"got {type(data[field])}"
                )
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_business_rules(data: Dict) -> Tuple[bool, List[str]]:
        """Validate business rules and constraints."""
        errors = []
        
        # Duration must be positive
        if 'duration_seconds' in data and data['duration_seconds'] < 0:
            errors.append("Duration cannot be negative")
            
        # Verify valid approval status
        valid_statuses = {'approved', 'denied', 'pending', 'expired'}
        if ('approval_status' in data and 
            data['approval_status'] not in valid_statuses):
            errors.append(
                f"Invalid approval status: {data['approval_status']}"
            )
        
        # Verify valid satisfaction level
        valid_satisfaction = {'high', 'medium', 'low'}
        if ('satisfaction_level' in data and 
            data['satisfaction_level'] not in valid_satisfaction):
            errors.append(
                f"Invalid satisfaction level: {data['satisfaction_level']}"
            )
        
        # Verify valid verification type
        valid_verification = {'real-time', 'batch', 'manual'}
        if ('verification_type' in data and 
            data['verification_type'] not in valid_verification):
            errors.append(
                f"Invalid verification type: {data['verification_type']}"
            )
        
        return len(errors) == 0, errors


class ETLPipeline:
    """Manages ETL processes for analytics data warehouse."""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = DataQualityValidator()
        self.cache = RedisCache()
    
    def process_satisfaction_data(self, data: Dict) -> int:
        """Process satisfaction data and return dimension ID."""
        satisfaction = PatientSatisfactionDimension(
            satisfaction_level=data['satisfaction_level'],
            feedback_category=data['feedback_category'],
            response_channel=data['response_channel'],
            sentiment_score=data['sentiment_score']
        )
        self.db.add(satisfaction)
        self.db.flush()  # Get ID without committing
        return satisfaction.id
    
    def process_verification_data(self, data: Dict) -> int:
        """Process verification performance data and return dimension ID."""
        verification = VerificationPerformanceDimension(
            verification_type=data['verification_type'],
            response_time_category=data['response_time_category'],
            error_type=data.get('error_type'),
            retry_count=data.get('retry_count', 0),
            sla_category=data['sla_category']
        )
        self.db.add(verification)
        self.db.flush()  # Get ID without committing
        return verification.id
    
    def process_call_data(self, call_data: Dict) -> bool:
        """Process and validate call data for analytics."""
        # Validate data quality
        validations = [
            self.validator.validate_completeness(call_data),
            self.validator.validate_data_types(call_data),
            self.validator.validate_business_rules(call_data)
        ]
        
        for is_valid, errors in validations:
            if not is_valid:
                # Log validation errors
                print(f"Validation errors: {errors}")
                return False
        
        try:
            # Process dimension data first
            satisfaction_id = self.process_satisfaction_data(call_data)
            verification_id = self.process_verification_data(call_data)
            
            # Create call fact record
            call_fact = CallFact(
                call_id=call_data['call_id'],
                time_id=call_data['time_id'],
                geography_id=call_data['geography_id'],
                organization_id=call_data['organization_id'],
                insurance_provider_id=call_data['insurance_provider_id'],
                duration_seconds=call_data['duration_seconds'],
                approval_status=call_data['approval_status'],
                verification_time_seconds=call_data['verification_time_seconds'],
                satisfaction_id=satisfaction_id,
                verification_performance_id=verification_id,
                sentiment_score=call_data['sentiment_score'],
                feedback_text=call_data.get('feedback_text'),
                partition_date=datetime.now().date()
            )
            
            self.db.add(call_fact)
            self.db.commit()
            
            # Update cache for real-time analytics
            self._update_cache(call_data)
            
            return True
            
        except Exception as e:
            print(f"Error processing call data: {e}")
            self.db.rollback()
            return False
    
    def _update_cache(self, call_data: Dict) -> None:
        """Update Redis cache with real-time metrics."""
        org_id = call_data['organization_id']
        cache_key = f"call_metrics:{org_id}"
        
        # Update basic metrics
        self.cache.hincrby(cache_key, "total_calls", 1)
        self.cache.hincrbyfloat(
            cache_key,
            "avg_duration",
            call_data['duration_seconds']
        )
        
        # Update satisfaction metrics
        satisfaction_key = f"satisfaction:{org_id}"
        self.cache.hincrby(
            satisfaction_key,
            call_data['satisfaction_level'],
            1
        )
        self.cache.hincrbyfloat(
            satisfaction_key,
            "avg_sentiment",
            call_data['sentiment_score']
        )
        
        # Update verification metrics
        verification_key = f"verification:{org_id}"
        self.cache.hincrby(
            verification_key,
            call_data['verification_type'],
            1
        )
        self.cache.hincrby(
            verification_key,
            call_data['sla_category'],
            1
        )
    
    def update_daily_metrics(self, date: datetime) -> bool:
        """Update daily aggregated metrics."""
        try:
            # Calculate metrics for the specified date
            metrics_query = text("""
                INSERT INTO agg_daily_metrics (
                    date, organization_id, territory_id,
                    total_calls, avg_call_duration, call_success_rate,
                    verification_success_rate, avg_verification_time,
                    approval_rate_by_provider, territory_approval_rates
                )
                SELECT 
                    DATE(:date) as date,
                    c.organization_id,
                    g.territory_id,
                    COUNT(*) as total_calls,
                    AVG(c.duration_seconds) as avg_call_duration,
                    SUM(CASE WHEN c.outcome = 'success' THEN 1 ELSE 0 END)::float / 
                        COUNT(*) as call_success_rate,
                    SUM(CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END)::float / 
                        COUNT(*) as verification_success_rate,
                    AVG(c.verification_time_seconds) as avg_verification_time,
                    jsonb_object_agg(
                        i.provider_id,
                        SUM(CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END)::float / 
                            COUNT(*)
                    ) as approval_rate_by_provider,
                    jsonb_object_agg(
                        g.territory_id,
                        SUM(CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END)::float / 
                            COUNT(*)
                    ) as territory_approval_rates
                FROM fact_calls c
                JOIN dim_geography g ON c.geography_id = g.id
                JOIN dim_insurance_provider i ON c.insurance_provider_id = i.id
                WHERE DATE(c.partition_date) = DATE(:date)
                GROUP BY c.organization_id, g.territory_id
                ON CONFLICT (date, organization_id) 
                DO UPDATE SET
                    total_calls = EXCLUDED.total_calls,
                    avg_call_duration = EXCLUDED.avg_call_duration,
                    call_success_rate = EXCLUDED.call_success_rate,
                    verification_success_rate = EXCLUDED.verification_success_rate,
                    avg_verification_time = EXCLUDED.avg_verification_time,
                    approval_rate_by_provider = EXCLUDED.approval_rate_by_provider,
                    territory_approval_rates = EXCLUDED.territory_approval_rates
            """)
            
            self.db.execute(metrics_query, {"date": date})
            self.db.commit()
            
            # Update cache
            self.cache.delete_pattern("daily_metrics:*")
            return True
            
        except Exception as e:
            print(f"Error updating daily metrics: {e}")
            self.db.rollback()
            return False


def get_etl_pipeline(db: Session = next(get_db())) -> ETLPipeline:
    """Dependency injection for ETL pipeline."""
    return ETLPipeline(db) 