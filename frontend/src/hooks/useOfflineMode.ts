import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

// IndexedDB configuration
const DB_NAME = 'HealthcareIVROffline';
const DB_VERSION = 1;
const STORES = {
  IVR_FORMS: 'ivrForms',
  PATIENT_DATA: 'patientData',
  VOICE_RECORDINGS: 'voiceRecordings',
  FILE_UPLOADS: 'fileUploads',
  SYNC_QUEUE: 'syncQueue'
} as const;

export interface OfflineData {
  id: string;
  type: keyof typeof STORES;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncErrors: string[];
}

export interface OfflineModeOptions {
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  enableToasts?: boolean;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncError?: (error: string) => void;
}

export interface SyncResult {
  id: string;
  type: string;
  success: boolean;
  error?: string;
}

export interface UseOfflineModeReturn {
  // Status
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;

  // Data operations
  saveOfflineData: (type: keyof typeof STORES, data: any, id?: string) => Promise<string>;
  getOfflineData: (type: keyof typeof STORES, id?: string) => Promise<any>;
  deleteOfflineData: (type: keyof typeof STORES, id: string) => Promise<void>;
  getAllOfflineData: (type: keyof typeof STORES) => Promise<OfflineData[]>;

  // Sync operations
  syncData: () => Promise<SyncResult[]>;
  clearSyncQueue: () => Promise<void>;
  retryFailedSync: () => Promise<SyncResult[]>;

  // Utilities
  isDataAvailableOffline: (type: keyof typeof STORES, id: string) => Promise<boolean>;
  getOfflineStorageSize: () => Promise<number>;
  clearOfflineStorage: () => Promise<void>;
}

export function useOfflineMode(options: OfflineModeOptions = {}): UseOfflineModeReturn {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    maxRetries = 3,
    enableToasts = true,
    onSyncComplete,
    onSyncError
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncErrors: []
  });

  const dbRef = useRef<IDBDatabase | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize IndexedDB
  const initDB = useCallback(async (): Promise<IDBDatabase> => {
    if (dbRef.current) {
      return dbRef.current;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        dbRef.current = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        });
      };
    });
  }, []);

  // Save data offline
  const saveOfflineData = useCallback(async (
    type: keyof typeof STORES,
    data: any,
    id?: string
  ): Promise<string> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORES[type]], 'readwrite');
      const store = transaction.objectStore(STORES[type]);

      const offlineData: OfflineData = {
        id: id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(offlineData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Update pending count
      updateSyncStatus();

      if (enableToasts) {
        toast.info(`Data saved offline (${type})`);
      }

      return offlineData.id;
    } catch (error) {
      console.error('Failed to save offline data:', error);
      if (enableToasts) {
        toast.error('Failed to save data offline');
      }
      throw error;
    }
  }, [initDB, enableToasts]);

  // Get offline data
  const getOfflineData = useCallback(async (
    type: keyof typeof STORES,
    id?: string
  ): Promise<any> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORES[type]], 'readonly');
      const store = transaction.objectStore(STORES[type]);

      if (id) {
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => {
            resolve(request.result?.data || null);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            resolve(request.result.map(item => item.data));
          };
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }, [initDB]);

  // Delete offline data
  const deleteOfflineData = useCallback(async (
    type: keyof typeof STORES,
    id: string
  ): Promise<void> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORES[type]], 'readwrite');
      const store = transaction.objectStore(STORES[type]);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      updateSyncStatus();
    } catch (error) {
      console.error('Failed to delete offline data:', error);
      throw error;
    }
  }, [initDB]);

  // Get all offline data for a type
  const getAllOfflineData = useCallback(async (
    type: keyof typeof STORES
  ): Promise<OfflineData[]> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORES[type]], 'readonly');
      const store = transaction.objectStore(STORES[type]);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get all offline data:', error);
      return [];
    }
  }, [initDB]);

  // Sync data to server
  const syncData = useCallback(async (): Promise<SyncResult[]> => {
    if (!isOnline || isSyncing) {
      return [];
    }

    setIsSyncing(true);
    const results: SyncResult[] = [];

    try {
      const db = await initDB();

      // Get all unsynced data from all stores
      for (const [storeKey, storeName] of Object.entries(STORES)) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('synced');

        const unsyncedData = await new Promise<OfflineData[]>((resolve, reject) => {
          const request = index.getAll(false);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        // Sync each item
        for (const item of unsyncedData) {
          try {
            const success = await syncSingleItem(item);

            if (success) {
              // Mark as synced
              item.synced = true;
              item.retryCount = 0;
              delete item.lastError;

              await new Promise<void>((resolve, reject) => {
                const updateRequest = store.put(item);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
              });

              results.push({
                id: item.id,
                type: item.type,
                success: true
              });
            } else {
              throw new Error('Sync failed');
            }
          } catch (error) {
            // Update retry count and error
            item.retryCount = (item.retryCount || 0) + 1;
            item.lastError = error instanceof Error ? error.message : 'Unknown error';

            // Remove if max retries exceeded
            if (item.retryCount >= maxRetries) {
              await new Promise<void>((resolve, reject) => {
                const deleteRequest = store.delete(item.id);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });

              if (enableToasts) {
                toast.error(`Failed to sync ${item.type} after ${maxRetries} attempts`);
              }
            } else {
              await new Promise<void>((resolve, reject) => {
                const updateRequest = store.put(item);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
              });
            }

            results.push({
              id: item.id,
              type: item.type,
              success: false,
              error: item.lastError
            });
          }
        }
      }

      updateSyncStatus();

      if (enableToasts && results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
          toast.success(`Synced ${successCount} items successfully`);
        }
        if (failCount > 0) {
          toast.warning(`Failed to sync ${failCount} items`);
        }
      }

      onSyncComplete?.(results);

    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      if (enableToasts) {
        toast.error(`Sync failed: ${errorMessage}`);
      }

      onSyncError?.(errorMessage);
    } finally {
      setIsSyncing(false);
    }

    return results;
  }, [isOnline, isSyncing, initDB, maxRetries, enableToasts, onSyncComplete, onSyncError]);

  // Sync a single item to the server
  const syncSingleItem = async (item: OfflineData): Promise<boolean> => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body: any = item.data;

      // Determine API endpoint based on data type
      switch (item.type) {
        case 'IVR_FORMS':
          endpoint = '/api/ivr/submit';
          break;
        case 'PATIENT_DATA':
          endpoint = '/api/patients';
          method = item.data.id ? 'PUT' : 'POST';
          if (item.data.id) {
            endpoint += `/${item.data.id}`;
          }
          break;
        case 'VOICE_RECORDINGS':
          endpoint = '/api/voice/upload';
          // Convert to FormData for file upload
          const formData = new FormData();
          if (item.data.audioBlob) {
            formData.append('audio', item.data.audioBlob, 'recording.wav');
          }
          formData.append('transcript', item.data.transcript || '');
          formData.append('metadata', JSON.stringify(item.data.metadata || {}));
          body = formData;
          break;
        case 'FILE_UPLOADS':
          endpoint = '/api/upload';
          // Handle file uploads
          const fileFormData = new FormData();
          if (item.data.file) {
            // Convert base64 back to file if needed
            if (typeof item.data.file === 'string') {
              const byteCharacters = atob(item.data.file.split(',')[1]);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: item.data.mimeType });
              fileFormData.append('file', blob, item.data.fileName);
            } else {
              fileFormData.append('file', item.data.file);
            }
          }
          body = fileFormData;
          break;
        default:
          throw new Error(`Unknown data type: ${item.type}`);
      }

      const response = await fetch(endpoint, {
        method,
        headers: body instanceof FormData ? {} : {
          'Content-Type': 'application/json',
        },
        body: body instanceof FormData ? body : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to sync item:', error);
      return false;
    }
  };

  // Clear sync queue
  const clearSyncQueue = useCallback(async (): Promise<void> => {
    try {
      const db = await initDB();

      for (const storeName of Object.values(STORES)) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      updateSyncStatus();

      if (enableToasts) {
        toast.info('Offline data cleared');
      }
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      if (enableToasts) {
        toast.error('Failed to clear offline data');
      }
    }
  }, [initDB, enableToasts]);

  // Retry failed sync
  const retryFailedSync = useCallback(async (): Promise<SyncResult[]> => {
    return syncData();
  }, [syncData]);

  // Check if data is available offline
  const isDataAvailableOffline = useCallback(async (
    type: keyof typeof STORES,
    id: string
  ): Promise<boolean> => {
    try {
      const data = await getOfflineData(type, id);
      return data !== null;
    } catch {
      return false;
    }
  }, [getOfflineData]);

  // Get offline storage size
  const getOfflineStorageSize = useCallback(async (): Promise<number> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  // Clear offline storage
  const clearOfflineStorage = useCallback(async (): Promise<void> => {
    try {
      await clearSyncQueue();

      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }

      // Delete the database
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      if (enableToasts) {
        toast.success('Offline storage cleared');
      }
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
      if (enableToasts) {
        toast.error('Failed to clear offline storage');
      }
    }
  }, [clearSyncQueue, enableToasts]);

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const db = await initDB();
      let pendingCount = 0;
      const syncErrors: string[] = [];

      for (const storeName of Object.values(STORES)) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('synced');

        const unsynced = await new Promise<OfflineData[]>((resolve, reject) => {
          const request = index.getAll(false);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        pendingCount += unsynced.length;

        // Collect errors
        unsynced.forEach(item => {
          if (item.lastError) {
            syncErrors.push(`${item.type}: ${item.lastError}`);
          }
        });
      }

      setSyncStatus(prev => ({
        ...prev,
        isOnline,
        isSyncing,
        pendingCount,
        syncErrors: syncErrors.slice(0, 10) // Limit to 10 errors
      }));
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }, [initDB, isOnline, isSyncing]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (enableToasts) {
        toast.success('Connection restored');
      }
      if (autoSync) {
        syncData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (enableToasts) {
        toast.warning('Working offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, enableToasts, syncData]);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && isOnline && syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        syncData();
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [autoSync, isOnline, syncInterval, syncData]);

  // Initialize and update status
  useEffect(() => {
    initDB().then(() => {
      updateSyncStatus();
    });
  }, [initDB, updateSyncStatus]);

  // Service Worker message handling
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_OFFLINE_DATA') {
        syncData();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [syncData]);

  return {
    // Status
    isOnline,
    isSyncing,
    syncStatus,

    // Data operations
    saveOfflineData,
    getOfflineData,
    deleteOfflineData,
    getAllOfflineData,

    // Sync operations
    syncData,
    clearSyncQueue,
    retryFailedSync,

    // Utilities
    isDataAvailableOffline,
    getOfflineStorageSize,
    clearOfflineStorage
  };
}