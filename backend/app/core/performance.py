"""
Performance Monitoring Module for Healthcare IVR Platform

Provides comprehensive monitoring for encryption operations, cache performance,
memory usage, and system metrics with HIPAA-compliant logging and alerting.
"""

import time
import logging
import psutil
import threading
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from contextlib import contextmanager
from collections import defaultdict, deque
import asyncio

from app.core.config import get_settings
from app.services.audit_service import get_audit_service, AuditEventType, DataClassification

logger = logging.getLogger(__name__)


class PerformanceMetricType(Enum):
    """Types of performance metrics."""

    ENCRYPTION_TIME = "encryption_time"
    DECRYPTION_TIME = "decryption_time"
    CACHE_HIT_RATIO = "cache_hit_ratio"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    DATABASE_QUERY_TIME = "database_query_time"
    API_RESPONSE_TIME = "api_response_time"
    BATCH_OPERATION_TIME = "batch_operation_time"


@dataclass
class PerformanceMetric:
    """Individual performance metric data."""

    metric_type: PerformanceMetricType
    value: float
    timestamp: datetime
    operation_id: Optional[str] = None
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    field_name: Optional[str] = None
    data_size: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None


@dataclass
class PerformanceAlert:
    """Performance alert configuration."""

    metric_type: PerformanceMetricType
    threshold: float
    comparison: str  # 'gt', 'lt', 'eq'
    window_minutes: int
    alert_callback: Optional[Callable] = None


class PerformanceMonitor:
    """
    Comprehensive performance monitoring system.

    Features:
    - Real-time metric collection
    - Encryption operation timing
    - Cache performance tracking
    - Memory and CPU monitoring
    - Alert system for thresholds
    - Historical data retention
    - HIPAA-compliant logging
    """

    def __init__(self):
        """Initialize the performance monitor."""
        self.settings = get_settings()
        self.audit_service = get_audit_service()

        # Metric storage (in-memory with configurable retention)
        self.metrics: Dict[PerformanceMetricType, deque] = defaultdict(
            lambda: deque(maxlen=1000)  # Keep last 1000 metrics per type
        )

        # Performance alerts
        self.alerts: List[PerformanceAlert] = []

        # Operation tracking
        self.active_operations: Dict[str, Dict[str, Any]] = {}

        # Aggregated statistics
        self.stats: Dict[str, Any] = {
            "total_operations": 0,
            "encryption_operations": 0,
            "decryption_operations": 0,
            "cache_operations": 0,
            "average_encryption_time": 0.0,
            "average_decryption_time": 0.0,
            "peak_memory_usage": 0,
            "peak_cpu_usage": 0.0,
        }

        # Thread safety
        self._lock = threading.Lock()

        # Background monitoring
        self._monitoring_active = False
        self._monitoring_thread = None

        self._initialize_default_alerts()

    def _initialize_default_alerts(self) -> None:
        """Initialize default performance alerts."""
        default_alerts = [
            PerformanceAlert(
                metric_type=PerformanceMetricType.ENCRYPTION_TIME,
                threshold=5.0,  # 5 seconds
                comparison='gt',
                window_minutes=5,
                alert_callback=self._log_performance_alert
            ),
            PerformanceAlert(
                metric_type=PerformanceMetricType.MEMORY_USAGE,
                threshold=85.0,  # 85% memory usage
                comparison='gt',
                window_minutes=1,
                alert_callback=self._log_performance_alert
            ),
            PerformanceAlert(
                metric_type=PerformanceMetricType.CACHE_HIT_RATIO,
                threshold=0.5,  # 50% hit ratio
                comparison='lt',
                window_minutes=10,
                alert_callback=self._log_performance_alert
            ),
        ]

        self.alerts.extend(default_alerts)

    def _log_performance_alert(self, alert: PerformanceAlert, metric: PerformanceMetric) -> None:
        """Log performance alert to audit system."""
        try:
            self.audit_service.log_event(
                event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                details=f"Performance alert: {alert.metric_type.value} {alert.comparison} {alert.threshold}",
                resource_type="performance",
                resource_id=metric.operation_id,
                field_name=metric.field_name,
                data_classification=DataClassification.SENSITIVE,
                success=True,
                additional_data={
                    "metric_type": alert.metric_type.value,
                    "threshold": alert.threshold,
                    "actual_value": metric.value,
                    "comparison": alert.comparison,
                    "window_minutes": alert.window_minutes,
                    "timestamp": metric.timestamp.isoformat()
                }
            )

            logger.warning(
                f"Performance alert: {alert.metric_type.value} "
                f"{alert.comparison} {alert.threshold}, actual: {metric.value}"
            )

        except Exception as e:
            logger.error(f"Failed to log performance alert: {str(e)}")

    def record_metric(self, metric: PerformanceMetric) -> None:
        """Record a performance metric."""
        with self._lock:
            # Store metric
            self.metrics[metric.metric_type].append(metric)

            # Update statistics
            self._update_statistics(metric)

            # Check alerts
            self._check_alerts(metric)

    def _update_statistics(self, metric: PerformanceMetric) -> None:
        """Update aggregated statistics."""
        self.stats["total_operations"] += 1

        if metric.metric_type == PerformanceMetricType.ENCRYPTION_TIME:
            self.stats["encryption_operations"] += 1
            # Update rolling average
            current_avg = self.stats["average_encryption_time"]
            count = self.stats["encryption_operations"]
            self.stats["average_encryption_time"] = (
                (current_avg * (count - 1) + metric.value) / count
            )

        elif metric.metric_type == PerformanceMetricType.DECRYPTION_TIME:
            self.stats["decryption_operations"] += 1
            current_avg = self.stats["average_decryption_time"]
            count = self.stats["decryption_operations"]
            self.stats["average_decryption_time"] = (
                (current_avg * (count - 1) + metric.value) / count
            )

        elif metric.metric_type == PerformanceMetricType.MEMORY_USAGE:
            self.stats["peak_memory_usage"] = max(
                self.stats["peak_memory_usage"], metric.value
            )

        elif metric.metric_type == PerformanceMetricType.CPU_USAGE:
            self.stats["peak_cpu_usage"] = max(
                self.stats["peak_cpu_usage"], metric.value
            )

    def _check_alerts(self, metric: PerformanceMetric) -> None:
        """Check if metric triggers any alerts."""
        for alert in self.alerts:
            if alert.metric_type != metric.metric_type:
                continue

            # Check threshold
            triggered = False
            if alert.comparison == 'gt' and metric.value > alert.threshold:
                triggered = True
            elif alert.comparison == 'lt' and metric.value < alert.threshold:
                triggered = True
            elif alert.comparison == 'eq' and metric.value == alert.threshold:
                triggered = True

            if triggered and alert.alert_callback:
                try:
                    alert.alert_callback(alert, metric)
                except Exception as e:
                    logger.error(f"Alert callback failed: {str(e)}")

    @contextmanager
    def time_operation(
        self,
        operation_type: PerformanceMetricType,
        operation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        field_name: Optional[str] = None,
        data_size: Optional[int] = None
    ):
        """Context manager for timing operations."""
        start_time = time.time()
        op_id = operation_id or f"op_{int(time.time() * 1000)}"

        # Track active operation
        with self._lock:
            self.active_operations[op_id] = {
                "type": operation_type,
                "start_time": start_time,
                "user_id": user_id,
                "organization_id": organization_id,
                "field_name": field_name,
                "data_size": data_size
            }

        try:
            yield op_id
        finally:
            end_time = time.time()
            duration = end_time - start_time

            # Remove from active operations
            with self._lock:
                self.active_operations.pop(op_id, None)

            # Record metric
            metric = PerformanceMetric(
                metric_type=operation_type,
                value=duration,
                timestamp=datetime.utcnow(),
                operation_id=op_id,
                user_id=user_id,
                organization_id=organization_id,
                field_name=field_name,
                data_size=data_size
            )

            self.record_metric(metric)

    def time_encryption(
        self,
        field_name: str,
        data_size: Optional[int] = None,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ):
        """Context manager for timing encryption operations."""
        return self.time_operation(
            PerformanceMetricType.ENCRYPTION_TIME,
            field_name=field_name,
            data_size=data_size,
            user_id=user_id,
            organization_id=organization_id
        )

    def time_decryption(
        self,
        field_name: str,
        data_size: Optional[int] = None,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ):
        """Context manager for timing decryption operations."""
        return self.time_operation(
            PerformanceMetricType.DECRYPTION_TIME,
            field_name=field_name,
            data_size=data_size,
            user_id=user_id,
            organization_id=organization_id
        )

    def record_cache_metrics(self, cache_metrics: Dict[str, Any]) -> None:
        """Record cache performance metrics."""
        timestamp = datetime.utcnow()

        # Record hit ratio
        hit_ratio = cache_metrics.get("hit_ratio", 0.0)
        if hit_ratio is not None:
            metric = PerformanceMetric(
                metric_type=PerformanceMetricType.CACHE_HIT_RATIO,
                value=hit_ratio,
                timestamp=timestamp,
                additional_data=cache_metrics
            )
            self.record_metric(metric)

    def record_system_metrics(self) -> None:
        """Record current system metrics."""
        timestamp = datetime.utcnow()

        try:
            # Memory usage
            memory = psutil.virtual_memory()
            memory_metric = PerformanceMetric(
                metric_type=PerformanceMetricType.MEMORY_USAGE,
                value=memory.percent,
                timestamp=timestamp,
                additional_data={
                    "total": memory.total,
                    "available": memory.available,
                    "used": memory.used
                }
            )
            self.record_metric(memory_metric)

            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_metric = PerformanceMetric(
                metric_type=PerformanceMetricType.CPU_USAGE,
                value=cpu_percent,
                timestamp=timestamp,
                additional_data={
                    "cpu_count": psutil.cpu_count(),
                    "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
                }
            )
            self.record_metric(cpu_metric)

        except Exception as e:
            logger.error(f"Failed to record system metrics: {str(e)}")

    def get_metrics_summary(
        self,
        metric_type: Optional[PerformanceMetricType] = None,
        time_window_minutes: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get summary of performance metrics."""
        with self._lock:
            summary = {
                "timestamp": datetime.utcnow().isoformat(),
                "statistics": self.stats.copy(),
                "active_operations": len(self.active_operations),
                "metrics_by_type": {}
            }

            # Filter by time window if specified
            cutoff_time = None
            if time_window_minutes:
                cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)

            # Process metrics by type
            for m_type, metrics_deque in self.metrics.items():
                if metric_type and m_type != metric_type:
                    continue

                # Filter by time window
                filtered_metrics = list(metrics_deque)
                if cutoff_time:
                    filtered_metrics = [
                        m for m in filtered_metrics
                        if m.timestamp >= cutoff_time
                    ]

                if filtered_metrics:
                    values = [m.value for m in filtered_metrics]
                    summary["metrics_by_type"][m_type.value] = {
                        "count": len(values),
                        "min": min(values),
                        "max": max(values),
                        "avg": sum(values) / len(values),
                        "latest": values[-1] if values else None,
                        "latest_timestamp": filtered_metrics[-1].timestamp.isoformat() if filtered_metrics else None
                    }

            return summary

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        summary = self.get_metrics_summary()

        # Add cache metrics if available
        try:
            from app.services.encryption_cache import get_encryption_cache
            cache = get_encryption_cache()
            cache_metrics = cache.get_cache_metrics()
            summary["cache_performance"] = cache_metrics
        except Exception as e:
            logger.warning(f"Could not get cache metrics: {str(e)}")
            summary["cache_performance"] = {"error": str(e)}

        # Add recommendations
        recommendations = self._generate_recommendations(summary)
        summary["recommendations"] = recommendations

        return summary

    def _generate_recommendations(self, summary: Dict[str, Any]) -> List[str]:
        """Generate performance recommendations based on metrics."""
        recommendations = []

        # Check encryption performance
        encryption_stats = summary["metrics_by_type"].get("encryption_time", {})
        if encryption_stats.get("avg", 0) > 2.0:
            recommendations.append(
                "Consider optimizing encryption operations - average time exceeds 2 seconds"
            )

        # Check cache performance
        cache_stats = summary["metrics_by_type"].get("cache_hit_ratio", {})
        if cache_stats.get("latest", 1.0) < 0.6:
            recommendations.append(
                "Cache hit ratio is below 60% - consider adjusting TTL policies or cache size"
            )

        # Check memory usage
        memory_stats = summary["metrics_by_type"].get("memory_usage", {})
        if memory_stats.get("latest", 0) > 80:
            recommendations.append(
                "Memory usage is high - consider implementing memory optimization strategies"
            )

        # Check CPU usage
        cpu_stats = summary["metrics_by_type"].get("cpu_usage", {})
        if cpu_stats.get("avg", 0) > 70:
            recommendations.append(
                "CPU usage is consistently high - consider scaling or optimization"
            )

        return recommendations

    def start_background_monitoring(self, interval_seconds: int = 60) -> None:
        """Start background system monitoring."""
        if self._monitoring_active:
            return

        self._monitoring_active = True

        def monitor_loop():
            while self._monitoring_active:
                try:
                    self.record_system_metrics()

                    # Record cache metrics if available
                    try:
                        from app.services.encryption_cache import get_encryption_cache
                        cache = get_encryption_cache()
                        cache_metrics = cache.get_cache_metrics()
                        self.record_cache_metrics(cache_metrics)
                    except Exception:
                        pass  # Cache might not be available

                    time.sleep(interval_seconds)
                except Exception as e:
                    logger.error(f"Background monitoring error: {str(e)}")
                    time.sleep(interval_seconds)

        self._monitoring_thread = threading.Thread(target=monitor_loop, daemon=True)
        self._monitoring_thread.start()

        logger.info(f"Background performance monitoring started (interval: {interval_seconds}s)")

    def stop_background_monitoring(self) -> None:
        """Stop background system monitoring."""
        self._monitoring_active = False
        if self._monitoring_thread:
            self._monitoring_thread.join(timeout=5)
        logger.info("Background performance monitoring stopped")

    def clear_metrics(self, metric_type: Optional[PerformanceMetricType] = None) -> None:
        """Clear stored metrics."""
        with self._lock:
            if metric_type:
                self.metrics[metric_type].clear()
            else:
                self.metrics.clear()
                self.stats = {
                    "total_operations": 0,
                    "encryption_operations": 0,
                    "decryption_operations": 0,
                    "cache_operations": 0,
                    "average_encryption_time": 0.0,
                    "average_decryption_time": 0.0,
                    "peak_memory_usage": 0,
                    "peak_cpu_usage": 0.0,
                }

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on performance monitoring."""
        try:
            return {
                "status": "healthy",
                "monitoring_active": self._monitoring_active,
                "active_operations": len(self.active_operations),
                "total_metrics": sum(len(deque) for deque in self.metrics.values()),
                "alerts_configured": len(self.alerts),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }


# Global performance monitor instance
_performance_monitor: Optional[PerformanceMonitor] = None


def get_performance_monitor() -> PerformanceMonitor:
    """Get the global performance monitor instance."""
    global _performance_monitor

    if _performance_monitor is None:
        _performance_monitor = PerformanceMonitor()

    return _performance_monitor


# Convenience functions for common operations

def time_encryption_operation(
    field_name: str,
    data_size: Optional[int] = None,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None
):
    """Convenience function for timing encryption operations."""
    monitor = get_performance_monitor()
    return monitor.time_encryption(field_name, data_size, user_id, organization_id)


def time_decryption_operation(
    field_name: str,
    data_size: Optional[int] = None,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None
):
    """Convenience function for timing decryption operations."""
    monitor = get_performance_monitor()
    return monitor.time_decryption(field_name, data_size, user_id, organization_id)


def record_api_response_time(duration: float, endpoint: str) -> None:
    """Record API response time metric."""
    monitor = get_performance_monitor()
    metric = PerformanceMetric(
        metric_type=PerformanceMetricType.API_RESPONSE_TIME,
        value=duration,
        timestamp=datetime.utcnow(),
        additional_data={"endpoint": endpoint}
    )
    monitor.record_metric(metric)