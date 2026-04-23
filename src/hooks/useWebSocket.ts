import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types — matches system_architecture.md Interface 02 (Fog → Local App)
// ---------------------------------------------------------------------------

export type OccupancyState = 'occupied' | 'empty' | 'uncertain';
export type AlertStatus    = 'IDLE' | 'WARNING' | 'COOLDOWN';
export type PostureLabel   = 'NUP' | 'LF' | 'LB' | 'LFSR' | 'LFSL'
                           | 'CRL' | 'CLL' | 'CRLL' | 'CLLL' | 'EMPTY' | 'OBJECT';

export interface FogRealtimeUpdate {
  record_type:            'realtime_update';
  device_id:              string;
  session_id:             string;
  session_start_time_iso: string;   // ISO 8601 UTC
  occupancy_state:        OccupancyState;
  posture:                PostureLabel;
  temperature:            number;
  alert_active:           boolean;
  alert_status:           AlertStatus;
  alert_count:            number;
  session_duration_sec:   number;
  sensors_heatmap_pct:    number[]; // 9 values [0–100], order: FL FM FR ML MM MR BL BM BR
}

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ---------------------------------------------------------------------------
// useWebSocket hook
// ---------------------------------------------------------------------------

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765';

export const useWebSocket = (defaultUrl?: string) => {
  const [url, setUrl] = useState<string>(
    defaultUrl || localStorage.getItem('fogWsUrl') || DEFAULT_WS_URL
  );
  const [status,      setStatus]      = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<FogRealtimeUpdate | null>(null);
  const [msgCount,    setMsgCount]    = useState(0);
  const [latency,     setLatency]     = useState(0);
  const [error,       setError]       = useState<string | null>(null);

  const ws          = useRef<WebSocket | null>(null);
  const lastMsgTs   = useRef<number>(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN)  return;
    if (ws.current?.readyState === WebSocket.CONNECTING) return;

    // Cancel any pending auto-reconnect
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    setStatus('connecting');
    setError(null);
    localStorage.setItem('fogWsUrl', url);

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setStatus('connected');
        setMsgCount(0);
        lastMsgTs.current = 0;
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);

          // Ignore the Fog Node's welcome handshake message
          if (data.type === 'connected') return;

          // Expect Interface 02 payload
          if (data.record_type !== 'realtime_update') return;

          const msg = data as FogRealtimeUpdate;
          setLastMessage(msg);
          setMsgCount((prev) => prev + 1);

          const now = Date.now();
          if (lastMsgTs.current > 0) {
            setLatency(now - lastMsgTs.current);
          }
          lastMsgTs.current = now;
        } catch (e) {
          console.error('[useWebSocket] Failed to parse message:', e);
        }
      };

      socket.onerror = () => {
        setStatus('error');
        setError(`Cannot connect to ${url}`);
      };

      socket.onclose = (event) => {
        ws.current = null;
        if (event.wasClean) {
          setStatus('disconnected');
        } else {
          setStatus('error');
          setError(`Connection lost (code ${event.code})`);
        }
      };

      ws.current = socket;
    } catch (e) {
      setStatus('error');
      setError(`Invalid WebSocket URL: ${url}`);
    }
  }, [url]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    ws.current?.close(1000, 'User disconnected');
    ws.current = null;
    setStatus('disconnected');
    setError(null);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  return {
    url,
    setUrl,
    status,
    lastMessage,
    msgCount,
    latency,
    error,
    connect,
    disconnect,
  };
};
