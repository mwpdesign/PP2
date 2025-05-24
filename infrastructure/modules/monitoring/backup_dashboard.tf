# CloudWatch Dashboard for Backup Monitoring
resource "aws_cloudwatch_dashboard" "backup_monitoring" {
  dashboard_name = "${var.environment}-backup-monitoring"
  dashboard_body = jsonencode({
    widgets = [
      # Backup Job Status
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Backup", "NumberOfBackupJobs", "State", "COMPLETED"],
            ["AWS/Backup", "NumberOfBackupJobs", "State", "FAILED"],
            ["AWS/Backup", "NumberOfBackupJobs", "State", "RUNNING"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Backup Job Status"
          period  = 3600
        }
      },
      # Backup Size Trend
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Backup", "BackupVaultSize", "BackupVaultName", var.backup_vault_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Backup Vault Size"
          period  = 3600
        }
      },
      # Validation Results
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["BackupValidation", "BackupValidation_metadata_validation", "Environment", var.environment],
            ["BackupValidation", "BackupValidation_size_validation", "Environment", var.environment],
            ["BackupValidation", "BackupValidation_encryption_validation", "Environment", var.environment],
            ["BackupValidation", "BackupValidation_retention_validation", "Environment", var.environment],
            ["BackupValidation", "BackupValidation_restore_test", "Environment", var.environment]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Backup Validation Results"
          period  = 3600
        }
      },
      # Restore Jobs
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Backup", "NumberOfRestoreJobs", "State", "COMPLETED"],
            ["AWS/Backup", "NumberOfRestoreJobs", "State", "FAILED"],
            ["AWS/Backup", "NumberOfRestoreJobs", "State", "RUNNING"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Restore Job Status"
          period  = 3600
        }
      }
    ]
  })
}

# CloudWatch Alarms for Backup Monitoring
resource "aws_cloudwatch_metric_alarm" "backup_job_failures" {
  alarm_name          = "${var.environment}-backup-job-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfBackupJobs"
  namespace           = "AWS/Backup"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert on backup job failures"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    State = "FAILED"
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_failures" {
  alarm_name          = "${var.environment}-backup-validation-failures"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupValidation_restore_test"
  namespace           = "BackupValidation"
  period              = "3600"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Alert on backup validation failures"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "backup_vault_size" {
  alarm_name          = "${var.environment}-backup-vault-size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupVaultSize"
  namespace           = "AWS/Backup"
  period              = "3600"
  statistic           = "Maximum"
  threshold           = var.backup_vault_size_threshold
  alarm_description   = "Alert when backup vault size exceeds threshold"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    BackupVaultName = var.backup_vault_name
  }
}

# Log Metric Filters for Backup Events
resource "aws_cloudwatch_log_metric_filter" "backup_errors" {
  name           = "${var.environment}-backup-errors"
  pattern        = "[timestamp, requestid, level = ERROR, ...]"
  log_group_name = var.backup_log_group

  metric_transformation {
    name      = "BackupErrors"
    namespace = "${var.environment}/BackupMetrics"
    value     = "1"
  }
}

# Variables
variable "backup_vault_name" {
  description = "Name of the backup vault"
  type        = string
}

variable "backup_vault_size_threshold" {
  description = "Threshold for backup vault size in bytes"
  type        = number
  default     = 1099511627776  # 1TB
}

variable "backup_log_group" {
  description = "Name of the backup log group"
  type        = string
} 