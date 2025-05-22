/**
 * WebSocket client service for real-time communication.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting'
}

// WebSocket message types
export enum MessageType {
  NOTIFICATION = 'notification',
  STATUS = 'status',
  PING = 'ping',
  PONG = 'pong',
  ACK = 'ack',
  ERROR = 'error'
}

interface WebSocketMessage {
  type: MessageType;
  data?: any;
  message_id?: string;
}

interface WebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

const defaultConfig: WebSocketConfig = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  pingInterval: 30000
};

export const useWebSocket = (config: WebSocketConfig = defaultConfig) => {
  const { token } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const ws = useRef<WebSocket | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const messageHandlers = useRef<Map<MessageType, Function[]>>(new Map());
  
  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!token) return;
    
    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/${token}`;
      ws.current = new WebSocket(wsUrl);
      setConnectionState(ConnectionState.CONNECTING);
      
      ws.current.onopen = () => {
        setConnectionState(ConnectionState.CONNECTED);
        setReconnectAttempts(0);
        startPingInterval();
      };
      
      ws.current.onclose = () => {
        setConnectionState(ConnectionState.DISCONNECTED);
        clearPingInterval();
        handleReconnect();
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      handleReconnect();
    }
  }, [token]);
  
  // Handle reconnection
  const handleReconnect = useCallback(() => {
    if (
      reconnectAttempts < (config.maxReconnectAttempts || 5) &&
      connectionState !== ConnectionState.RECONNECTING
    ) {
      setConnectionState(ConnectionState.RECONNECTING);
      setReconnectAttempts((attempts) => attempts + 1);
      
      setTimeout(() => {
        connect();
      }, config.reconnectInterval);
    }
  }, [reconnectAttempts, connectionState, config, connect]);
  
  // Start ping interval
  const startPingInterval = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    
    pingInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: MessageType.PING }));
      }
    }, config.pingInterval);
  }, [config.pingInterval]);
  
  // Clear ping interval
  const clearPingInterval = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  }, []);
  
  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message);
    
    // Handle ping/pong
    if (message.type === MessageType.PING) {
      ws.current?.send(JSON.stringify({ type: MessageType.PONG }));
      return;
    }
    
    // Send acknowledgment for messages that require it
    if (message.message_id) {
      ws.current?.send(JSON.stringify({
        type: MessageType.ACK,
        message_id: message.message_id
      }));
    }
    
    // Call registered handlers for message type
    const handlers = messageHandlers.current.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }, []);
  
  // Subscribe to message type
  const subscribe = useCallback((type: MessageType, handler: Function) => {
    const handlers = messageHandlers.current.get(type) || [];
    messageHandlers.current.set(type, [...handlers, handler]);
    
    // Return unsubscribe function
    return () => {
      const handlers = messageHandlers.current.get(type) || [];
      messageHandlers.current.set(
        type,
        handlers.filter((h) => h !== handler)
      );
    };
  }, []);
  
  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  // Connect/disconnect effect
  useEffect(() => {
    connect();
    
    return () => {
      clearPingInterval();
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect, clearPingInterval]);
  
  return {
    connectionState,
    lastMessage,
    subscribe,
    sendMessage
  };
};

export default useWebSocket; 