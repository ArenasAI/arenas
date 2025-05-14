from fastapi import FastAPI, UploadFile, Form, HTTPException, Request, APIRouter
from typing import Optional, Dict, Any, List
import os
import uuid
import logging
from supabase import create_client, Client
from datetime import datetime


router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = [
    'image/*',
    'application/pdf',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'application/json'
]

def check_supabase_error(result, operation_name="operation"):
    """Helper function to check for errors in Supabase responses"""
    if hasattr(result, 'error') and result.error:
        logger.error(f"{operation_name} error: {result.error}")
        raise ValueError(f"Failed {operation_name}: {result.error}")
    return result

def is_file_spreadsheet(file_type, filename):
    """Determine if file is a spreadsheet or document type"""
    spreadsheet_types = ["spreadsheet", "csv"]
    spreadsheet_extensions = [".xlsx", ".xls", ".json", ".pdf", ".txt"]
    
    return (any(stype in file_type for stype in spreadsheet_types) or
            any(filename.endswith(ext) for ext in spreadsheet_extensions))

def is_mime_type_allowed(file_type, allowed_types):
    """Check if file type is allowed"""
    # Exact match
    if file_type in allowed_types:
        return True
    
    # Wildcard match (image/*)
    for allowed_type in allowed_types:
        if allowed_type.endswith('/*'):
            prefix = allowed_type.split('/*')[0]
            if file_type.startswith(prefix + '/'):
                return True
    
    return False

def sanitize_filename(filename: str) -> str:
    """Remove special characters from filename and convert to lowercase."""
    import re
    return re.sub(r'[^a-zA-Z0-9.-]', '_', filename).lower()

def create_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials")
    
    return create_client(url, key)

async def upload_to_storage(
    supabase: Client,
    file: UploadFile,
    path: List[str],
    bucket: str,
    content_type: str
) -> str:

    file_path = '/'.join(path)
    file_contents = await file.read()
    
    result = supabase.storage.from_(bucket).upload(
        file_path,
        file_contents,
        {"content-type": content_type}
    )
    
    check_supabase_error(result, "Storage upload")
    
    public_url = supabase.storage.from_(bucket).get_public_url(file_path)
    return public_url

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    chat_id: str = Form(...),
):
    try:
        # Check if file exists
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check mime type
        file_type = file.content_type
        if not is_mime_type_allowed(file_type, ALLOWED_MIME_TYPES):
            return {
                "error": "Invalid file type. Please upload a different format.",
                "allowedTypes": ALLOWED_MIME_TYPES,
                "receivedType": file_type
            }, 400
        
        # Check if chat_id is provided
        if not chat_id:
            raise HTTPException(status_code=400, detail="No chatId provided")
        
        # Get Supabase client
        supabase = create_supabase_client()
        
        # Get current user
        user_response = supabase.auth.get_user()
        check_supabase_error(user_response, "Authentication")
        
        user = user_response.user
        
        # Determine file type and bucket
        is_spreadsheet = is_file_spreadsheet(file_type, file.filename)
        
        bucket_id = "data-files" if is_spreadsheet else "chat_attachments"
        
        logger.info(f"Upload request: {file.filename}, {file_type}, {chat_id}, {bucket_id}")
        
        # Check if bucket exists, create if it doesn't
        buckets = supabase.storage.list_buckets()
        if bucket_id not in [b.id for b in buckets]:
            logger.info(f"Creating {bucket_id} bucket...")
            create_result = supabase.storage.create_bucket(
                bucket_id,
                {
                    "public": True,
                    "file_size_limit": 52428800,
                    "allowed_mime_types": ALLOWED_MIME_TYPES
                }
            )
            check_supabase_error(create_result, "Bucket creation")

        # Upload file
        file_id = str(uuid.uuid4())
        sanitized_filename = sanitize_filename(file.filename)
        file_path = [user.id, chat_id, sanitized_filename]
        
        logger.info(f"Attempting file upload: {bucket_id}, {file_type}, {'/'.join(file_path)}")
        
        # Upload the file and get public URL
        public_url = await upload_to_storage(
            supabase,
            file,
            file_path,
            bucket_id,
            file_type
        )
        
        # Check if file exists in the database
        path_str = '/'.join(file_path)
        existing_file = supabase.table('file_uploads').select('url') \
            .eq('user_id', user.id) \
            .eq('chat_id', chat_id) \
            .eq('storage_path', path_str) \
            .eq('bucket_id', bucket_id) \
            .order('version', {'ascending': False}) \
            .limit(1) \
            .execute()
            
        if existing_file.data:
            return {
                "url": existing_file.data[0]['url'],
                "path": path_str,
                "isSpreadsheet": is_spreadsheet
            }
        
        # Insert file record
        file_size = file.size
        preview_type = "spreadsheet" if is_spreadsheet else "image" if file_type.startswith("image/") else "file"
        icon = None if file_type.startswith("image/") else "FileSpreadsheet" if is_spreadsheet else "FileText"
        
        insert_result = supabase.table('file_uploads').insert({
            "user_id": user.id,
            "chat_id": chat_id,
            "bucket_id": bucket_id,
            "storage_path": path_str,
            "filename": sanitized_filename,
            "original_name": file.filename,
            "content_type": file_type,
            "size": file_size,
            "url": public_url,
            "version": 1,
            "is_spreadsheet": is_spreadsheet,
            "preview_data": {
                "type": preview_type,
                "name": file.filename,
                "size": file_size,
                "contentType": file_type,
                "lastModified": datetime.now().isoformat(),
                "dimensions": None,
                "thumbnail": public_url if file_type.startswith("image/") else None,
                "icon": icon
            }
        }).execute()
        
        check_supabase_error(insert_result, "Database insert")
        
        logger.info("File record created successfully")
        
        return {
            "url": public_url,
            "path": path_str,
            "isSpreadsheet": is_spreadsheet,
            "fileId": file_id,
            "preview": {
                "type": preview_type,
                "name": file.filename,
                "size": file_size,
                "contentType": file_type,
                "lastModified": datetime.now().isoformat(),
                "dimensions": None,
                "thumbnail": public_url if file_type.startswith("image/") else None,
                "icon": icon
            }
        }
        
    except Exception as e:
        logger.error(f"Request handler error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/upload")
async def delete_file(request: Request):
    try:
        data = await request.json()
        chat_id = data.get('chatId')
        path = data.get('path')
        
        if not chat_id or not path:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        supabase = create_supabase_client()
        
        # Get current user
        user_response = supabase.auth.get_user()
        check_supabase_error(user_response, "Authentication")
        
        user = user_response.user
        
        # Delete from storage
        full_path = f"{user.id}/{chat_id}/{path}"
        storage_result = supabase.storage.from_('chat_attachments').remove([full_path])
        
        check_supabase_error(storage_result, "Storage removal")
        
        # Delete from database
        db_result = supabase.table('file_uploads').delete() \
            .eq('user_id', user.id) \
            .eq('chat_id', chat_id) \
            .eq('storage_path', full_path) \
            .execute()
            
        check_supabase_error(db_result, "Database removal")
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"File removal error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove file: {str(e)}")