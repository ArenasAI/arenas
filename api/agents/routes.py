from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import json

# Import agents directly from their modules
from agents.cleaning import clean as data_cleaning_agent
from agents.ml import ml_agent
from utils.auth import get_current_user

# Define agent router
router = APIRouter(prefix="/agents", tags=["agents"])

class AgentRequest(BaseModel):
    agent_id: str
    message: str
    data: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    agent_id: str
    response: Any
    status: str

@router.post("/query", response_model=AgentResponse)
async def query_agent(request: AgentRequest, user_id: str = Depends(get_current_user)):
    """
    Send a query to a specific agent and receive a response.
    """
    try:
        agent_id = request.agent_id.lower()
        
        # Determine which agent to use
        if agent_id == "data-cleaning":
            agent = data_cleaning_agent
            agent_name = "Data Cleaning Agent"
        elif agent_id == "ml":
            agent = ml_agent
            agent_name = "Machine Learning Agent"
        else:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
        
        # Mock agent interaction
        # In a real implementation, this would use the OpenAI Agents SDK
        # with all the tools and functionality we defined
        response = {
            "message": f"Agent {agent_name} received your message: {request.message}",
            "agent_details": {
                "name": agent.name,
                "instructions_summary": agent.instructions[:100] + "...",
                "tools_count": len(agent.tools)
            }
        }
        
        # If data was provided and this is a valid tool request, format as if processed
        if request.data and request.message.startswith("analyze") and agent_id == "data-cleaning":
            response["analysis"] = {
                "data_received": True,
                "sample": str(request.data)[:100] + "...",
                "recommended_action": "Use clean_data tool to process this dataset"
            }
        
        return AgentResponse(
            agent_id=agent_id,
            response=response,
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing agent request: {str(e)}")

@router.get("/list")
async def list_agents(user_id: str = Depends(get_current_user)):
    """
    List all available agents and their capabilities.
    """
    return {
        "agents": [
            {
                "id": "data-cleaning",
                "name": data_cleaning_agent.name,
                "description": "Specializes in data analysis, cleaning, and visualization",
                "tools": [t.__name__ if hasattr(t, "__name__") else t.name 
                          for t in data_cleaning_agent.tools]
            },
            {
                "id": "ml",
                "name": ml_agent.name,
                "description": "Specializes in machine learning model building and evaluation",
                "tools": [t.__name__ if hasattr(t, "__name__") else t.name 
                          for t in ml_agent.tools]
            }
        ]
    } 