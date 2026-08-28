import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { WS_URL } from "../lib/api";

type Callback = (data: any) => void;
type Subscriptions = Map<string, Set<Callback>>;

interface SocketContextValue {
  connected: boolean;
  subscribe: (eventType: string, cb: Callback) => () => void;
}

const SocketContext = createContext<SocketContextValue>({
  connected: false,
  subscribe: () => () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subsRef = useRef<Subscriptions>(new Map());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const type: string = msg.type ?? "unknown";
        const handlers = subsRef.current.get(type);
        if (handlers) handlers.forEach((cb) => cb(msg));
        // Also fire "*" catch-all subscribers
        const all = subsRef.current.get("*");
        if (all) all.forEach((cb) => cb(msg));
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((eventType: string, cb: Callback) => {
    const map = subsRef.current;
    if (!map.has(eventType)) map.set(eventType, new Set());
    map.get(eventType)!.add(cb);
    return () => map.get(eventType)?.delete(cb);
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
