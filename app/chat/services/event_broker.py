import asyncio
from kafka import KafkaAdminClient, KafkaProducer, KafkaConsumer
from kafka.admin import NewTopic
import json
from typing import Dict, Any, List

class EventBroker:
    def __init__(self):
        self.admin_client = KafkaAdminClient(bootstrap_servers=['localhost:9092'])
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        self.topics = [
            'python_analysis_queue',
            'r_analysis_queue',
            'julia_analysis_queue',
            'visualization_queue',
            'data_stream',
            'analysis_results'
        ]
        
        self.initialize_topics()

    def initialize_topics(self):
        existing_topics = set(self.admin_client.list_topics())
        new_topics = [
            NewTopic(name=topic, num_partitions=3, replication_factor=1)
            for topic in self.topics
            if topic not in existing_topics
        ]
        
        if new_topics:
            self.admin_client.create_topics(new_topics)

    async def publish_event(self, topic: str, message: Dict[str, Any]):
        self.producer.send(topic, message)

    async def subscribe_to_events(self, topics: List[str], callback):
        consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=['localhost:9092'],
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        for message in consumer:
            await callback(message.value)

event_broker = EventBroker()
