#!/bin/bash

# Create S3 bucket
awslocal s3 mb s3://healthcare-ivr-local

# Create KMS key
awslocal kms create-key --description "PHI Encryption Key"

# Create Cognito user pool
awslocal cognito-idp create-user-pool --pool-name healthcare-ivr-pool

# Create DynamoDB tables
awslocal dynamodb create-table     --table-name audit-logs     --attribute-definitions AttributeName=id,AttributeType=S     --key-schema AttributeName=id,KeyType=HASH     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
