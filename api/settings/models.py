import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

def initialize_model_configs() -> Dict[str, Dict[str, Any]]:
        """Initialize model configurations with validation"""
        configs = {
            "gpt-4o": {
                "provider": "openai",
                "api_key": os.getenv("OPENAI_API_KEY"),
                "model": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 4096,
                "requires_subscription": True
            },
            "gpt-4.5": {
                "provider": "openai",
                "api_key": os.getenv("OPENAI_API_KEY"),
                "temperature": 0.7,
                "max_tokens": 4096,
            },
            "claude-3-haiku": {
                "provider": "anthropic",
                "api_key": os.getenv("ANTHROPIC_API_KEY"),
                "model": "haiku-20241022",  # Base model name, provider prefix added in completion
                "temperature": 0.7,
                "max_tokens": 4096,
                "requires_subscription": False
            },
            "gemini-2.5-pro": {
                "provider": "gemini",
                "api_key": os.getenv("GEMINI_API_KEY"),
                "temperature": 0.7,
                "max_tokens": 4096,
                "requires_subscription": True
            },
        }
        
        for model_id, config in configs.items():
            if not config.get("api_key"):
                print(f"Missing API key for model: {model_id}")
        
        return configs