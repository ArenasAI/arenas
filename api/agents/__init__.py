"""
Data Science and Machine Learning Agents for specialized tasks
"""

from typing import Any, Callable, TypeVar, ParamSpec, Annotated, Dict, List, Optional, Type
from pydantic import BaseModel, Field

P = ParamSpec('P')
R = TypeVar('R')

class WebSearchTool:
    """Tool for performing web searches"""
    
    def __init__(self, name: str = "web_search", description: str = "Search the web for information"):
        self.name = name
        self.description = description
        self.function = {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find information"
                    }
                },
                "required": ["query"]
            }
        }
    
    def __call__(self, query: str) -> str:
        """Mock implementation that would be replaced with actual search functionality"""
        return f"Search results for '{query}'"

def function_tool(func: Callable[P, R]) -> Callable[P, R]:
    """Decorator to convert a Python function into an agent tool"""
    setattr(func, "is_tool", True)
    return func

class Agent:
    """Base class for creating agents with specialized capabilities"""
    
    def __init__(self, name: str, instructions: str, tools: List[Any] = None, handoffs: List['Agent'] = None):
        self.name = name
        self.instructions = instructions
        self.tools = tools or []
        self.handoffs = handoffs or []
    
    def with_tools(self, *tools: Any) -> 'Agent':
        """Add tools to the agent"""
        self.tools.extend(tools)
        return self

# Don't import the specific agents here to avoid circular imports
__all__ = [
    'WebSearchTool',
    'function_tool',
    'Agent'
] 