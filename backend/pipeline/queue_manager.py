"""asyncio.Queue wrapper — simulates the Kafka streaming layer.

In production this would be replaced by a Kafka consumer/producer.
"""
import asyncio
from models import NetworkEvent


class EventQueue:
    """Single async queue that all generated events flow through."""

    def __init__(self, maxsize: int = 10_000):
        self._q: asyncio.Queue[NetworkEvent] = asyncio.Queue(maxsize=maxsize)

    async def put(self, event: NetworkEvent) -> None:
        await self._q.put(event)

    async def get(self) -> NetworkEvent:
        return await self._q.get()

    def task_done(self) -> None:
        self._q.task_done()

    def qsize(self) -> int:
        return self._q.qsize()

    def empty(self) -> bool:
        return self._q.empty()


# Singleton shared across the app
event_queue = EventQueue()
