import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import {
  IVRRequest,
  IVRStatus,
  IVRStatusHistory,
} from '../../types/ivr';
import { websocketService, MessageType } from '../../services/websocket';

interface StatusTrackingProps {
  ivrId: string;
  initialStatus?: IVRStatus;
  initialHistory?: IVRStatusHistory[];
}

const statusSteps = [
  { status: IVRStatus.SUBMITTED, label: 'Submitted' },
  { status: IVRStatus.IN_REVIEW, label: 'In Review' },
  { status: IVRStatus.PENDING_APPROVAL, label: 'Pending Approval' },
  { status: IVRStatus.APPROVED, label: 'Approved' },
];

const StatusTracking: React.FC<StatusTrackingProps> = ({
  ivrId,
  initialStatus,
  initialHistory = [],
}) => {
  const [currentStatus, setCurrentStatus] = useState<IVRStatus>(
    initialStatus || IVRStatus.SUBMITTED
  );
  const [statusHistory, setStatusHistory] = useState<IVRStatusHistory[]>(initialHistory);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to WebSocket updates
    const unsubscribeStatus = websocketService.subscribe(
      MessageType.IVR_STATUS,
      (data: { status: IVRStatus; statusHistory: IVRStatusHistory[]; ivrId: string }) => {
        if (data.ivrId === ivrId) {
          setCurrentStatus(data.status);
          setStatusHistory(data.statusHistory);
        }
      }
    );

    // Subscribe to connection status
    const unsubscribeConnection = websocketService.subscribe(MessageType.CONNECTED, () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnection = websocketService.subscribe(MessageType.DISCONNECTED, () => {
      setIsConnected(false);
      toast.warning('Lost connection to status updates');
    });

    return () => {
      unsubscribeStatus();
      unsubscribeConnection();
      unsubscribeDisconnection();
    };
  }, [ivrId]);

  const getCurrentStep = () => {
    return statusSteps.findIndex((step) => step.status === currentStatus);
  };

  const getStatusColor = (status: IVRStatus) => {
    switch (status) {
      case IVRStatus.SUBMITTED:
        return 'bg-blue-500';
      case IVRStatus.IN_REVIEW:
        return 'bg-yellow-500';
      case IVRStatus.PENDING_APPROVAL:
        return 'bg-purple-500';
      case IVRStatus.APPROVED:
        return 'bg-green-500';
      case IVRStatus.REJECTED:
        return 'bg-red-500';
      case IVRStatus.ESCALATED:
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Status updates disconnected. Attempting to reconnect...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          {statusSteps.map((step, index) => {
            const isActive = getCurrentStep() >= index;
            return (
              <div
                key={step.status}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  isActive ? getStatusColor(step.status) : 'bg-gray-300'
                }`}
                style={{ width: `${100 / statusSteps.length}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          {statusSteps.map((step, index) => {
            const isActive = getCurrentStep() >= index;
            const isCurrent = getCurrentStep() === index;
            return (
              <div
                key={step.status}
                className={`text-xs font-semibold ${
                  isActive ? 'text-gray-700' : 'text-gray-400'
                }`}
                style={{ width: `${100 / statusSteps.length}%` }}
              >
                <div
                  className={`h-6 w-6 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    isActive ? getStatusColor(step.status) : 'bg-gray-300'
                  }`}
                >
                  {isCurrent ? (
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
                  ) : null}
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    {isActive ? (
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <circle cx="10" cy="10" r="3" />
                    )}
                  </svg>
                </div>
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="flow-root">
        <ul className="-mb-8">
          {statusHistory.map((history, index) => {
            const isLast = index === 0;
            return (
              <li key={history.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(
                          history.toStatus
                        )}`}
                      >
                        <svg
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Status changed to{' '}
                          <span className="font-medium text-gray-900">
                            {history.toStatus.replace('_', ' ')}
                          </span>
                          {history.reason && (
                            <span className="text-gray-500"> - {history.reason}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={history.createdAt}>
                          {format(new Date(history.createdAt), 'MMM d, yyyy HH:mm')}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default StatusTracking; 