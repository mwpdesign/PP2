output "primary_backup_vault_arn" {
  description = "ARN of the primary backup vault"
  value       = aws_backup_vault.primary.arn
}

output "secondary_backup_vault_arn" {
  description = "ARN of the secondary backup vault"
  value       = aws_backup_vault.secondary.arn
}

output "backup_plan_arn" {
  description = "ARN of the backup plan"
  value       = aws_backup_plan.comprehensive.arn
}

output "backup_plan_version" {
  description = "Version of the backup plan"
  value       = aws_backup_plan.comprehensive.version
}

output "backup_selection_id" {
  description = "ID of the backup selection"
  value       = aws_backup_selection.critical_resources.id
}

output "backup_role_arn" {
  description = "ARN of the IAM role used for backups"
  value       = aws_iam_role.backup.arn
}

output "backup_role_name" {
  description = "Name of the IAM role used for backups"
  value       = aws_iam_role.backup.name
}

output "backup_configuration" {
  description = "Map of backup configuration details"
  value = {
    environment                       = var.environment
    primary_region                    = var.region
    secondary_region                  = var.secondary_region
    backup_retention_days             = var.backup_retention_days
    cold_storage_days                = var.cold_storage_days
    cross_region_backup_retention_days = var.cross_region_backup_retention_days
    critical_backup_retention_days    = var.critical_backup_retention_days
  }
} 