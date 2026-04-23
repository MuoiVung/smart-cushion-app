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

export const useWebSocket = (defaultUrl?: string) => {
  const [url, setUrl] = useState<string>(
    defaultUrl || localStorage.getItem('fogWsUrl') || ''
  );
  const [status,      setStatus]      = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<FogRealtimeUpdate | null>(null);
  const [msgCount,    setMsgCount]    = useState(0);
  const [latency,     setLatency]     = useState(0);
  const [error,       setError]       = useState<string | null>(null);

  const ws          = useRef<WebSocket | null>(null);
  const lastMsgTs   = useRef<number>(0);

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback((overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl) {
      setError("No connection URL available. Please try searching first.");
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN)  return;
    if (ws.current?.readyState === WebSocket.CONNECTING) return;

    setStatus('connecting');
    setError(null);
    localStorage.setItem('fogWsUrl', targetUrl);

    try {
      const socket = new WebSocket(targetUrl);

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
    ws.current?.close(1000, 'User disconnected');
    ws.current = null;
    setStatus('disconnected');
    setError(null);
  }, []);

  // ── Discovery ────────────────────────────────────────────────────────────
  const discover = useCallback(async () => {
    const firebaseBaseUrl = import.meta.env.VITE_FIREBASE_DISCOVERY_URL;
    if (!firebaseBaseUrl) {
      setError('Firebase Discovery URL not configured');
      return;
    }

    setStatus('connecting'); // Show scanning state
    setError(null);

    try {
      // 1. Fetch metadata from Firebase
      const response = await fetch(`${firebaseBaseUrl.replace(/\/$/, '')}/devices/cushion-01.json`);
      if (!response.ok) throw new Error('Failed to fetch from Firebase');
      
      const data = await response.json();
      if (!data || !data.local_ip) throw new Error('No Fog Node found on Cloud');

      // 2. Fetch our own public IP to see if we are in the same network
      let isSameNetwork = false;
      try {
        const myIpRes = await fetch('https://api.ipify.org?format=json');
        const myIpData = await myIpRes.json();
        isSameNetwork = (data.public_ip === myIpData.ip);
      } catch (e) {
        console.warn('Discovery: Could not verify public IP, assuming local.');
      }

      // 3. Smart URL Selection
      let localWsUrl = "";
      
      if (data.local_ip.startsWith('ws://') || data.local_ip.startsWith('wss://')) {
        // If Firebase already provides a full URL (like Ngrok), use it directly
        localWsUrl = data.local_ip;
      } else {
        // If it's just an IP, we prioritize localhost if on same machine
        let targetIp = data.local_ip;
        if (isSameNetwork && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          targetIp = 'localhost';
        }
        localWsUrl = `ws://${targetIp}:8765`;
      }

      console.log('Discovery: Connecting to:', localWsUrl);
      setUrl(localWsUrl);
      return localWsUrl;

    } catch (err: any) {
      if (err.message === 'No Fog Node found on Cloud') {
        setError('Smart Cushion not detected. Please ensure the Fog Launcher is running and Start Services is pressed.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot reach Smart Cushion. Please check your internet connection or Fog Node status.');
      } else {
        setError('Smart Cushion connection failed. If using local connection, ensure you are on the same Wi-Fi.');
      }
      setStatus('error');
      return null;
    }
  }, [setUrl]);


  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (ws.current) ws.current.close();
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
    discover,
  };
};
