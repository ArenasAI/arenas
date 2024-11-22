from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
from typing import Dict, Any
import json
from kafka import KafkaProducer, KafkaConsumer

app = FastAPI()

class AnalysisRequest(BaseModel):
    runtime: str  # "python", "r", or "julia"
    code: str
    data_source: str
    user_id: str

class AnalyzerService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
    async def process_analysis(self, request: AnalysisRequest):
        # Send to appropriate runtime service
        message = {
            "user_id": request.user_id,
            "code": request.code,
            "data_source": request.data_source,
            "request_id": str(uuid.uuid4())
        }
        
        self.producer.send(f'{request.runtime}_analysis_queue', message)
        return {"request_id": message["request_id"]}

    async def handle_results(self):
        consumer = KafkaConsumer(
            'analysis_results',
            bootstrap_servers=['localhost:9092'],
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        for message in consumer:
            # Process results and send to visualization service
            await self.send_to_visualization(message.value)

analyzer = AnalyzerService()

@app.post("/analyze")
async def analyze(request: AnalysisRequest, background_tasks: BackgroundTasks):
    return await analyzer.process_analysis(request)
