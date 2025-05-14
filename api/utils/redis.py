import os
import redis
from typing import Optional
from dotenv import load_dotenv
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class RedisClient:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.ttl = int(os.getenv("REDIS_TTL", "3600"))  # Default TTL: 1 hour
        
        # Connect to Redis
        try:
            if self.redis_url:
                self.client = redis.from_url(self.redis_url)
                logger.info("Redis client initialized successfully")
            else:
                logger.warning("REDIS_URL not provided. Redis client not initialized.")
                self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize Redis client: {str(e)}")
            self.client = None
    
    def get(self, key: str) -> Optional[dict]:
        """Get a value from Redis cache"""
        if not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error retrieving value from Redis: {str(e)}")
            return None
    
    def set(self, key: str, value: dict, ttl: int = None) -> bool:
        """Set a value in Redis cache"""
        if not self.client:
            return False
        
        try:
            expiry = ttl if ttl is not None else self.ttl
            return self.client.set(key, json.dumps(value), ex=expiry)
        except Exception as e:
            logger.error(f"Error setting value in Redis: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete a value from Redis cache"""
        if not self.client:
            return False
        
        try:
            return self.client.delete(key) > 0
        except Exception as e:
            logger.error(f"Error deleting value from Redis: {str(e)}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis"""
        if not self.client:
            return False
        
        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking key existence in Redis: {str(e)}")
            return False
    
    def flush(self) -> bool:
        """Clear all keys from Redis (use with caution)"""
        if not self.client:
            return False
        
        try:
            self.client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Error flushing Redis database: {str(e)}")
            return False
    
    # Supabase-specific methods
    def cache_supabase_query(self, query_name: str, user_id: str, params: dict, result: dict) -> bool:
        """Cache a Supabase query result"""
        cache_key = f"supabase:{query_name}:{user_id}:{json.dumps(params, sort_keys=True)}"
        return self.set(cache_key, result)
    
    def get_cached_supabase_query(self, query_name: str, user_id: str, params: dict) -> Optional[dict]:
        """Get a cached Supabase query result"""
        cache_key = f"supabase:{query_name}:{user_id}:{json.dumps(params, sort_keys=True)}"
        return self.get(cache_key)
    
    def invalidate_user_cache(self, user_id: str) -> None:
        """Invalidate all cached queries for a specific user"""
        if not self.client:
            return
        
        try:
            pattern = f"supabase:*:{user_id}:*"
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Error invalidating user cache: {str(e)}")


# Create a singleton instance
redis_client = RedisClient()