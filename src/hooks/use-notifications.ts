import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 
  (typeof window !== "undefined" 
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
    : "");

const WS_PATH = "/ws/notifications";
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
const POLLING_INTERVAL = 30_000;

interface UseNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: any) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, onNotification } = options;
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<"websocket" | "polling">("polling");
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const getToken = useCallback(() => localStorage.getItem("sp_token"), []);

  const invalidateNotifications = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["notification-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-drawer"] });
    qc.invalidateQueries({ queryKey: ["notifications-page"] });
  }, [qc]);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || !enabled) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const url = `${WS_BASE}${WS_PATH}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        setConnected(true);
        setTransport("websocket");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.event) {
            case "notification:new":
              invalidateNotifications();
              if (msg.data?.title) {
                toast.info(msg.data.title, {
                  description: msg.data.body,
                  duration: 5000,
                });
              }
              onNotificationRef.current?.(msg.data);
              break;

            case "notification:count":
              qc.setQueryData(["notification-count"], { count: msg.data.count });
              break;

            case "pong":
              break;

            default:
              break;
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        setTransport("polling");
        wsRef.current = null;

        // Don't reconnect if intentionally closed or auth failed
        if (event.code === 4001 || event.code === 1000) return;

        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // Will trigger onclose, which handles reconnection
      };

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: "ping" }));
        }
      }, 25000);

      ws.addEventListener("close", () => clearInterval(heartbeat));
    } catch {
      // WebSocket not supported or blocked — fall back to polling
      setTransport("polling");
    }
  }, [enabled, getToken, invalidateNotifications, qc]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    setConnected(false);
    setTransport("polling");
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  // Polling fallback: refetch when WS is not connected
  useEffect(() => {
    if (connected || !enabled) return;

    const interval = setInterval(() => {
      invalidateNotifications();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [connected, enabled, invalidateNotifications]);

  // Reconnect when token changes (login/logout)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sp_token") {
        if (e.newValue) {
          disconnect();
          setTimeout(connect, 100);
        } else {
          disconnect();
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [connect, disconnect]);

  return { connected, transport, disconnect, reconnect: connect };
}
