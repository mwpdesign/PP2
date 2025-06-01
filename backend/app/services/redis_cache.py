"""Redis caching service for analytics data."""

import json
from typing import Any, Dict, Optional, Union
from redis import Redis

from app.core.config import settings


class RedisCache:
    """Redis cache manager for analytics data."""

    def __init__(self):
        """Initialize Redis connection."""
        self.redis = Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
        )
        self.default_ttl = 3600  # 1 hour default TTL

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key with optional TTL."""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            return self.redis.set(key, value, ex=ttl or self.default_ttl)
        except Exception as e:
            print(f"Error setting cache key {key}: {e}")
            return False

    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        try:
            value = self.redis.get(key)
            if value and value.startswith("{") or value.startswith("["):
                return json.loads(value)
            return value
        except Exception as e:
            print(f"Error getting cache key {key}: {e}")
            return None

    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            print(f"Error deleting cache key {key}: {e}")
            return False

    def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern."""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                return bool(self.redis.delete(*keys))
            return True
        except Exception as e:
            print(f"Error deleting keys matching {pattern}: {e}")
            return False

    def hincrby(self, key: str, field: str, amount: int = 1) -> bool:
        """Increment hash field by amount."""
        try:
            self.redis.hincrby(key, field, amount)
            return True
        except Exception as e:
            print(f"Error incrementing hash field {field}: {e}")
            return False

    def hincrbyfloat(self, key: str, field: str, amount: float) -> bool:
        """Increment hash field by float amount."""
        try:
            self.redis.hincrbyfloat(key, field, amount)
            return True
        except Exception as e:
            print(f"Error incrementing hash field {field}: {e}")
            return False

    def cache_daily_metrics(
        self, org_id: str, date: str, metrics: Dict[str, Union[int, float, Dict]]
    ) -> bool:
        """Cache daily metrics for fast access."""
        key = f"daily_metrics:{org_id}:{date}"
        return self.set(key, metrics, ttl=86400)  # 24 hour TTL

    def get_daily_metrics(
        self, org_id: str, date: str
    ) -> Optional[Dict[str, Union[int, float, Dict]]]:
        """Get cached daily metrics."""
        key = f"daily_metrics:{org_id}:{date}"
        return self.get(key)

    def cache_dashboard_data(
        self, user_id: str, dashboard_type: str, data: Dict[str, Any]
    ) -> bool:
        """Cache dashboard data for specific user and type."""
        key = f"dashboard:{dashboard_type}:{user_id}"
        return self.set(key, data, ttl=300)  # 5 minute TTL

    def get_dashboard_data(
        self, user_id: str, dashboard_type: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached dashboard data."""
        key = f"dashboard:{dashboard_type}:{user_id}"
        return self.get(key)
