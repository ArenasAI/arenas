import os
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from supabase import create_client
from utils.redis import redis_client

load_dotenv()
security = HTTPBearer()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        cache_key = f"auth:user:{token}"
        cached_user = redis_client.get(cache_key)
        
        if cached_user:
            return cached_user
        
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if user:
            redis_client.set(cache_key, user.model_dump(), ttl=300)
        
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )