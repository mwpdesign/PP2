import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { mockIVRRequests, SharedIVRRequest } from '../../../data/mockIVRData';
import { HierarchyFilteringService, FilterResult } from '../../../services/hierarchyFilteringService';
import MasterDetailLayout from '../../shared/layout/MasterDetailLayout';
import IVRListComponent from '../../ivr/IVRListComponent';
import IVRDetailPanel from '../../ivr/IVRDetailPanel';
import IVREmptyState from '../../ivr/IVREmptyState';

const RegionalIVRManagement: React.FC = () => {
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<SharedIVRRequest[]>([]);
  const [selectedIVR, setSelectedIVR] = useState<SharedIVRRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);

  // Use ref to track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

  // Memoized function to load filtered data
  const loadFilteredData = useCallback(async () => {
    if (!user) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      console.log('🔍 [RegionalIVRManagement] Applying hierarchy filtering...');
      console.log('👤 Current user:', user.email, 'Role:', user.role);

      // Apply hierarchy filtering to mock data
      const result = HierarchyFilteringService.filterIVRDataByHierarchy(mockIVRRequests, user);

      console.log('📊 Hierarchy filtering result:', {
        totalCount: result.totalCount,
        filteredCount: result.filteredCount,
        filterReason: result.filterReason,
        allowedDoctorIds: result.allowedDoctorIds?.length || 0,
        downlineDoctors: result.userHierarchyInfo?.downlineDoctors?.length || 0
      });

      if (isMountedRef.current) {
        setFilterResult(result);
        setFilteredData(result.filteredData || []);
      }

    } catch (error) {
      console.error('❌ Error loading IVR data:', error);
      if (isMountedRef.current) {
        setError('Failed to load IVR data');
        // Fallback to empty data on error
        setFilteredData([]);
        setFilterResult(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]); // Removed selectedIVR dependency to prevent infinite loops

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]); // Use the memoized function

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true; // Ensure component is marked as mounted
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle IVR selection from the list
  const handleIVRSelect = useCallback((ivr: SharedIVRRequest) => {
    console.log('🔵 [STEP 2] RegionalIVRManagement - handleIVRSelect called!');
    console.log('🔵 [STEP 2] Received IVR:', ivr.ivrNumber, ivr.id);
    console.log('🔵 [STEP 2] Previous selectedIVR:', selectedIVR?.ivrNumber || 'null');
    console.log('🔵 [STEP 2] isMountedRef.current:', isMountedRef.current);
    console.log('🔵 [STEP 2] About to call setSelectedIVR...');

    // Always update state - remove mounted check that's causing issues
    setSelectedIVR(ivr);
    console.log('🔵 [STEP 2] setSelectedIVR called with:', ivr.ivrNumber);
    console.log('🔵 [STEP 2] showDetail will be:', !!ivr);
    console.log('🔵 [STEP 2] State update should trigger re-render');
  }, []); // Removed selectedIVR dependency to prevent callback recreation

  // Handle closing the detail panel (mobile)
  const handleCloseDetail = useCallback(() => {
    setSelectedIVR(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => {
              if (isMountedRef.current) {
                loadFilteredData();
              }
            }}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to access this page.</div>
      </div>
    );
  }

  // Master panel content (60% width)
  const masterPanel = (
    <div className="h-full flex flex-col">
      {/* Header with summary stats */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Regional IVR Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and track IVR requests from doctors in your regional network
          </p>

        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">
              {filteredData?.length || 0}
            </div>
            <div className="text-sm text-slate-600">Total IVRs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {filteredData?.filter(ivr => ivr?.status === 'approved').length || 0}
            </div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">
              {filteredData?.filter(ivr => ivr?.status && ['submitted', 'in_review', 'documents_requested', 'pending_approval'].includes(ivr.status)).length || 0}
            </div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {filteredData?.filter(ivr => ivr?.status === 'approved').length || 0}
            </div>
            <div className="text-sm text-blue-600">Orders Generated</div>
          </div>
        </div>
      </div>

      {/* IVR List */}
      <div className="flex-1 overflow-hidden">
        <IVRListComponent
          ivrRequests={filteredData || []}
          onSelectIVR={handleIVRSelect}
          selectedIVR={selectedIVR}
          className="h-full"
        />
      </div>
    </div>
  );

  // Detail panel content (40% width)
  const detailPanel = selectedIVR ? (
    <IVRDetailPanel
      ivr={selectedIVR}
      onClose={handleCloseDetail}
      className="h-full"
    />
  ) : (
    <IVREmptyState className="h-full" />
  );

  return (
    <div className="h-screen bg-gray-50" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Debug logging */}
      {console.log('🟡 [STEP 3] RegionalIVRManagement - RENDER TRIGGERED')}
      {console.log('🟡 [STEP 3] selectedIVR:', selectedIVR?.ivrNumber || 'null')}
      {console.log('🟡 [STEP 3] selectedIVR ID:', selectedIVR?.id || 'null')}
      {console.log('🟡 [STEP 3] showDetail value:', !!selectedIVR)}
      {console.log('🟡 [STEP 3] filteredData length:', filteredData?.length || 0)}
      {console.log('🟡 [STEP 3] handleIVRSelect type:', typeof handleIVRSelect)}
      {console.log('🟡 [STEP 3] detailPanel type:', selectedIVR ? 'IVRDetailPanel' : 'IVREmptyState')}
      {console.log('🟡 [STEP 3] About to pass showDetail to MasterDetailLayout:', !!selectedIVR)}



      <MasterDetailLayout
        masterPanel={masterPanel}
        detailPanel={detailPanel}
        showDetail={!!selectedIVR}
        className="h-full w-full"
        minHeight="100vh"
      />
    </div>
  );
};

export default RegionalIVRManagement;