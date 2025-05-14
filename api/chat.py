from litellm import completion
from fastapi import APIRouter, HTTPException, Request, Body, Query, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import uuid
import json
from typing import List, Optional
from pydantic import BaseModel
from utils.prompt import ClientMessage
from utils.tools import get_current_weather
from settings.config import initialize_model_configs
from utils.prompt import convert_to_openai_messages
from db.queries import DatabaseQueries
from db.mutations import DatabaseMutations
from client import supabase
from utils.auth import get_current_user
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from openai import OpenAI
import os 

load_dotenv()
router = APIRouter()
model_configs = initialize_model_configs()
db = DatabaseQueries(supabase)
mutations = DatabaseMutations(supabase)
bearer_scheme = HTTPBearer()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

class ChatRequest(BaseModel):
    messages: List[ClientMessage]
    modelId: str
    chatId: Optional[str] = None

def generate_title(messages: List[ClientMessage]) -> str:
    try:
        title = messages[0].content
        if len(messages) > 1:
            title += " " + messages[1].content
        return title[:50]  # Limit title length to 50 characters
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating title: {str(e)}")

def stream_text(messages: List[dict], protocol: str = 'data', modelId: str = None):    
    # Check if modelId was passed separately
    if not modelId:
        raise HTTPException(status_code=400, detail="Missing modelId in request")
        
    config = model_configs.get(modelId)
    if not config:
        raise HTTPException(status_code=400, detail=f"Invalid model ID: {modelId}")
    
    # Define available tools - this will work for OpenAI and other providers
    available_tools = {"get_current_weather": get_current_weather}
    
    try:
        # Define tools properly with function definitions
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Get the current weather in a given location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA"
                            },
                            "unit": {
                                "type": "string",
                                "enum": ["celsius", "fahrenheit"],
                                "description": "The unit of temperature to use"
                            }
                        },
                        "required": ["location"]
                    }
                }
            }
        ]
        
        response = completion(
            messages=messages,
            model=f"{config['provider']}/{config['model']}",
            stream=True,
            api_key=config['api_key'],
            tools=tools,
        )

        if (protocol == 'text'):
            for chunk in response:
                for choice in chunk.choices:
                    if choice.finish_reason == 'stop':
                        break
                    else:
                        yield "{text}".format(text=choice.delta.content)

        elif (protocol == 'data'):
            draft_tool_calls = []
            draft_tool_calls_index = -1

            for chunk in response:
                for choice in chunk.choices:
                    if choice.finish_reason == "stop":
                        continue

                    elif choice.finish_reason == "tool_calls":
                        for tool_call in draft_tool_calls:
                            yield '9:{{"toolCallId":"{id}","toolName":"{name}","args":{args}}}\n'.format(
                                id=tool_call["id"],
                                name=tool_call["name"],
                                args=tool_call["arguments"])

                        for tool_call in draft_tool_calls:
                            tool_result = available_tools[tool_call["name"]](
                                **json.loads(tool_call["arguments"]))

                            yield 'a:{{"toolCallId":"{id}","toolName":"{name}","args":{args},"result":{result}}}\n'.format(
                                id=tool_call["id"],
                                name=tool_call["name"],
                                args=tool_call["arguments"],
                                result=json.dumps(tool_result))

                    elif choice.delta.tool_calls:
                        for tool_call in choice.delta.tool_calls:
                            id = tool_call.id
                            name = tool_call.function.name
                            arguments = tool_call.function.arguments

                            if (id is not None):
                                draft_tool_calls_index += 1
                                draft_tool_calls.append(
                                    {"id": id, "name": name, "arguments": ""})

                            else:
                                draft_tool_calls[draft_tool_calls_index]["arguments"] += arguments

                    else:
                        yield '0:{text}\n'.format(text=json.dumps(choice.delta.content))

                if chunk.choices == []:
                    usage = chunk.usage
                    prompt_tokens = usage.prompt_tokens
                    completion_tokens = usage.completion_tokens

                    yield 'd:{{"finishReason":"{reason}","usage":{{"promptTokens":{prompt},"completionTokens":{completion}}}}}\n'.format(
                        reason="tool-calls" if len(
                            draft_tool_calls) > 0 else "stop",
                        prompt=prompt_tokens,
                        completion=completion_tokens
                    )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat does not work. {str(e)}")
    
@router.post("/api/chat")
async def handle_chat_data(request_data: ChatRequest, protocol: str = Query('data')):
        try:
            print(f"Received request: {request_data}")
            messages = request_data.messages
            modelId = request_data.modelId
            
            # Handle both direct messages and initialMessages
            if not messages and request_data.initialMessages:
                messages = request_data.initialMessages
                
            openai_messages = convert_to_openai_messages(messages)

            # Create a buffer to store the assistant's response
            ai_response_buffer = []
            
            # Create a helper function to capture the assistant's response while streaming
            async def response_generator(stream):
                full_content = ""
                for chunk in stream:
                    yield chunk
                    # For data protocol, extract content by checking for text content (0:)
                    if protocol == 'data' and chunk.startswith('0:'):
                        try:
                            # Extract and unescape the content
                            content_json = chunk[2:].strip()
                            if content_json:
                                content = json.loads(json.loads(content_json))
                                if content:
                                    full_content += content
                        except Exception as e:
                            print(f"Error parsing chunk: {e}")
                    # For text protocol, directly append
                    elif protocol == 'text':
                        full_content += chunk
                
                # Save the complete AI response when streaming is done
                if request_data.chatId and full_content:
                    ai_message = {
                        "role": "assistant",
                        "content": full_content,
                        "chat_id": request_data.chatId
                    }
                    ai_response_buffer.append(ai_message)
                    
                    # Now save both user and AI messages
                    try:
                        # First save user messages
                        user_messages = [{
                            "role": "user",
                            "content": msg.content,
                            "chat_id": request_data.chatId
                        } for msg in messages if msg.role == "user"]
                        
                        # Combine with AI response 
                        all_messages = user_messages + ai_response_buffer
                        
                        # Save to database
                        await mutations.save_messages(request_data.chatId, all_messages)
                    except Exception as e:
                        print(f"Error saving messages: {str(e)}")
            
            # Generate the streaming response with our wrapper to capture content
            stream = stream_text(openai_messages, protocol, modelId)
            response = StreamingResponse(response_generator(stream))
            response.headers['x-vercel-ai-data-stream'] = 'v1'
            return response
            
        except Exception as e:
            print(f"Error handling chat request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error handling chat request: {str(e)}")




@router.post("/new-chat")
async def create_new_chat(request_body: Request, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    try:
        # Get the JWT token from the Authorization header
        token = credentials.credentials
        
        # Authenticate the user and get their ID
        try:
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            user_id = user_response.user.id
            
        except Exception as auth_error:
            print(f"Authentication error: {str(auth_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(auth_error)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Create the new chat
        chat_id = str(uuid.uuid4())
        title = request_body.title or "New Chat"
        
        # Use the authenticated client to save the chat
        db_response = db.save_chat(chat_id, user_id, title, token)
        if not db_response:
            raise HTTPException(status_code=500, detail="Failed to save chat")
            
        return {"chatId": chat_id}
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        print(f"Unexpected error in create_new_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating new chat: {str(e)}")

@router.delete("/chat/{chat_id}")
async def delete_chat(chat_id: str, user_id: str = Depends(get_current_user)):
    """Delete a chat by ID"""
    try:
        chat = db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Check if the user is the owner of the chat
        if chat["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this chat")
        
        db.delete_chat(chat_id)
        return {"message": "Chat deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")


@router.get("/history")
async def get_chat_history(user_id: str = Depends(get_current_user)):
    """Get chat history for a user"""
    try:
        response = await db.get_chats(user_id)
        if not response:
            raise HTTPException(status_code=404, detail="No chats found")
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")
    