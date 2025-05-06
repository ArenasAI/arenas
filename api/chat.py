from litellm import completion
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi import Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
import json
from typing import List, Optional
from pydantic import BaseModel
from utils.prompt import ClientMessage
from utils.tools import get_current_weather
from settings.config import initialize_model_configs
from utils.prompt import convert_to_openai_messages

load_dotenv()

# Create router with the correct prefix
router = APIRouter(prefix="/chat")
security = HTTPBearer()
model_configs = initialize_model_configs()

class Request(BaseModel):
    messages: List[ClientMessage]

class ConversationRequest(BaseModel):
    messages: List[dict]
    modelId: str
    chatId: Optional[str] = None
    experimental_attachments: Optional[List[dict]] = None

available_tools = {
    "get_current_weather": get_current_weather,
}

def stream_text(messages: List[ClientMessage], protocol: str = 'data'):    
    config = model_configs.get(messages[0].modelId)
    if not config:
        raise HTTPException(status_code=400, detail="Invalid model ID")
    try:
        response = completion(
            messages=messages,
            model=f"{config['provider']}/{config['model']}",
            stream=True,
            api_key=config['api_key'],
            tools=[{
                "type": "web_search_preview",
                "search_context_size": "medium",
            }],
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
    
@router.post("/conversation")
async def handle_conversation_stream(request: ConversationRequest, protocol: str = Query('data')):
        messages = request.messages
        openai_messages = convert_to_openai_messages(messages)

        response = StreamingResponse(stream_text(openai_messages, protocol))
        return response