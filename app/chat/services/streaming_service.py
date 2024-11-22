from fastapi import FastAPI, WebSocket
import asyncio
from typing import Dict, Any
import json
from kafka import KafkaProducer
import aiofiles

app = FastAPI()

class StreamingService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        self.chunk_size = 1024 * 1024  # 1MB chunks

    async def stream_data(self, file_path: str, user_id: str):
        async with aiofiles.open(file_path, 'rb') as file:
            chunk_number = 0
            while True:
                chunk = await file.read(self.chunk_size)
                if not chunk:
                    break
                
                message = {
                    "user_id": user_id,
                    "chunk_number": chunk_number,
                    "data": chunk.decode('utf-8'),
                    "is_last": len(chunk) < self.chunk_size
                }
                
                self.producer.send('data_stream', message)
                chunk_number += 1

    async def handle_upload(self, file_path: str, user_id: str):
        await self.stream_data(file_path, user_id)
        return {"status": "completed", "chunks_processed": chunk_number}

streaming = StreamingService()

@app.post("/upload")
async def upload_file(file_path: str, user_id: str):
    return await streaming.handle_upload(file_path, user_id)
