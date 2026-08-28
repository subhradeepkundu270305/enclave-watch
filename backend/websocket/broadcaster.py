"""WebSocket broadcaster — maintains a set of active connections.

One /ws endpoint; every new alert/event is broadcast to ALL connected clients.
Dead connections are silently pruned on send failure.
"""
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.connections.discard(ws)

    async def broadcast(self, payload: dict) -> None:
        dead: set[WebSocket] = set()
        tasks = []
        for ws in list(self.connections):
            tasks.append(self._send_safe(ws, payload, dead))
        if tasks:
            await asyncio.gather(*tasks)
        self.connections -= dead

    async def _send_safe(
        self, ws: WebSocket, payload: dict, dead: set[WebSocket]
    ) -> None:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)

    @property
    def count(self) -> int:
        return len(self.connections)


manager = ConnectionManager()
