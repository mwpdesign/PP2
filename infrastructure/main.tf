terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  # Use S3 for state storage and DynamoDB for state locking
  backend "s3" {
    bucket         = "healthcare-ivr-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "healthcare-ivr-terraform-locks"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "healthcare-ivr"
      ManagedBy   = "terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., development, staging, production)"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "healthcare-ivr"
}

# Common tags
locals {
  common_tags = {
    Environment = var.environment
    Project     = "Healthcare IVR Platform"
    ManagedBy   = "Terraform"
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# Output values
output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "available_azs" {
  description = "Available AWS Availability Zones"
  value       = data.aws_availability_zones.available.names
}

# Remote state data sources
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "healthcare-ivr-terraform-state"
    key    = "vpc/terraform.tfstate"
    region = var.aws_region
  }
}

# Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  
  backend_container_image  = var.backend_container_image
  frontend_container_image = var.frontend_container_image
  
  backend_cpu     = var.backend_cpu
  backend_memory  = var.backend_memory
  frontend_cpu    = var.frontend_cpu
  frontend_memory = var.frontend_memory
  
  backend_desired_count  = var.backend_desired_count
  frontend_desired_count = var.frontend_desired_count
  
  alb_security_group_id = module.alb.alb_security_group_id
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment    = var.environment
  vpc_id        = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnet_ids
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  
  backup_retention_period = 30
  multi_az               = true
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  
  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_nodes
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  
  phi_bucket_name = var.phi_bucket_name
  logs_bucket_name = var.logs_bucket_name
}

# KMS Keys
module "kms" {
  source = "./modules/kms"
  
  environment = var.environment
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  
  ecs_cluster_name     = module.ecs.cluster_name
  rds_instance_id      = module.rds.instance_id
  elasticache_cluster_id = module.redis.cluster_id
}

# WAF & Shield
module "security" {
  source = "./modules/security"
  
  environment = var.environment
  alb_arn    = module.alb.alb_arn
}

# Route53 & ACM
module "dns" {
  source = "./modules/dns"
  
  environment = var.environment
  domain_name = var.domain_name
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
}

# Backup
module "backup" {
  source = "./modules/backup"
  
  environment = var.environment
  rds_arn    = module.rds.instance_arn
  s3_buckets = module.s3.bucket_arns
} 