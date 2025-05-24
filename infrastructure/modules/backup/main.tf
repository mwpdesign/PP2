resource "aws_backup_vault" "primary" {
  name        = "${var.environment}-primary-backup-vault"
  kms_key_arn = var.kms_key_arn
  
  tags = {
    Environment = var.environment
    Service     = "backup"
  }
}

resource "aws_backup_plan" "comprehensive" {
  name = "${var.environment}-comprehensive-backup-plan"
  
  rule {
    rule_name         = "daily_full_backup"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 3 ? * * *)"  # Daily at 3 AM UTC
    
    start_window = 60
    completion_window = 120
    
    lifecycle {
      delete_after = 30  # Retain backups for 30 days
      cold_storage_after = 15  # Move to cold storage after 15 days
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary.arn
      
      lifecycle {
        delete_after = 90  # Keep cross-region copies for 90 days
      }
    }
  }

  rule {
    rule_name         = "critical_resources_frequent"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 */6 ? * * *)"  # Every 6 hours
    
    lifecycle {
      delete_after = 7  # Retain for 7 days
    }
  }

  tags = {
    Environment = var.environment
    Service     = "backup"
  }
}

# Secondary backup vault in different region for disaster recovery
resource "aws_backup_vault" "secondary" {
  provider    = aws.secondary
  name        = "${var.environment}-secondary-backup-vault"
  kms_key_arn = var.secondary_kms_key_arn
  
  tags = {
    Environment = var.environment
    Service     = "backup"
  }
}

# Backup selection for critical resources
resource "aws_backup_selection" "critical_resources" {
  iam_role_arn = var.backup_role_arn
  name         = "${var.environment}-critical-resources"
  plan_id      = aws_backup_plan.comprehensive.id

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "critical"
  }

  resources = [
    "arn:aws:rds:${var.region}:${var.account_id}:db:${var.rds_instance_id}",
    "arn:aws:s3:::${var.s3_bucket_name}",
    "arn:aws:dynamodb:${var.region}:${var.account_id}:table/${var.dynamodb_table_name}"
  ]
}

# IAM role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "${var.environment}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
}

# Attach necessary policies to the backup role
resource "aws_iam_role_policy_attachment" "backup_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup.name
}

resource "aws_iam_role_policy_attachment" "restore_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  role       = aws_iam_role.backup.name
} 