"""
Unit tests for security monitoring service.
"""
import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.services.security_monitoring import SecurityMonitoringService
from app.models.security import (
    SecurityEvent,
    SecurityAlert,
    SecurityIncident,
    ThreatDetectionRule
)


async def test_handle_failed_authentication(
    db,
    test_user,
    mock_notification_service
):
    """Test handling failed authentication attempts."""
    service = SecurityMonitoringService(db)

    # Test single failed attempt
    await service.handle_failed_authentication(
        user_id=test_user.id,
        ip_address="192.168.1.1",
        user_agent="test-browser"
    )

    events = db.query(SecurityEvent).all()
    assert len(events) == 1
    assert events[0].event_type == "failed_authentication"
    assert events[0].user_id == test_user.id
    assert events[0].severity == "medium"

    # Test account lockout after multiple failures
    for _ in range(4):  # Total will be 5 with previous attempt
        await service.handle_failed_authentication(
            user_id=test_user.id,
            ip_address="192.168.1.1",
            user_agent="test-browser"
        )

    # Verify account locked
    test_user = db.query(test_user.__class__).get(test_user.id)
    assert not test_user.is_active
    assert test_user.locked_reason == "excessive_failed_logins"


async def test_detect_suspicious_patterns(
    db,
    test_user,
    mock_notification_service,
    mock_aws
):
    """Test detection of suspicious access patterns."""
    service = SecurityMonitoringService(db)

    # Create test events for rate limiting
    for _ in range(101):  # Exceed phi_access_rate threshold
        await service.detect_suspicious_patterns(
            user_id=test_user.id,
            territory_id=test_user.primary_territory_id,
            action="view",
            resource_type="patient"
        )

    # Verify excessive access alert created
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.alert_type == "excessive_access"
    ).all()
    assert len(alerts) > 0
    assert alerts[0].severity == "high"

    # Verify SNS notification sent for high severity
    mock_aws["sns"].publish.assert_called()


async def test_security_metrics(
    db,
    test_user,
    test_security_rule
):
    """Test security metrics collection."""
    service = SecurityMonitoringService(db)

    # Create test security events
    events = [
        SecurityEvent(
            event_type="failed_authentication",
            severity="medium",
            user_id=test_user.id,
            territory_id=test_user.primary_territory_id
        ),
        SecurityEvent(
            event_type="unauthorized_access",
            severity="high",
            user_id=test_user.id,
            territory_id=test_user.primary_territory_id
        )
    ]
    db.add_all(events)
    db.commit()

    # Get metrics
    start_date = datetime.utcnow() - timedelta(days=1)
    end_date = datetime.utcnow()
    metrics = await service.get_security_metrics(
        start_date=start_date,
        end_date=end_date,
        territory_id=test_user.primary_territory_id
    )

    assert metrics["total_events"] == 2
    assert metrics["by_severity"]["medium"] == 1
    assert metrics["by_severity"]["high"] == 1
    assert metrics["by_type"]["failed_authentication"] == 1
    assert metrics["by_type"]["unauthorized_access"] == 1


async def test_evaluate_security_rule(
    db,
    test_user,
    test_security_rule,
    mock_notification_service
):
    """Test security rule evaluation."""
    service = SecurityMonitoringService(db)

    # Create events matching rule criteria
    events = []
    for _ in range(test_security_rule.threshold):
        event = SecurityEvent(
            event_type="failed_authentication",
            severity="high",
            user_id=test_user.id,
            territory_id=test_user.primary_territory_id,
            created_at=datetime.utcnow()
        )
        events.append(event)

    db.add_all(events)
    db.commit()

    # Evaluate rule
    await service._evaluate_rule(test_security_rule)

    # Verify alert created
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.alert_type == test_security_rule.alert_type
    ).all()
    assert len(alerts) == 1
    assert alerts[0].severity == test_security_rule.severity


async def test_create_security_alert(
    db,
    test_user,
    mock_notification_service,
    mock_aws
):
    """Test security alert creation."""
    service = SecurityMonitoringService(db)

    # Create high severity alert
    await service._create_security_alert(
        alert_type="test_alert",
        severity="high",
        user_id=test_user.id,
        territory_id=test_user.primary_territory_id,
        details={"test": "data"}
    )

    # Verify alert created
    alert = db.query(SecurityAlert).first()
    assert alert is not None
    assert alert.alert_type == "test_alert"
    assert alert.severity == "high"

    # Verify incident created for high severity
    incident = db.query(SecurityIncident).first()
    assert incident is not None
    assert incident.incident_type == "test_alert"
    assert incident.severity == "high"
    assert incident.status == "open"

    # Verify notifications sent
    mock_notification_service.send_notification.assert_called_once()
    mock_aws["sns"].publish.assert_called_once()


async def test_check_cloudtrail_events(
    db,
    mock_aws
):
    """Test CloudTrail event monitoring."""
    service = SecurityMonitoringService(db)

    # Mock CloudTrail events
    mock_aws["cloudtrail"].lookup_events.return_value = {
        "Events": [{
            "CloudTrailEvent": """
            {
                "eventType": "AwsApiCall",
                "eventName": "DeleteBucket",
                "awsRegion": "us-east-1",
                "sourceIPAddress": "192.168.1.1"
            }
            """
        }]
    }

    # Check events
    await service._check_cloudtrail_events()

    # Verify alert created for sensitive operation
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.alert_type == "sensitive_aws_operation"
    ).all()
    assert len(alerts) == 1
    assert alerts[0].severity == "high"