import { IVRTracking, IVRStatus } from '../types/ivr';

/**
 * Generates a unique IVR ID in the format IVR-{YYYYMMDD}-{6-digit-random}
 */
export const generateIVRId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `IVR-${dateStr}-${random}`;
};

/**
 * Creates initial tracking data for a new IVR request
 */
export const createInitialTracking = (userId: string): IVRTracking => {
  const now = new Date().toISOString();
  const ivrId = generateIVRId();

  return {
    id: ivrId,
    createdBy: userId,
    createdAt: now,
    lastUpdatedAt: now,
    lastUpdatedBy: userId,
    status: IVRStatus.DRAFT,
    statusHistory: [
      {
        status: IVRStatus.DRAFT,
        timestamp: now,
        updatedBy: userId,
        notes: 'IVR request created'
      }
    ]
  };
};

/**
 * Updates the lastSaved timestamp in the tracking data
 */
export const updateTrackingTimestamp = (tracking: IVRTracking): IVRTracking => {
  return {
    ...tracking,
    lastUpdatedAt: new Date().toISOString()
  };
};

/**
 * Updates the status of an IVR request
 */
export const updateIVRStatus = (
  tracking: IVRTracking,
  newStatus: IVRStatus,
  userId: string,
  notes?: string
): IVRTracking => {
  const now = new Date().toISOString();

  return {
    ...tracking,
    status: newStatus,
    lastUpdatedAt: now,
    lastUpdatedBy: userId,
    statusHistory: [
      ...tracking.statusHistory,
      {
        status: newStatus,
        timestamp: now,
        updatedBy: userId,
        notes
      }
    ]
  };
}; 