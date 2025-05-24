/**
 * WebSocket client service for real-time communication.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  AUTHENTICATION_FAILED = 'authentication_failed'
}

// WebSocket message types
export enum MessageType {
  NOTIFICATION = 'notification',
  STATUS = 'status',
  STATUS_UPDATE = 'status_update',
  DASHBOARD_UPDATE = 'dashboard_update',
  PING = 'ping',
  PONG = 'pong',
  ACK = 'ack',
  ERROR = 'error',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  IVR_STATUS = 'ivr_status',
  AUTH_ERROR = 'auth_error'
}

export interface WebSocketMessage {
  type: MessageType;
  data?: any;
  message_id?: string;
}

export interface WebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  baseUrl?: string;
}

const defaultConfig: WebSocketConfig = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  pingInterval: 30000,
  baseUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws'
};

export interface WebSocketHook {
  connectionState: ConnectionState;
  lastMessage: WebSocketMessage | null;
  subscribe: (messageType: MessageType, callback: (data: any) => void) => () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  connect: () => void;
  disconnect: () => void;
}

interface Subscriber {
  messageType: MessageType;
  callback: (data: any) => void;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay = 1000;
  private subscribers: Set<Subscriber> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private config: WebSocketConfig;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();

  constructor(config: WebSocketConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
    this.maxReconnectAttempts = this.config.maxReconnectAttempts || 5;
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.stateChangeCallbacks.forEach(callback => callback(state));
  }

  onStateChange(callback: (state: ConnectionState) => void) {
    this.stateChangeCallbacks.add(callback);
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  connect(getToken: () => string | null) {
    // Skip if already connected or connecting
    if (this.socket?.readyState === WebSocket.OPEN || 
        this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('WebSocket: No authentication token available, skipping connection');
      this.setConnectionState(ConnectionState.AUTHENTICATION_FAILED);
      return;
    }

    try {
      this.setConnectionState(ConnectionState.CONNECTING);
      this.socket = new WebSocket(`${this.config.baseUrl}?token=${token}`);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPingInterval();
        this.setConnectionState(ConnectionState.CONNECTED);
        this.notifySubscribers({ type: MessageType.CONNECTED });
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.clearPingInterval();
        
        // Check if closure was due to authentication failure
        if (event.code === 1008 || event.code === 4001) {
          this.setConnectionState(ConnectionState.AUTHENTICATION_FAILED);
          this.notifySubscribers({ 
            type: MessageType.AUTH_ERROR,
            data: { message: 'Authentication failed' }
          });
          return; // Don't attempt reconnect on auth failure
        }

        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.notifySubscribers({ type: MessageType.DISCONNECTED });
        this.handleReconnect(getToken);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifySubscribers({ 
          type: MessageType.ERROR,
          data: { message: 'Connection error occurred' }
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle authentication errors from server
          if (message.type === MessageType.AUTH_ERROR) {
            this.setConnectionState(ConnectionState.AUTHENTICATION_FAILED);
            return;
          }
          
          this.notifySubscribers(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.handleReconnect(getToken);
    }
  }

  private handleReconnect(getToken: () => string | null) {
    if (this.connectionState === ConnectionState.AUTHENTICATION_FAILED) {
      return; // Don't attempt reconnect if auth failed
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      this.setConnectionState(ConnectionState.RECONNECTING);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(getToken);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.setConnectionState(ConnectionState.DISCONNECTED);
    }
  }

  private startPingInterval() {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.send({ type: MessageType.PING });
      }
    }, this.config.pingInterval);
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  subscribe(messageType: MessageType, callback: (data: any) => void): () => void {
    const subscriber: Subscriber = { messageType, callback };
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(message: WebSocketMessage) {
    this.subscribers.forEach(subscriber => {
      if (subscriber.messageType === message.type) {
        try {
          subscriber.callback(message.data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      }
    });
  }

  disconnect() {
    this.clearPingInterval();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscribers.clear();
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  send(message: WebSocketMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, message not sent');
      return false;
    }
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Hook for using WebSocket in components
export const useWebSocket = (config: WebSocketConfig = defaultConfig): WebSocketHook => {
  const { getToken, isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = config === defaultConfig ? websocketService : new WebSocketService(config);
    }

    const ws = wsRef.current;

    // Only connect if authenticated
    if (isAuthenticated) {
      ws.connect(getToken);
    }

    // Subscribe to connection state changes
    const unsubscribeState = ws.onStateChange(setConnectionState);

    return () => {
      unsubscribeState();
      if (wsRef.current && config !== defaultConfig) {
        wsRef.current.disconnect();
      }
    };
  }, [config, getToken, isAuthenticated]);

  const connect = useCallback(() => {
    if (isAuthenticated && wsRef.current) {
      wsRef.current.connect(getToken);
    }
  }, [getToken, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  const subscribe = useCallback((messageType: MessageType, callback: (data: any) => void) => {
    return wsRef.current?.subscribe(messageType, callback) || (() => {});
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    return wsRef.current?.send(message) || false;
  }, []);

  return {
    connectionState,
    lastMessage,
    subscribe,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket; 