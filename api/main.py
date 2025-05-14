from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import os
import re
import json
import logging
from dotenv import load_dotenv
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Import routers
from chat import router as chat_router
from vote import router as vote_router
from upload import router as upload_router
from agents.routes import router as agent_router
from utils.auth import get_current_user
from settings.config import settings

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models, establish connections, etc.
    logger.info("Starting up the API server...")
    
    # Add startup logic here
    
    yield
    
    # Shutdown: Clean up resources
    logger.info("Shutting down the API server...")

app = FastAPI(
    title="Arenas API",
    description="API for chat, agents, and data processing",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression
app.add_middleware(GZipMiddleware)

# Include routers
app.include_router(chat_router)
app.include_router(vote_router)
app.include_router(upload_router)
app.include_router(agent_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Arenas API. Visit /docs for API documentation."}

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return {"detail": str(exc)}

# Instrument the application with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
