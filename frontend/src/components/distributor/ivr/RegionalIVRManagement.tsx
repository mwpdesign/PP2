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

        // Clear selected IVR if it's not in the filtered results
        if (selectedIVR && result.filteredData && !result.filteredData.find(ivr => ivr.id === selectedIVR.id)) {
          console.log('🚫 Clearing selected IVR - not in filtered results');
          setSelectedIVR(null);
        }
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
  }, [user, selectedIVR]); // Include selectedIVR in dependencies

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]); // Use the memoized function

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle IVR selection from the list
  const handleIVRSelect = useCallback((ivr: SharedIVRRequest) => {
    console.log('🔍 [RegionalIVRManagement] IVR selected:', ivr.ivrNumber, ivr.id);
    console.log('🔍 [RegionalIVRManagement] Previous selectedIVR:', selectedIVR?.ivrNumber);
    if (isMountedRef.current) {
      setSelectedIVR(ivr);
      console.log('🔍 [RegionalIVRManagement] selectedIVR state updated');
    }
  }, [selectedIVR]);

  // Handle closing the detail panel (mobile)
  const handleCloseDetail = useCallback(() => {
    if (isMountedRef.current) {
      setSelectedIVR(null);
    }
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
          {filterResult && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  {HierarchyFilteringService.getFilteringSummary(filterResult)}
                </span>
              </div>
              {filterResult.userHierarchyInfo?.downlineDoctors?.length > 0 && (
                <div className="mt-2 text-xs text-blue-700">
                  Downline doctors: {filterResult.userHierarchyInfo.downlineDoctors.map(d => d.name).join(', ')}
                </div>
              )}
            </div>
          )}
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
    <div className="h-screen bg-gray-50">
      {/* Debug logging */}
      {console.log('🔍 [RegionalIVRManagement] Render - selectedIVR:', selectedIVR?.ivrNumber || 'null')}
      {console.log('🔍 [RegionalIVRManagement] Render - showDetail:', !!selectedIVR)}

      <MasterDetailLayout
        masterPanel={masterPanel}
        detailPanel={detailPanel}
        showDetail={!!selectedIVR}
        className="h-full"
        minHeight="100vh"
      />
    </div>
  );
};

export default RegionalIVRManagement;