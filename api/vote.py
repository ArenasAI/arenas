from fastapi import APIRouter, HTTPException, Depends, Query, status, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from db.queries import DatabaseQueries
from client import supabase, get_current_user

router = APIRouter()
db = DatabaseQueries(supabase)

class VoteRequest(BaseModel):
    chatId: str
    messageId: str
    type: str  # "up" or "down"

@router.post("/vote")
async def vote_message(request: VoteRequest, user = Depends(get_current_user)):
    """Vote on a message (upvote or downvote)"""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        if request.type not in ["up", "down"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Type must be 'up' or 'down'")
        
        result = db.save_vote(
            chatId=request.chatId,
            messageId=request.messageId,
            userId=user.id,
            type=request.type
        )
        
        return JSONResponse(content={"message": "Vote recorded"}, status_code=status.HTTP_200_OK)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/vote")
async def get_votes(chatId: str = Query(...), user = Depends(get_current_user)):
    """Get all votes for a specific chat"""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        votes = db.get_votes_by_chat_id(chatId)
        return JSONResponse(content=votes, status_code=status.HTTP_200_OK)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/vote")
async def update_vote(request: VoteRequest, user = Depends(get_current_user)):
    """Update a vote on a message"""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        # First delete any existing vote
        db.supabase.table("votes").delete().eq("chat_id", request.chatId).eq("message_id", request.messageId).eq("user_id", user.id).execute()
        
        # Then create the new vote
        result = db.save_vote(
            chatId=request.chatId,
            messageId=request.messageId,
            userId=user.id,
            type=request.type
        )
        
        return JSONResponse(content={"message": "Vote updated"}, status_code=status.HTTP_200_OK)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
