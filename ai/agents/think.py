import os
import json
from pinecone import Pinecone
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Literal
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.schema import AgentAction, AgentFinish
from pydantic import BaseModel
from langchain.vectorstores import Pinecone

# Load environment variables
os.environ["OPENAI_API_KEY"] = "sk-proj-1234567890"

class Dataset(BaseModel):
    name: str
    type: Literal["structured", "unstructured"]
    format: Optional[Literal["csv", "excel", "json", "parquet", "sql", "tableau", "text", "pdf"]] = None
    size: Optional[int] = None
    tags: Optional[List[str]] = None
    description: str

class CodeGenerationRequest(BaseModel):
    dataset: Dataset
    task: str
    language: Optional[Literal["python", "javascript", "r", "sql"]] = None
    outputFormat: Optional[Literal["script", "notebook", "function"]] = None
    includeVisualization: Optional[bool] = None

class RAGResult(BaseModel):
    content: str
    metadata: Dict[str, Any]


class DataAgent:
    # first we need to get the data from the dataset
    def __init__(self, dataset: Dataset):
        self.dataset = dataset
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

    def get_data(self):
        return self.dataset.data
    
    def get_context(self):
        return self.index.query(self.dataset.data)
    
    def generate_code(self):
        return self.index.query(self.dataset.data)
    