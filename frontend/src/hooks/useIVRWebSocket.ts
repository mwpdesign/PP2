import { useEffect, useCallback, useState } from 'react';
import { useWebSocket, MessageType } from '../services/websocket';

export interface IVRStatusUpdate {
  ivr_id: string;
  status: string;
  timestamp: string;
  metadata?: {
    update_type?: string;
    previous_status?: string;
    new_status?: string;
    changed_by?: string;
    [key: string]: any;
  };
}

export interface UseIVRWebSocketOptions {
  ivrId?: string;
  onStatusUpdate?: (update: IVRStatusUpdate) => void;
  onCommunicationUpdate?: (update: any) => void;
  autoSubscribe?: boolean;
}

export const useIVRWebSocket = (options: UseIVRWebSocketOptions = {}) => {
  const { ivrId, onStatusUpdate, onCommunicationUpdate, autoSubscribe = true } = options;
  const { connectionState, subscribe, sendMessage } = useWebSocket();
  const [subscribedIVRs, setSubscribedIVRs] = useState<Set<string>>(new Set());

  // Subscribe to IVR status updates
  const subscribeToIVR = useCallback((targetIvrId: string) => {
    if (connectionState === 'connected') {
      const success = sendMessage({
        type: MessageType.SUBSCRIBE_IVR,
        data: { ivr_id: targetIvrId }
      });

      if (success) {
        setSubscribedIVRs(prev => new Set(prev).add(targetIvrId));
        console.log(`Subscribed to IVR updates: ${targetIvrId}`);
      }

      return success;
    }
    return false;
  }, [connectionState, sendMessage]);

  // Unsubscribe from IVR updates
  const unsubscribeFromIVR = useCallback((targetIvrId: string) => {
    if (connectionState === 'connected') {
      const success = sendMessage({
        type: MessageType.UNSUBSCRIBE_IVR,
        data: { ivr_id: targetIvrId }
      });

      if (success) {
        setSubscribedIVRs(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetIvrId);
          return newSet;
        });
        console.log(`Unsubscribed from IVR updates: ${targetIvrId}`);
      }

      return success;
    }
    return false;
  }, [connectionState, sendMessage]);

  // Auto-subscribe to provided IVR ID
  useEffect(() => {
    if (autoSubscribe && ivrId && connectionState === 'connected') {
      subscribeToIVR(ivrId);
    }

    return () => {
      if (autoSubscribe && ivrId) {
        unsubscribeFromIVR(ivrId);
      }
    };
  }, [ivrId, connectionState, autoSubscribe, subscribeToIVR, unsubscribeFromIVR]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribeStatusUpdate = subscribe(
      MessageType.IVR_STATUS_UPDATE,
      (data: IVRStatusUpdate) => {
        console.log('Received IVR status update:', data);
        if (onStatusUpdate) {
          onStatusUpdate(data);
        }
      }
    );

    const unsubscribeCommunication = subscribe(
      MessageType.IVR_STATUS_UPDATE,
      (data: any) => {
        if (data.metadata?.update_type === 'communication_added' && onCommunicationUpdate) {
          onCommunicationUpdate(data);
        }
      }
    );

    const unsubscribeSubscribed = subscribe(
      MessageType.IVR_SUBSCRIBED,
      (data: { ivr_id: string }) => {
        console.log(`Successfully subscribed to IVR: ${data.ivr_id}`);
      }
    );

    const unsubscribeUnsubscribed = subscribe(
      MessageType.IVR_UNSUBSCRIBED,
      (data: { ivr_id: string }) => {
        console.log(`Successfully unsubscribed from IVR: ${data.ivr_id}`);
      }
    );

    return () => {
      unsubscribeStatusUpdate();
      unsubscribeCommunication();
      unsubscribeSubscribed();
      unsubscribeUnsubscribed();
    };
  }, [subscribe, onStatusUpdate, onCommunicationUpdate]);

  return {
    connectionState,
    subscribedIVRs: Array.from(subscribedIVRs),
    subscribeToIVR,
    unsubscribeFromIVR,
    isSubscribed: (targetIvrId: string) => subscribedIVRs.has(targetIvrId),
  };
};