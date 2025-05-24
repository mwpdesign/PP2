# Healthcare IVR Platform - Daily Operations Guide

## Morning Checklist (Before 9 AM EST)

### System Health Check
- [ ] Verify all ECS services are running at desired capacity
  ```bash
  aws ecs list-services --cluster healthcare-ivr-cluster
  aws ecs describe-services --cluster healthcare-ivr-cluster --services [SERVICE_NAME]
  ```

- [ ] Check CloudWatch dashboards for overnight anomalies
  * Navigate to AWS Console > CloudWatch > Dashboards > comprehensive-dashboard
  * Review:
    - CPU/Memory utilization spikes
    - Error rate trends
    - Database connection counts
    - API response times

- [ ] Verify overnight backup completion
  ```bash
  aws backup list-backup-jobs --by-created-before $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
    --by-created-after $(date -u -d "yesterday" +"%Y-%m-%dT%H:%M:%SZ")
  ```

- [ ] Review CloudTrail logs for suspicious activity
  * Check `/aws/cloudtrail/healthcare-ivr-audit-trail` log group
  * Focus on:
    - Unauthorized access attempts
    - Configuration changes
    - Resource deletions

### Database Health
- [ ] Check RDS metrics
  * Connection count
  * CPU utilization
  * Available storage
  * Replication lag (if applicable)

- [ ] Verify ElastiCache cluster status
  ```bash
  aws elasticache describe-cache-clusters
  ```

### Security and Compliance
- [ ] Review security alerts from the last 24 hours
  * Check SecurityHub findings
  * Review GuardDuty alerts
  * Verify WAF blocks and allowed requests

- [ ] Validate HIPAA compliance status
  * Check encryption status for data at rest
  * Verify audit logging is active
  * Review access patterns for PHI data

## Midday Operations (1 PM EST)

### Performance Monitoring
- [ ] Review real-time metrics
  * API response times
  * Error rates
  * User session counts
  * IVR call volumes

- [ ] Check resource utilization
  * ECS cluster capacity
  * RDS connection pools
  * ElastiCache memory usage
  * S3 bucket metrics

### Backup Verification
- [ ] Validate latest backup integrity
  ```bash
  # Run backup validation script
  python scripts/validate_backup.py --latest
  ```

- [ ] Check backup storage metrics
  * S3 bucket usage
  * Backup retention compliance
  * Failed backup notifications

## End of Day Procedures (5 PM EST)

### System Maintenance
- [ ] Review scheduled maintenance windows
  * RDS maintenance status
  * ECS task updates
  * ElastiCache patches

- [ ] Verify auto-scaling configurations
  * ECS service scaling rules
  * RDS read replica scaling
  * ElastiCache node counts

### Compliance and Reporting
- [ ] Generate daily compliance reports
  ```bash
  # Run compliance report generator
  python scripts/generate_compliance_report.py --type daily
  ```

- [ ] Review and archive audit logs
  * Export CloudTrail logs
  * Archive CloudWatch logs
  * Store compliance reports

### Documentation
- [ ] Update incident log (if any)
- [ ] Document system changes
- [ ] Record performance metrics

## Emergency Procedures

### Service Degradation
1. Check ECS service health
2. Review CloudWatch metrics
3. Verify database connections
4. Check ElastiCache status
5. Review recent deployments

### Security Incidents
1. Isolate affected systems
2. Enable enhanced monitoring
3. Review audit logs
4. Notify security team
5. Document incident timeline

### Backup Failures
1. Stop affected backup jobs
2. Verify data integrity
3. Check storage capacity
4. Review error logs
5. Initiate manual backup if needed

## Contact Information

### On-Call Support
- Primary: [PHONE_NUMBER]
- Secondary: [PHONE_NUMBER]
- Security Team: [PHONE_NUMBER]

### Escalation Path
1. On-call engineer
2. DevOps lead
3. Security team
4. CTO

## Compliance Requirements

### HIPAA Checklist
- [ ] PHI access logging active
- [ ] Encryption verified
- [ ] Access controls validated
- [ ] Audit trails maintained

### Security Standards
- [ ] WAF rules current
- [ ] Security patches applied
- [ ] Access reviews completed
- [ ] Threat detection active 