from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from client import supabase
import json

logger = logging.getLogger(__name__)

class DatabaseQueries:
    def __init__(self, client):
        self.supabase = client

    def get_chats(self, userId: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all chats for a user with pagination"""
        try:
            response = self.supabase.table("chats").select("*").eq("user_id", userId).order("created_at", desc=True).limit(limit).offset(offset).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error in get_chats: {str(e)}")
            raise

    def delete_chat(self, id: str, userId: str = None) -> bool:
        """Delete a chat and optionally verify user ownership"""
        try:
            query = self.supabase.table("chats").delete()
            
            if userId:
                query = query.eq("user_id", userId)
            
            query = query.eq("id", id)
            response = query.execute()
            
            # Also delete associated messages
            self.delete_messages_by_chat_id(id)
            
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error in delete_chat: {str(e)}")
            raise

    def save_chat(self, id: str, userId: str, title: str) -> Dict[str, Any]:
        """Create a new chat"""
        try:
            logger.info(f"Attempting to save chat - ID: {id}, User ID: {userId}")
            
            # Generate timestamp that matches the frontend format
            now = datetime.utcnow().isoformat()
            
            chat_data = {
                "id": id,
                "user_id": userId,
                "title": title,
                "created_at": now,
                "updated_at": now  # Adding updated_at to match frontend schema
            }
            
            # When using anon key with RLS policies, you need to ensure:
            # 1. The user is authenticated
            # 2. The user_id in the record matches the authenticated user's ID
            # This is enforced by the RLS policy and should work with the standard client setup
            response = self.supabase.table("chats").insert(chat_data).execute()
            
            return response.data[0] if response.data else chat_data
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error saving chat: {error_message}")
            
            if hasattr(e, 'json'):
                try:
                    error_details = json.loads(e.json())
                    logger.error(f"Error details: {error_details}")
                except:
                    pass
                    
            # Check if this is an RLS error
            if "row-level security policy" in error_message or "42501" in error_message:
                logger.error("Row-level security policy violation. Make sure this API has proper authorization.")
                
            raise

    def update_chat_title(self, id: str, title: str, userId: str = None) -> bool:
        """Update a chat title and optionally verify user ownership"""
        query = self.supabase.table("chats").update({"title": title})
        
        if userId:
            query = query.eq("user_id", userId)
            
        query = query.eq("id", id)
        response = query.execute()
        
        return len(response.data) > 0

    # Message operations
    def get_messages(self, chatId: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all messages for a chat"""
        response = self.supabase.table("messages").select("*").eq("chat_id", chatId).order("created_at").limit(limit).execute()
        return response.data if response.data else []

    def save_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Save a single message"""
        if "created_at" not in message:
            message["created_at"] = datetime.utcnow().isoformat()
            
        response = self.supabase.table("messages").insert(message).execute()
        return response.data[0] if response.data else None

    def save_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Save multiple messages in a batch"""
        for message in messages:
            if "created_at" not in message:
                message["created_at"] = datetime.utcnow().isoformat()
                
        response = self.supabase.table("messages").insert(messages).execute()
        return response.data if response.data else []

    def delete_messages_by_chat_id(self, chatId: str) -> bool:
        """Delete all messages for a chat"""
        response = self.supabase.table("messages").delete().eq("chat_id", chatId).execute()
        return len(response.data) > 0

    # User operations
    def get_user_by_id(self, userId: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        response = self.supabase.table("users").select("*").eq("id", userId).execute()
        return response.data[0] if response.data else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        response = self.supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    # Voting operations
    def save_vote(self, chatId: str, messageId: str, userId: str, type: str) -> Dict[str, Any]:
        """Save a vote (upvote or downvote)"""
        vote_data = {
            "chat_id": chatId,
            "message_id": messageId,
            "user_id": userId,
            "type": type,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = self.supabase.table("votes").insert(vote_data).execute()
        return response.data[0] if response.data else None
    
    def get_votes_by_chat_id(self, chatId: str) -> List[Dict[str, Any]]:
        """Get all votes for a chat"""
        response = self.supabase.table("votes").select("*").eq("chat_id", chatId).execute()
        return response.data if response.data else []
    
    # File operations
    def save_file(self, userId: str, chatId: str, filename: str, fileUrl: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Save file information"""
        file_data = {
            "user_id": userId,
            "chat_id": chatId,
            "filename": filename,
            "url": fileUrl,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = self.supabase.table("files").insert(file_data).execute()
        return response.data[0] if response.data else None
    
    def get_files_by_chat_id(self, chatId: str) -> List[Dict[str, Any]]:
        """Get all files for a chat"""
        response = self.supabase.table("files").select("*").eq("chat_id", chatId).execute()
        return response.data if response.data else []