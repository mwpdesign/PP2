import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { mockOrders, SharedOrder } from '../../../data/mockOrderData';
import { HierarchyFilteringService, OrderFilterResult } from '../../../services/hierarchyFilteringService';
import { Card } from '../../shared/ui/Card';

interface OrderMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const OrderManagementView: React.FC = () => {
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<SharedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<OrderFilterResult | null>(null);

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

      console.log('🔍 [OrderManagementView] Applying hierarchy filtering...');
      console.log('👤 Current user:', user.email, 'Role:', user.role);

      // Apply hierarchy filtering to mock order data
      const result = HierarchyFilteringService.filterOrderDataByHierarchy(mockOrders, user);

      console.log('📦 Order hierarchy filtering result:', {
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
      console.error('❌ Error loading order data:', error);
      if (isMountedRef.current) {
        setError('Failed to load order data');
        // Fallback to empty data on error
        setFilteredData([]);
        setFilterResult(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Calculate metrics based on filtered data
  const calculateMetrics = useCallback((orders: SharedOrder[]): OrderMetric[] => {
    const totalOrders = orders?.length || 0;
    const processingOrders = orders?.filter(o => o?.status === 'Preparing for Ship').length || 0;
    const shippedOrders = orders?.filter(o => o?.status === 'Shipped').length || 0;
    const deliveredOrders = orders?.filter(o => o?.status === 'Delivered').length || 0;

    // Calculate fulfillment rate
    const fulfilledOrders = shippedOrders + deliveredOrders;
    const fulfillmentRate = totalOrders > 0 ? ((fulfilledOrders / totalOrders) * 100).toFixed(1) : '0.0';

    return [
      {
        label: 'Total Orders',
        value: totalOrders.toString(),
        change: '+8.2%',
        trend: 'up'
      },
      {
        label: 'Processing',
        value: processingOrders.toString(),
        change: '-4.1%',
        trend: 'down'
      },
      {
        label: 'Fulfillment Rate',
        value: `${fulfillmentRate}%`,
        change: '+1.4%',
        trend: 'up'
      },
      {
        label: 'Avg. Processing Time',
        value: '1.8d',
        change: '-0.3d',
        trend: 'down'
      }
    ];
  }, []);

  const metrics = calculateMetrics(filteredData);

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

  return (
    <div className="space-y-6">
      {/* Header with filtering summary */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor and track orders from doctors in your network
        </p>
        {filterResult && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">
                {HierarchyFilteringService.getOrderFilteringSummary(filterResult)}
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
              <div className={`flex items-center ${
                metric.trend === 'up' ? 'text-green-600' :
                metric.trend === 'down' ? 'text-red-600' :
                'text-slate-600'
              }`}>
                {metric.trend === 'up' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {metric.trend === 'down' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span className="ml-1 text-sm font-medium">{metric.change}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Processing Queue */}
      <Card className="overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-900">Order Processing Queue</h3>
          <p className="text-sm text-slate-600 mt-1">
            Showing {filteredData?.length || 0} orders from your network
          </p>
        </div>
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!filteredData || filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No orders found for your network
                    </td>
                  </tr>
                ) : (
                  filteredData.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {order.doctorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {order.facility}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'Pending Fulfillment' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Preparing for Ship' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Shipped' ? 'bg-green-100 text-green-800' :
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {order.totalItems} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.priority === 'Rush' ? 'bg-red-100 text-red-800' :
                          order.priority === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <button className="text-[#375788] hover:text-[#247297] font-medium">
                          Process
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderManagementView;