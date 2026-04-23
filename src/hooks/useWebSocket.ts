import { useState, useEffect, useCallback, useRef } from 'react';

export interface SensorData {
  fsr_front_left: number;
  fsr_front_mid: number;
  fsr_front_right: number;
  fsr_mid_left: number;
  fsr_mid_mid: number;
  fsr_mid_right: number;
  fsr_back_left: number;
  fsr_back_mid: number;
  fsr_back_right: number;
  temperature: number;
}

export interface PostureMessage {
  type?: string;
  posture: string;
  sensors: SensorData;
  confidence: number;
  person_detected: boolean;
  alert_sent: boolean;
  timestamp: number;
}

export const useWebSocket = (defaultUrl: string) => {
  const [url, setUrl] = useState(defaultUrl || localStorage.getItem('deviceUrl') || 'ws://localhost:8765');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<PostureMessage | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [latency, setLatency] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const lastMsgTs = useRef<number>(0);

  const connect = useCallback(() => {
    if (ws.current) return;
    
    setStatus('connecting');
    localStorage.setItem('deviceUrl', url);
    
    try {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        setStatus('connected');
        setSessionStartTime(Date.now());
        setMsgCount(0);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;
          
          setLastMessage(data);
          setMsgCount((prev) => prev + 1);
          
          const now = Date.now();
          if (lastMsgTs.current) {
            setLatency(now - lastMsgTs.current);
          }
          lastMsgTs.current = now;
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };
      
      socket.onerror = () => {
        setStatus('error');
      };
      
      socket.onclose = () => {
        ws.current = null;
        setStatus('disconnected');
        setSessionStartTime(null);
      };
      
      ws.current = socket;
    } catch (e) {
      setStatus('error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
  }, []);

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
    sessionStartTime,
    connect,
    disconnect
  };
};
