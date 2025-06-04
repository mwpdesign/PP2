"""Script to set up KMS key in LocalStack."""

import boto3
import os

# Set up KMS client for LocalStack
kms = boto3.client(
    "kms",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
    endpoint_url=os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"),
)

# Create KMS key
response = kms.create_key(
    Description="Healthcare IVR Platform PHI Encryption Key",
    KeyUsage="ENCRYPT_DECRYPT",
    Origin="AWS_KMS",
)

key_id = response["KeyMetadata"]["KeyId"]
print(f"Created KMS key with ID: {key_id}")

# Create key alias
alias_name = "healthcare-ivr-phi"
kms.create_alias(AliasName=f"alias/{alias_name}", TargetKeyId=key_id)
print(f"Created alias: {alias_name}")

# Update .env file with key ID
env_file = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"
)
with open(env_file, "a") as f:
    f.write(f"\nAWS_KMS_KEY_ID={key_id}\n")
