variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
}

variable "region" {
  description = "AWS region for primary backup vault"
  type        = string
}

variable "secondary_region" {
  description = "AWS region for secondary backup vault (cross-region backup)"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of KMS key for primary backup encryption"
  type        = string
}

variable "secondary_kms_key_arn" {
  description = "ARN of KMS key for secondary backup encryption"
  type        = string
}

variable "backup_role_arn" {
  description = "ARN of IAM role for AWS Backup"
  type        = string
}

variable "rds_instance_id" {
  description = "ID of the RDS instance to backup"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket to backup"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table to backup"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "cold_storage_days" {
  description = "Number of days before moving backups to cold storage"
  type        = number
  default     = 15
}

variable "cross_region_backup_retention_days" {
  description = "Number of days to retain cross-region backups"
  type        = number
  default     = 90
}

variable "critical_backup_retention_days" {
  description = "Number of days to retain critical resource backups"
  type        = number
  default     = 7
} 