from fastapi import FastAPI, WebSocket
from typing import Dict, List
import asyncio
import json
from kafka import KafkaConsumer

app = FastAPI()

class VisualizationService:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.consumer = KafkaConsumer(
            'visualization_queue',
            bootstrap_servers=['localhost:9092'],
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )

    async def register(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def process_visualization(self, data: dict):
        user_id = data.get('user_id')
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(data)
            except:
                await self.disconnect(user_id)

    async def start_consumer(self):
        for message in self.consumer:
            await self.process_visualization(message.value)

viz_service = VisualizationService()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await viz_service.register(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        await viz_service.disconnect(user_id)
