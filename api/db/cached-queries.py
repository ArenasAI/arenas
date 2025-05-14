from typing import Optional, Dict, List, Any
import json
import logging
from opentelemetry import trace
from fastapi import FastAPI

tracer = trace.get_tracer(__name__)
logger = logging.getLogger(__name__)

class CacheService:
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    # [Rest of the methods remain unchanged - keeping all the original methods]
    async def set_session(self, user_id: str, session_token: str, data: Dict):
        with tracer.start_as_current_span("cache_session") as span:
            try:
                key = f"session:{user_id}:{session_token}"
                await self.redis.setex(key, self.session_ttl, json.dumps(data))
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Error caching session: {e}")

    async def get_chat_history(self, user_id: str, chat_id: str) -> Optional[List[Dict]]:
        with tracer.start_as_current_span("get_chat_history") as span:
            try:
                key = f"chat:{user_id}:{chat_id}"
                cached = await self.redis.get(key)
                span.set_attribute("cache.hit", cached is not None)
                return json.loads(cached) if cached else None
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Chat history cache error: {e}")
                return None

    async def set_chat_history(self, user_id: str, chat_id: str, messages: List[Dict]):
        with tracer.start_as_current_span("cache_chat_history") as span:
            try:
                key = f"chat:{user_id}:{chat_id}"
                await self.redis.setex(key, self.chat_ttl, json.dumps(messages))
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Error caching chat history: {e}")

    async def cache_runtime_result(self, user_id: str, query_hash: str, result: Any):
        with tracer.start_as_current_span("cache_runtime_result") as span:
            try:
                key = f"runtime:{user_id}:{query_hash}"
                await self.redis.setex(key, self.runtime_cache_ttl, json.dumps(result))
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Error caching runtime result: {e}")

    async def get_runtime_result(self, user_id: str, query_hash: str) -> Optional[Any]:
        with tracer.start_as_current_span("get_runtime_result") as span:
            try:
                key = f"runtime:{user_id}:{query_hash}"
                cached = await self.redis.get(key)
                span.set_attribute("cache.hit", cached is not None)
                return json.loads(cached) if cached else None
            except Exception as e:
                span.set_attribute("error", str(e))
                return None

    async def cache_analysis_result(self, user_id: str, dataset_id: str, analysis: Dict):
        with tracer.start_as_current_span("cache_analysis_result") as span:
            try:
                key = f"analysis:{user_id}:{dataset_id}"
                await self.redis.setex(key, self.analysis_cache_ttl, json.dumps(analysis))
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Error caching analysis: {e}")

    async def get_analysis_result(self, user_id: str, dataset_id: str) -> Optional[Dict]:
        with tracer.start_as_current_span("get_analysis_result") as span:
            try:
                key = f"analysis:{user_id}:{dataset_id}"
                cached = await self.redis.get(key)
                span.set_attribute("cache.hit", cached is not None)
                return json.loads(cached) if cached else None
            except Exception as e:
                span.set_attribute("error", str(e))
                return None

    async def invalidate_cache(self, pattern: str):
        with tracer.start_as_current_span("invalidate_cache") as span:
            try:
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
            except Exception as e:
                span.set_attribute("error", str(e))
                logger.error(f"Error invalidating cache: {e}")

# Create singleton instance
cache_service = CacheService()