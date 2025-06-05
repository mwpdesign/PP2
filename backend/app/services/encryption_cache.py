"""
Redis-based Encryption Caching Service for Healthcare IVR Platform

Provides high-performance caching for encryption operations while maintaining
HIPAA compliance through user context awareness, proper TTL policies,
cache invalidation strategies, and comprehensive audit logging.
"""

import json
import logging
import hashlib
import time
from typing import Any, Dict, Optional, List, Set
from datetime import datetime, timedelta
from enum import Enum
import redis
from redis.exceptions import RedisError, ConnectionError

from app.core.config import get_settings
from app.services.audit_service import get_audit_service, AuditEventType, DataClassification
from app.schemas.token import TokenData

logger = logging.getLogger(__name__)


class CacheSensitivityLevel(Enum):
    """Data sensitivity levels for cache TTL policies."""

    HIGH_PHI = "high_phi"          # SSN, medical records - 5 minutes
    MEDIUM_PHI = "medium_phi"      # Names, addresses - 15 minutes
    LOW_PHI = "low_phi"           # Phone numbers, emails - 30 minutes
    NON_PHI = "non_phi"           # System data - 60 minutes
    AUDIT_DATA = "audit_data"     # Audit logs - 10 minutes


class EncryptionCacheError(Exception):
    """Custom exception for encryption cache operations."""
    pass


class EncryptionCache:
    """
    Redis-based caching service for encryption operations.

    Features:
    - User context-aware caching
    - HIPAA-compliant TTL policies
    - Automatic cache invalidation
    - Comprehensive audit logging
    - Memory usage monitoring
    - Batch operations support
    """

    def __init__(self):
        """Initialize the encryption cache service."""
        self.settings = get_settings()
        self.redis_client = None
        self.audit_service = get_audit_service()

        # Cache TTL policies based on data sensitivity (in seconds)
        self.ttl_policies = {
            CacheSensitivityLevel.HIGH_PHI: 300,      # 5 minutes
            CacheSensitivityLevel.MEDIUM_PHI: 900,    # 15 minutes
            CacheSensitivityLevel.LOW_PHI: 1800,      # 30 minutes
            CacheSensitivityLevel.NON_PHI: 3600,      # 60 minutes
            CacheSensitivityLevel.AUDIT_DATA: 600,    # 10 minutes
        }

        # Cache key prefixes for organization
        self.key_prefixes = {
            "encryption": "enc:",
            "decryption": "dec:",
            "user_context": "ctx:",
            "invalidation": "inv:",
            "metrics": "met:",
        }

        # Performance metrics
        self.metrics = {
            "cache_hits": 0,
            "cache_misses": 0,
            "cache_sets": 0,
            "cache_invalidations": 0,
            "total_operations": 0,
        }

        self._initialize_redis()

    def _initialize_redis(self) -> None:
        """Initialize Redis connection with proper configuration."""
        try:
            redis_url = getattr(self.settings, 'REDIS_URL', 'redis://localhost:6379/0')

            # Parse Redis URL and create connection
            self.redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
                max_connections=20,
            )

            # Test connection
            self.redis_client.ping()

            logger.info("Encryption cache service initialized successfully")

        except (RedisError, ConnectionError) as e:
            logger.warning(f"Redis connection failed, caching disabled: {str(e)}")
            self.redis_client = None
        except Exception as e:
            logger.error(f"Failed to initialize encryption cache: {str(e)}")
            self.redis_client = None

    def _generate_cache_key(
        self,
        operation: str,
        data_hash: str,
        user_context: Optional[Dict] = None,
        field_name: Optional[str] = None
    ) -> str:
        """
        Generate a unique cache key with user context.

        Args:
            operation: Type of operation (encrypt/decrypt)
            data_hash: Hash of the data being cached
            user_context: User context for access control
            field_name: Name of the field being cached

        Returns:
            Unique cache key string
        """
        prefix = self.key_prefixes.get(operation, "unk:")

        # Include user context in key for access control
        user_id = "anonymous"
        org_id = "default"

        if user_context:
            user_id = user_context.get("user_id", "anonymous")
            org_id = user_context.get("organization_id", "default")

        # Create composite key with user context
        key_components = [
            prefix,
            str(org_id),
            str(user_id),
            field_name or "unknown",
            data_hash[:16]  # First 16 chars of hash for uniqueness
        ]

        return ":".join(key_components)

    def _hash_data(self, data: Any) -> str:
        """
        Create a secure hash of data for cache key generation.

        Args:
            data: Data to hash

        Returns:
            SHA256 hash of the data
        """
        if isinstance(data, dict):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)

        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def _determine_sensitivity_level(
        self,
        field_name: Optional[str] = None,
        data_classification: Optional[str] = None
    ) -> CacheSensitivityLevel:
        """
        Determine the sensitivity level for TTL policy.

        Args:
            field_name: Name of the field
            data_classification: Data classification level

        Returns:
            Appropriate sensitivity level
        """
        if data_classification == "AUDIT":
            return CacheSensitivityLevel.AUDIT_DATA

        if not field_name:
            return CacheSensitivityLevel.MEDIUM_PHI

        # High sensitivity PHI fields
        high_phi_fields = {
            "ssn", "social_security_number", "medical_record_number",
            "diagnosis_codes", "treatment_notes", "prescription_data"
        }

        # Medium sensitivity PHI fields
        medium_phi_fields = {
            "first_name", "last_name", "full_name", "date_of_birth",
            "address", "insurance_id"
        }

        # Low sensitivity PHI fields
        low_phi_fields = {
            "phone_number", "email", "emergency_contact"
        }

        field_lower = field_name.lower()

        if any(field in field_lower for field in high_phi_fields):
            return CacheSensitivityLevel.HIGH_PHI
        elif any(field in field_lower for field in medium_phi_fields):
            return CacheSensitivityLevel.MEDIUM_PHI
        elif any(field in field_lower for field in low_phi_fields):
            return CacheSensitivityLevel.LOW_PHI
        else:
            return CacheSensitivityLevel.MEDIUM_PHI  # Default to medium for PHI

    def _log_cache_operation(
        self,
        operation: str,
        cache_key: str,
        hit: bool,
        user_context: Optional[Dict] = None,
        field_name: Optional[str] = None
    ) -> None:
        """Log cache operations for audit compliance."""
        try:
            # Update metrics
            self.metrics["total_operations"] += 1
            if hit:
                self.metrics["cache_hits"] += 1
            else:
                self.metrics["cache_misses"] += 1

            # Log to audit service
            details = {
                "operation": operation,
                "cache_key": cache_key[:50] + "..." if len(cache_key) > 50 else cache_key,
                "cache_hit": hit,
                "field_name": field_name or "unknown",
                "timestamp": datetime.utcnow().isoformat()
            }

            if user_context:
                details.update({
                    "user_id": user_context.get("user_id"),
                    "organization_id": user_context.get("organization_id")
                })

            # Use audit service for logging
            self.audit_service.log_event(
                event_type=AuditEventType.SUSPICIOUS_ACTIVITY,  # Cache access tracking
                details=f"Cache {operation}: {'HIT' if hit else 'MISS'}",
                resource_type="cache",
                resource_id=cache_key,
                field_name=field_name,
                data_classification=DataClassification.SENSITIVE,
                success=True,
                additional_data=details
            )

        except Exception as e:
            logger.warning(f"Failed to log cache operation: {str(e)}")

    def get_cached_decryption(
        self,
        encrypted_data: str,
        user_context: Optional[Dict] = None,
        field_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Retrieve cached decrypted data.

        Args:
            encrypted_data: The encrypted data to look up
            user_context: User context for access control
            field_name: Name of the field for audit logging

        Returns:
            Cached decrypted data or None if not found
        """
        if not self.redis_client:
            return None

        try:
            data_hash = self._hash_data(encrypted_data)
            cache_key = self._generate_cache_key(
                "decryption", data_hash, user_context, field_name
            )

            cached_data = self.redis_client.get(cache_key)

            # Log cache operation
            self._log_cache_operation(
                "get_decryption", cache_key, cached_data is not None,
                user_context, field_name
            )

            if cached_data:
                # Parse cached data
                cache_entry = json.loads(cached_data)
                return cache_entry.get("decrypted_data")

            return None

        except Exception as e:
            logger.error(f"Cache retrieval failed: {str(e)}")
            return None

    def cache_decryption(
        self,
        encrypted_data: str,
        decrypted_data: str,
        user_context: Optional[Dict] = None,
        field_name: Optional[str] = None,
        data_classification: Optional[str] = None
    ) -> bool:
        """
        Cache decrypted data with appropriate TTL.

        Args:
            encrypted_data: The original encrypted data
            decrypted_data: The decrypted data to cache
            user_context: User context for access control
            field_name: Name of the field for audit logging
            data_classification: Data classification for TTL policy

        Returns:
            True if caching succeeded, False otherwise
        """
        if not self.redis_client:
            return False

        try:
            data_hash = self._hash_data(encrypted_data)
            cache_key = self._generate_cache_key(
                "decryption", data_hash, user_context, field_name
            )

            # Determine TTL based on sensitivity
            sensitivity_level = self._determine_sensitivity_level(
                field_name, data_classification
            )
            ttl = self.ttl_policies[sensitivity_level]

            # Create cache entry
            cache_entry = {
                "decrypted_data": decrypted_data,
                "cached_at": datetime.utcnow().isoformat(),
                "field_name": field_name,
                "sensitivity_level": sensitivity_level.value,
                "user_context": user_context or {},
                "ttl": ttl
            }

            # Store in Redis with TTL
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(cache_entry)
            )

            # Update metrics
            self.metrics["cache_sets"] += 1

            # Log cache operation
            self._log_cache_operation(
                "set_decryption", cache_key, True, user_context, field_name
            )

            return True

        except Exception as e:
            logger.error(f"Cache storage failed: {str(e)}")
            return False

    def invalidate_cache(
        self,
        resource_id: str,
        resource_type: Optional[str] = None,
        user_context: Optional[Dict] = None
    ) -> int:
        """
        Invalidate cache entries for a specific resource.

        Args:
            resource_id: ID of the resource to invalidate
            resource_type: Type of resource (patient, order, etc.)
            user_context: User context for audit logging

        Returns:
            Number of cache entries invalidated
        """
        if not self.redis_client:
            return 0

        try:
            # Create pattern to match related cache keys
            org_id = "default"
            if user_context:
                org_id = user_context.get("organization_id", "default")

            pattern = f"*:{org_id}:*:*:{resource_id}*"

            # Find matching keys
            matching_keys = self.redis_client.keys(pattern)

            if matching_keys:
                # Delete matching keys
                deleted_count = self.redis_client.delete(*matching_keys)

                # Update metrics
                self.metrics["cache_invalidations"] += deleted_count

                # Log invalidation
                self.audit_service.log_event(
                    event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                    details=f"Cache invalidation for resource {resource_id}",
                    resource_type=resource_type or "unknown",
                    resource_id=resource_id,
                    data_classification=DataClassification.SENSITIVE,
                    success=True,
                    additional_data={
                        "invalidated_keys": len(matching_keys),
                        "pattern": pattern,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )

                logger.info(f"Invalidated {deleted_count} cache entries for resource {resource_id}")
                return deleted_count

            return 0

        except Exception as e:
            logger.error(f"Cache invalidation failed: {str(e)}")
            return 0

    def invalidate_user_cache(
        self,
        user_id: str,
        organization_id: Optional[str] = None
    ) -> int:
        """
        Invalidate all cache entries for a specific user.

        Args:
            user_id: ID of the user
            organization_id: Organization ID for scoping

        Returns:
            Number of cache entries invalidated
        """
        if not self.redis_client:
            return 0

        try:
            org_id = organization_id or "default"
            pattern = f"*:{org_id}:{user_id}:*"

            matching_keys = self.redis_client.keys(pattern)

            if matching_keys:
                deleted_count = self.redis_client.delete(*matching_keys)
                self.metrics["cache_invalidations"] += deleted_count

                logger.info(f"Invalidated {deleted_count} cache entries for user {user_id}")
                return deleted_count

            return 0

        except Exception as e:
            logger.error(f"User cache invalidation failed: {str(e)}")
            return 0

    def get_cache_metrics(self) -> Dict[str, Any]:
        """
        Get cache performance metrics.

        Returns:
            Dictionary containing cache metrics
        """
        try:
            # Get Redis info
            redis_info = {}
            if self.redis_client:
                info = self.redis_client.info()
                redis_info = {
                    "used_memory": info.get("used_memory", 0),
                    "used_memory_human": info.get("used_memory_human", "0B"),
                    "connected_clients": info.get("connected_clients", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0),
                }

            # Calculate hit ratio
            total_cache_ops = self.metrics["cache_hits"] + self.metrics["cache_misses"]
            hit_ratio = (
                self.metrics["cache_hits"] / total_cache_ops
                if total_cache_ops > 0 else 0
            )

            return {
                "cache_metrics": self.metrics.copy(),
                "hit_ratio": round(hit_ratio, 4),
                "redis_info": redis_info,
                "is_connected": self.redis_client is not None,
                "ttl_policies": {
                    level.value: ttl for level, ttl in self.ttl_policies.items()
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get cache metrics: {str(e)}")
            return {
                "error": str(e),
                "is_connected": False,
                "timestamp": datetime.utcnow().isoformat()
            }

    def clear_all_cache(self, confirm: bool = False) -> bool:
        """
        Clear all cache entries (use with caution).

        Args:
            confirm: Must be True to actually clear cache

        Returns:
            True if cache was cleared, False otherwise
        """
        if not confirm or not self.redis_client:
            return False

        try:
            # Get all cache keys
            cache_keys = []
            for prefix in self.key_prefixes.values():
                cache_keys.extend(self.redis_client.keys(f"{prefix}*"))

            if cache_keys:
                deleted_count = self.redis_client.delete(*cache_keys)

                # Reset metrics
                self.metrics = {
                    "cache_hits": 0,
                    "cache_misses": 0,
                    "cache_sets": 0,
                    "cache_invalidations": 0,
                    "total_operations": 0,
                }

                logger.warning(f"Cleared {deleted_count} cache entries")
                return True

            return True

        except Exception as e:
            logger.error(f"Failed to clear cache: {str(e)}")
            return False

    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on cache service.

        Returns:
            Health status information
        """
        try:
            if not self.redis_client:
                return {
                    "status": "unhealthy",
                    "error": "Redis client not initialized",
                    "timestamp": datetime.utcnow().isoformat()
                }

            # Test Redis connection
            start_time = time.time()
            self.redis_client.ping()
            response_time = time.time() - start_time

            return {
                "status": "healthy",
                "response_time_ms": round(response_time * 1000, 2),
                "metrics": self.get_cache_metrics(),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }


# Global encryption cache instance
_encryption_cache: Optional[EncryptionCache] = None


def get_encryption_cache() -> EncryptionCache:
    """
    Get the global encryption cache instance.

    Returns:
        EncryptionCache instance
    """
    global _encryption_cache

    if _encryption_cache is None:
        _encryption_cache = EncryptionCache()

    return _encryption_cache


# Convenience functions for common cache operations

def cache_decrypted_field(
    encrypted_data: str,
    decrypted_data: str,
    field_name: str,
    user_context: Optional[TokenData] = None,
    data_classification: str = "PHI"
) -> bool:
    """
    Convenience function to cache decrypted field data.

    Args:
        encrypted_data: Original encrypted data
        decrypted_data: Decrypted data to cache
        field_name: Name of the field
        user_context: User context from authentication
        data_classification: Data classification level

    Returns:
        True if caching succeeded
    """
    cache = get_encryption_cache()

    context = None
    if user_context:
        context = {
            "user_id": str(user_context.id),
            "organization_id": str(user_context.organization_id),
            "role": user_context.role
        }

    return cache.cache_decryption(
        encrypted_data=encrypted_data,
        decrypted_data=decrypted_data,
        user_context=context,
        field_name=field_name,
        data_classification=data_classification
    )


def get_cached_decrypted_field(
    encrypted_data: str,
    field_name: str,
    user_context: Optional[TokenData] = None
) -> Optional[str]:
    """
    Convenience function to retrieve cached decrypted field data.

    Args:
        encrypted_data: Original encrypted data
        field_name: Name of the field
        user_context: User context from authentication

    Returns:
        Cached decrypted data or None
    """
    cache = get_encryption_cache()

    context = None
    if user_context:
        context = {
            "user_id": str(user_context.id),
            "organization_id": str(user_context.organization_id),
            "role": user_context.role
        }

    return cache.get_cached_decryption(
        encrypted_data=encrypted_data,
        user_context=context,
        field_name=field_name
    )