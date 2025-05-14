from typing import List, Dict, Optional
from datetime import datetime
import json
from client import supabase
from fastapi import HTTPException
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

class DatabaseMutations:
    def __init__(self, supabase):
        self.client = supabase

    async def create_chat(self, id: str, user_id: str, title: str) -> Dict:
        try:
            now = datetime.utcnow().isoformat()
            response = await self.client.from_('chats').insert({
                'id': id,
                'user_id': user_id,
                'title': title,
                'created_at': now,
                'updated_at': now
            }).execute()
            
            if response.error:
                raise HTTPException(status_code=500, detail=str(response.error))
            
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

    async def save_chat(self, id: str, user_id: str, title: str) -> Dict:
        try:
            now = datetime.time.time().isoformat()
            response = await self.client.from_('chats').insert({
                'id': id,
                'user_id': user_id,
                'title': title,
                'created_at': now,
                'updated_at': now
            }).execute()
            
            if response.error:
                raise HTTPException(status_code=500, detail=str(response.error))
            
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")

    async def delete_chat(self, chat_id: str, user_id: str) -> None:
        try:
            response = await self.client.from_('chats').delete().match({
                'id': chat_id,
                'user_id': user_id
            }).execute()
            
            if response.error:
                raise HTTPException(status_code=500, detail=str(response.error))

            if self.redis:
                await self.redis.delete(f"chat:{chat_id}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")
        
    async def save_messages(self, chat_id: str, messages: List[Dict]) -> List[Dict]:
        """Save messages to the database"""
        try:
            formatted_messages = []
            for message in messages:
                # Ensure we have the necessary fields
                if "role" not in message or "content" not in message:
                    continue
                    
                content = message["content"]
                
                if isinstance(content, (dict, list)):
                    content = json.dumps(content)

                formatted_message = {
                    'chat_id': chat_id,
                    'role': message['role'],
                    'content': content,
                    'created_at': message.get('created_at') or datetime.utcnow().isoformat()
                }

                if 'id' in message:
                    formatted_message['id'] = message['id']
                if 'metadata' in message:
                    formatted_message['metadata'] = json.dumps(message['metadata'])

                formatted_messages.append(formatted_message)

            # Don't attempt to save if no valid messages
            if not formatted_messages:
                return []
                
            response = await self.client.from_('messages').insert(
                formatted_messages
            ).execute()

            if response.error:
                raise HTTPException(status_code=500, detail=str(response.error))

            return response.data

        except Exception as e:
            # Log the error but don't crash the application
            print(f"Failed to save messages: {str(e)}")
            return []

    async def update_vote(self, message_id: str, is_upvoted: bool) -> Dict:
        try:
            response = await self.client.from_('votes').upsert({
                'message_id': message_id,
                'is_upvoted': is_upvoted,
            }).execute()
            return response.data[0]

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save vote: {str(e)}")