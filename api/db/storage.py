from typing import List, Dict, Optional
from fastapi import HTTPException, UploadFile, APIRouter
from client import supabase
from datetime import datetime
router = APIRouter()

BUCKET_NAME = 'chat_attachments'
class StorageService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, client):
        if not hasattr(self, 'client'):
            self.client = client

    async def ensure_bucket_exists(self) -> None:
        try:
            buckets = await supabase.storage.list_buckets()
            bucket_exists = any(bucket.name == BUCKET_NAME for bucket in buckets)

            if not bucket_exists:
                await supabase.storage.create_bucket(
                    BUCKET_NAME,
                    options={
                        "public": True,
                        "file_size_limit": 52428800,  # 50MB
                        "allowed_mime_types": [
                            "image/*", 
                            "application/pdf",
                            "xlsx", 
                            "csv",
                            "parquet",
                            "json",
                            "docx"
                        ]
                    }
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    async def upload_file(self, file: UploadFile, path: List[str]) -> str:
        try:
            await self.ensure_bucket_exists()
            response = supabase.storage.from_(BUCKET_NAME).upload(
                file=file,
                path=path,
                file_options={"cache-control": "3600", "upsert": "false"}
            )

            if not response.get("error"):
                public_url = await response.get_public_url("/".join(path))
                return public_url
            raise HTTPException(status_code=500, detail="Upload failed")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    async def remove_file(self, file: UploadFile, path: List[str]) -> str:
        response = supabase.storage.from_(BUCKET_NAME).remove(path)
        return response

    async def store_chat_history(self, chat_id: str, messages: List[Dict], user_id: str) -> Dict:
        try:
            data = {
                'id': chat_id,
                'user_id': user_id,
                'messages': messages,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = await supabase.from_('chats').upsert(data).execute()
            
            if result.error:
                raise HTTPException(status_code=500, detail="Failed to store chat history")
            return result.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_chat_history(self, user_id: str) -> Optional[List[Dict]]:
        try:
            result = await supabase.from_('chats')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', ascending=False)\
                .execute()
            
            if result.error:
                raise HTTPException(status_code=500, detail="Failed to fetch chat history")
            return result.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_single_chat(self, chat_id: str, user_id: str) -> Optional[Dict]:
        try:
            result = await supabase.table('chats')\
                .select('*')\
                .eq('id', chat_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            if result.error:
                return None

            return result.data
        except Exception:
            return None