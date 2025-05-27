"""Script to set up KMS key in LocalStack."""
import boto3
import os

# Set up KMS client
kms = boto3.client(
    'kms',
    region_name='us-east-1',
    aws_access_key_id='dummy_access_key',
    aws_secret_access_key='dummy_secret_key',
    endpoint_url='http://localhost:4566'
)

# Create KMS key
response = kms.create_key(
    Description='Healthcare IVR Platform PHI Encryption Key',
    KeyUsage='ENCRYPT_DECRYPT',
    Origin='AWS_KMS'
)

key_id = response['KeyMetadata']['KeyId']
print(f"Created KMS key with ID: {key_id}")

# Create key alias
alias_name = 'healthcare-ivr-phi'
kms.create_alias(
    AliasName=f'alias/{alias_name}',
    TargetKeyId=key_id
)
print(f"Created alias: {alias_name}")

# Update .env file with key ID
env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
with open(env_file, 'a') as f:
    f.write(f"\nAWS_KMS_KEY_ID={key_id}\n")