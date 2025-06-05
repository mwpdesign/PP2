# Key Management and Recovery Procedures

## Overview

The Healthcare IVR Platform uses a local key management system for secure PHI encryption. This document outlines key management procedures, rotation strategies, backup/recovery processes, and security best practices.

## Key Management Architecture

### Components

1. **LocalKeyManager**: Core key management service
2. **Environment-based Storage**: Keys stored in environment variables
3. **Encrypted Backups**: Secure filesystem backups
4. **Key Derivation**: Purpose-specific key generation
5. **Zero-downtime Rotation**: Dual-key support during transitions

### Key Types

- **Primary Key**: Current encryption key for new data
- **Previous Key**: Previous encryption key for rotation support
- **Derived Keys**: Purpose-specific keys (PHI, PII, audit, backup)

## Environment Configuration

### Required Environment Variables

```bash
# Primary encryption key (base64 encoded Fernet key)
ENCRYPTION_KEY=<base64-encoded-key>

# Previous encryption key for rotation support
ENCRYPTION_KEY_PREVIOUS=<base64-encoded-key>

# Current key version
ENCRYPTION_KEY_VERSION=1

# Key backup directory
KEY_BACKUP_DIR=./key_backups
```

### Key Generation

Generate a new encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Key Management Operations

### 1. Initial Setup

```python
from app.core.key_manager import get_key_manager

# Initialize key manager
key_manager = get_key_manager()

# Check key status
info = key_manager.get_key_info()
print(f"Key version: {info['version']}")
print(f"Has current key: {info['has_current_key']}")
```

### 2. Key Rotation

**Zero-downtime key rotation process:**

```python
# Perform key rotation
new_key, old_key = key_manager.rotate_key()

# Update environment variables
# ENCRYPTION_KEY=<new_key_base64>
# ENCRYPTION_KEY_PREVIOUS=<old_key_base64>
# ENCRYPTION_KEY_VERSION=<incremented_version>
```

**Rotation Steps:**
1. Generate new encryption key
2. Validate new key
3. Move current key to previous key slot
4. Set new key as current
5. Increment version number
6. Create automatic backup
7. Update environment variables

### 3. Key Backup

**Create manual backup:**

```python
# Create timestamped backup
backup_path = key_manager.backup_keys()
print(f"Backup created: {backup_path}")

# Create named backup
backup_path = key_manager.backup_keys("pre_rotation_backup")
```

**List available backups:**

```python
backups = key_manager.list_backups()
for backup in backups:
    print(f"Name: {backup['name']}")
    print(f"Created: {backup['created']}")
    print(f"Size: {backup['size']} bytes")
```

### 4. Key Recovery

**Restore from backup:**

```python
# Restore keys from backup file
key_manager.restore_keys("./key_backups/key_backup_20241201_120000.json")

# Verify restoration
info = key_manager.get_key_info()
print(f"Restored to version: {info['version']}")
```

## Security Procedures

### Key Derivation

Different data types use derived keys for additional security:

```python
# Derive keys for specific purposes
phi_key = key_manager.derive_key("phi")      # Patient health information
pii_key = key_manager.derive_key("pii")      # Personally identifiable information
audit_key = key_manager.derive_key("audit")  # Audit logs
backup_key = key_manager.derive_key("backup") # Backup encryption
```

### Key Validation

```python
# Validate key integrity
current_key = key_manager.get_current_key()
is_valid = key_manager.validate_key(current_key)
print(f"Key is valid: {is_valid}")
```

## Backup Management

### Backup Security

- Backups are encrypted using a derived key
- Backup files have restricted permissions (600)
- Backup directory has restricted access (700)

### Backup Cleanup

```python
# Clean up old backups (keep 10 most recent)
deleted_count = key_manager.cleanup_old_backups(keep_count=10)
print(f"Deleted {deleted_count} old backups")
```

## Emergency Procedures

### Key Compromise Response

1. **Immediate Actions:**
   ```bash
   # Generate new key immediately
   python -c "from app.core.key_manager import get_key_manager; km = get_key_manager(); km.rotate_key()"
   ```

2. **Update Environment:**
   - Update `ENCRYPTION_KEY` with new key
   - Keep compromised key in `ENCRYPTION_KEY_PREVIOUS` temporarily
   - Increment `ENCRYPTION_KEY_VERSION`

3. **Re-encrypt Data:**
   - Schedule re-encryption of all PHI data
   - Monitor for unauthorized access
   - Update audit logs

### Key Loss Recovery

1. **Check Backups:**
   ```python
   backups = key_manager.list_backups()
   # Select most recent backup before loss
   ```

2. **Restore Keys:**
   ```python
   key_manager.restore_keys(backup_path)
   ```

3. **Verify Restoration:**
   ```python
   # Test decryption of sample data
   # Verify key version matches expected
   ```

## Monitoring and Auditing

### Key Usage Monitoring

- All key operations are logged
- Key rotation events are audited
- Backup creation/restoration is tracked
- Failed key operations trigger alerts

### Audit Log Format

```json
{
  "timestamp": "2024-12-01T12:00:00Z",
  "event": "key_rotation",
  "key_version": 2,
  "previous_version": 1,
  "success": true,
  "backup_created": true
}
```

## Best Practices

### Development Environment

1. **Auto-generation**: Keys auto-generated if not provided
2. **Logging**: Encryption operations can be logged for debugging
3. **Testing**: Use separate keys for testing

### Production Environment

1. **Manual Key Management**: Never auto-generate in production
2. **Regular Rotation**: Rotate keys every 90 days
3. **Secure Storage**: Store keys in secure environment variables
4. **Backup Strategy**: Maintain multiple backup copies
5. **Access Control**: Restrict key access to authorized personnel

### Security Checklist

- [ ] Keys are stored in environment variables, not code
- [ ] Backup directory has restricted permissions
- [ ] Key rotation is performed regularly
- [ ] Backups are encrypted and tested
- [ ] Key derivation is used for different data types
- [ ] Audit logging is enabled
- [ ] Emergency procedures are documented
- [ ] Key compromise response plan is ready

## Troubleshooting

### Common Issues

1. **Key Not Found Error:**
   ```
   KeyValidationError: No current encryption key available
   ```
   **Solution:** Set `ENCRYPTION_KEY` environment variable

2. **Invalid Key Format:**
   ```
   KeyValidationError: Failed to load keys
   ```
   **Solution:** Verify key is valid base64-encoded Fernet key

3. **Backup Restore Failure:**
   ```
   KeyBackupError: Failed to restore keys
   ```
   **Solution:** Check backup file exists and is not corrupted

### Diagnostic Commands

```python
# Check key manager status
from app.core.key_manager import get_key_manager
km = get_key_manager()
print(km.get_key_info())

# Test key operations
try:
    test_key = km.generate_key()
    is_valid = km.validate_key(test_key)
    print(f"Key generation and validation: {'OK' if is_valid else 'FAILED'}")
except Exception as e:
    print(f"Key operations failed: {e}")
```

## Integration with Encryption Service

The key manager integrates with the existing encryption service:

```python
from app.core.key_manager import get_key_manager
from app.services.encryption_service import EncryptionService

# Get current key for encryption service
key_manager = get_key_manager()
current_key = key_manager.get_current_key()

# Initialize encryption service with current key
encryption_service = EncryptionService(encryption_key=current_key)
```

## Compliance Notes

- **HIPAA Compliance**: Key management follows HIPAA encryption requirements
- **Data Retention**: Keys are retained according to data retention policies
- **Audit Requirements**: All key operations are logged for compliance audits
- **Access Controls**: Key access is restricted and monitored

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** March 2025