import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mockIVRRequests, mockDashboardStats, SharedIVRRequest, DashboardStats, calculateStatsFromData } from '../data/mockIVRData';

interface IVRContextType {
  ivrRequests: SharedIVRRequest[];
  dashboardStats: DashboardStats;
  updateIVRStatus: (id: string, status: SharedIVRRequest['status'], additionalData?: any) => void;
  refreshData: () => void;
  getIVRById: (id: string) => SharedIVRRequest | undefined;
}

const IVRContext = createContext<IVRContextType | undefined>(undefined);

export const useIVR = () => {
  const context = useContext(IVRContext);
  if (context === undefined) {
    throw new Error('useIVR must be used within an IVRProvider');
  }
  return context;
};

interface IVRProviderProps {
  children: ReactNode;
}

export const IVRProvider: React.FC<IVRProviderProps> = ({ children }) => {
  const [ivrRequests, setIvrRequests] = useState<SharedIVRRequest[]>(mockIVRRequests);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(mockDashboardStats);

  const updateIVRStatus = useCallback((id: string, status: SharedIVRRequest['status'], additionalData?: any) => {
    setIvrRequests(prevRequests => {
      const updatedRequests = prevRequests.map(request => {
        if (request.id === id) {
          const updatedRequest = {
            ...request,
            status,
            lastUpdated: new Date().toISOString().split('T')[0]
          };

          // Add any additional data (like approval results)
          if (additionalData) {
            Object.assign(updatedRequest, additionalData);
          }

          return updatedRequest;
        }
        return request;
      });

      // Recalculate stats based on updated data
      const newStats = calculateStatsFromData(updatedRequests);
      setDashboardStats(newStats);

      return updatedRequests;
    });
  }, []);

  const refreshData = useCallback(() => {
    // In a real app, this would fetch from API
    setIvrRequests(mockIVRRequests);
    setDashboardStats(mockDashboardStats);
  }, []);

  const getIVRById = useCallback((id: string) => {
    return ivrRequests.find(request => request.id === id);
  }, [ivrRequests]);

  const value: IVRContextType = {
    ivrRequests,
    dashboardStats,
    updateIVRStatus,
    refreshData,
    getIVRById
  };

  return (
    <IVRContext.Provider value={value}>
      {children}
    </IVRContext.Provider>
  );
};