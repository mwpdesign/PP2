output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "log_group_backend" {
  description = "Name of the backend CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_backend.name
}

output "log_group_frontend" {
  description = "Name of the frontend CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_frontend.name
}

output "metric_alarms" {
  description = "List of CloudWatch metric alarms"
  value = {
    ecs_cpu_high         = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
    rds_connections_high = aws_cloudwatch_metric_alarm.rds_connections_high.arn
    api_error_rate       = aws_cloudwatch_metric_alarm.api_error_rate.arn
  }
}

output "log_metric_filters" {
  description = "List of CloudWatch log metric filters"
  value = {
    error_logs = aws_cloudwatch_log_metric_filter.error_logs.id
  }
} 