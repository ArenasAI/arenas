from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
from typing import Optional

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/generate"

class ChatRequest(BaseModel):
    message: str
    model: str = "llama2"
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    model: str

@app.post("/chat")
async def chat_with_llm(request: ChatRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": request.model,
                    "prompt": request.message,
                    "context": request.context,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Ollama API error")
            
            result = response.json()
            return ChatResponse(
                response=result["response"],
                model=request.model
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch models")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
