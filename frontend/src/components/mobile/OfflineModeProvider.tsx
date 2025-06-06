import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import {
  useOfflineMode,
  UseOfflineModeReturn,
  OfflineModeOptions,
  SyncResult
} from '../../hooks/useOfflineMode';

export interface OfflineData {
  id: string;
  type: 'ivr_form' | 'patient_data' | 'voice_recording' | 'file_upload';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastSyncAttempt?: number;
}

export interface OfflineModeContextType extends UseOfflineModeReturn {
  // Additional context-specific methods
  showOfflineStatus: boolean;
  setShowOfflineStatus: (show: boolean) => void;
  offlineIndicatorPosition: 'top' | 'bottom';
  setOfflineIndicatorPosition: (position: 'top' | 'bottom') => void;
}

const OfflineModeContext = createContext<OfflineModeContextType | null>(null);

export interface OfflineModeProviderProps {
  children: ReactNode;
  options?: OfflineModeOptions;
  showOfflineIndicator?: boolean;
  indicatorPosition?: 'top' | 'bottom';
  enableServiceWorker?: boolean;
}

export const OfflineModeProvider: React.FC<OfflineModeProviderProps> = ({
  children,
  options = {},
  showOfflineIndicator = true,
  indicatorPosition = 'top',
  enableServiceWorker = true
}) => {
  const [showOfflineStatus, setShowOfflineStatus] = useState(showOfflineIndicator);
  const [offlineIndicatorPosition, setOfflineIndicatorPosition] = useState(indicatorPosition);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // Enhanced options with context-specific defaults
  const enhancedOptions: OfflineModeOptions = {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    maxRetries: 3,
    enableToasts: true,
    onSyncComplete: (results: SyncResult[]) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`Sync completed: ${successCount} success, ${failCount} failed`);

      if (successCount > 0 && options.enableToasts !== false) {
        toast.success(`Synced ${successCount} items successfully`);
      }
    },
    onSyncError: (error: string) => {
      console.error('Sync error:', error);
      if (options.enableToasts !== false) {
        toast.error(`Sync failed: ${error}`);
      }
    },
    ...options
  };

  const offlineMode = useOfflineMode(enhancedOptions);

  // Register Service Worker
  useEffect(() => {
    if (enableServiceWorker && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, [enableServiceWorker]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);
      setServiceWorkerRegistered(true);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              toast.info(
                'App update available! Refresh to get the latest version.',
                {
                  autoClose: false,
                  closeOnClick: false,
                  draggable: false,
                  onClick: () => {
                    window.location.reload();
                  }
                }
              );
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_OFFLINE_DATA') {
          console.log('Service Worker requested sync');
          offlineMode.syncData();
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      if (options.enableToasts !== false) {
        toast.warning('Offline features may be limited');
      }
    }
  };

  // Context value with additional provider-specific methods
  const contextValue: OfflineModeContextType = {
    ...offlineMode,
    showOfflineStatus,
    setShowOfflineStatus,
    offlineIndicatorPosition,
    setOfflineIndicatorPosition
  };

  return (
    <OfflineModeContext.Provider value={contextValue}>
      {children}
      {showOfflineStatus && <OfflineStatusIndicator />}
    </OfflineModeContext.Provider>
  );
};

// Offline Status Indicator Component
const OfflineStatusIndicator: React.FC = () => {
  const context = useContext(OfflineModeContext);

  if (!context) {
    return null;
  }

  const {
    isOnline,
    isSyncing,
    syncStatus,
    syncData,
    offlineIndicatorPosition
  } = context;

  const handleSyncClick = () => {
    if (isOnline && !isSyncing) {
      syncData();
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSyncing) return 'bg-yellow-500';
    if (syncStatus.pendingCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📴';
    if (isSyncing) return '🔄';
    if (syncStatus.pendingCount > 0) return '⏳';
    return '✅';
  };

  const positionClasses = offlineIndicatorPosition === 'top'
    ? 'top-4 right-4'
    : 'bottom-4 right-4';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      <div
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-white text-sm
          ${getStatusColor()}
          ${isOnline && !isSyncing ? 'cursor-pointer hover:opacity-80' : ''}
          transition-all duration-200
        `}
        onClick={handleSyncClick}
        title={isOnline && !isSyncing ? 'Click to sync now' : undefined}
      >
        <span className={isSyncing ? 'animate-spin' : ''}>{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>

        {syncStatus.pendingCount > 0 && (
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
            {syncStatus.pendingCount}
          </span>
        )}
      </div>

      {/* Sync errors tooltip */}
      {syncStatus.syncErrors.length > 0 && (
        <div className="mt-2 bg-red-600 text-white text-xs p-2 rounded shadow-lg max-w-xs">
          <div className="font-semibold mb-1">Sync Errors:</div>
          {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
            <div key={index} className="truncate">{error}</div>
          ))}
          {syncStatus.syncErrors.length > 3 && (
            <div className="text-red-200">
              +{syncStatus.syncErrors.length - 3} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Hook to use the offline mode context
export const useOfflineModeContext = (): OfflineModeContextType => {
  const context = useContext(OfflineModeContext);

  if (!context) {
    throw new Error('useOfflineModeContext must be used within an OfflineModeProvider');
  }

  return context;
};

// Utility component for offline-aware forms
export interface OfflineFormWrapperProps {
  children: ReactNode;
  onSubmit: (data: any) => Promise<void>;
  formData: any;
  formType?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export const OfflineFormWrapper: React.FC<OfflineFormWrapperProps> = ({
  children,
  onSubmit,
  formData,
  formType = 'general',
  autoSave = true,
  autoSaveInterval = 10000 // 10 seconds
}) => {
  const { isOnline, saveOfflineData } = useOfflineModeContext();
  const [lastSaved, setLastSaved] = useState<number>(0);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !formData) return;

    const interval = setInterval(async () => {
      try {
        const dataString = JSON.stringify(formData);
        const lastSavedString = localStorage.getItem(`lastSaved_${formType}`);

        // Only save if data has changed
        if (dataString !== lastSavedString) {
          await saveOfflineData('IVR_FORMS', {
            ...formData,
            formType,
            autoSaved: true,
            timestamp: Date.now()
          });

          localStorage.setItem(`lastSaved_${formType}`, dataString);
          setLastSaved(Date.now());
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [formData, formType, autoSave, autoSaveInterval, saveOfflineData]);

  const handleSubmit = async (data: any) => {
    try {
      if (isOnline) {
        // Try to submit directly
        await onSubmit(data);
        toast.success('Form submitted successfully');
      } else {
        // Save for later sync
        await saveOfflineData('IVR_FORMS', {
          ...data,
          formType,
          submittedOffline: true,
          timestamp: Date.now()
        });
        toast.info('Form saved offline - will sync when connection is restored');
      }
    } catch (error) {
      console.error('Form submission failed:', error);

      // Save offline as fallback
      try {
        await saveOfflineData('IVR_FORMS', {
          ...data,
          formType,
          submissionFailed: true,
          timestamp: Date.now()
        });
        toast.warning('Submission failed - form saved offline for retry');
      } catch (saveError) {
        toast.error('Failed to save form data');
      }
    }
  };

  return (
    <div className="relative">
      {children}

      {/* Auto-save indicator */}
      {autoSave && lastSaved > 0 && (
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <span className="mr-1">💾</span>
          Auto-saved {new Date(lastSaved).toLocaleTimeString()}
        </div>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>Working Offline:</strong> Your data will be saved locally and
              synchronized when your connection is restored.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the context for direct access if needed
export { OfflineModeContext };

// Default export
export default OfflineModeProvider;