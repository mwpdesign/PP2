import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilterState } from './ShippingQueueFilters';
import { Package, Eye, Download, X } from 'lucide-react';
import { exportShippingOrdersToCSV } from '../../utils/exportToCSV';

interface ShippingOrder {
  id: string;
  orderNumber: string;
  doctor: {
    name: string;
    facility: string;
  };
  shipTo: {
    city: string;
    state: string;
  };
  productCount: number;
  priority: 'Urgent' | 'Routine';
  status: 'Created' | 'Processing' | 'Shipped';
  orderDate: string;
}

interface ShippingQueueTableProps {
  filters: FilterState;
}

const ShippingQueueTable: React.FC<ShippingQueueTableProps> = ({ filters }) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data with variety of statuses and priorities
  const mockOrders: ShippingOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      doctor: {
        name: 'Dr. Smith',
        facility: 'Clear Health Medical'
      },
      shipTo: {
        city: 'Columbus',
        state: 'IN'
      },
      productCount: 3,
      priority: 'Urgent',
      status: 'Created',
      orderDate: '2024-12-19'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      doctor: {
        name: 'Dr. Johnson',
        facility: 'Riverside Clinic'
      },
      shipTo: {
        city: 'Indianapolis',
        state: 'IN'
      },
      productCount: 5,
      priority: 'Routine',
      status: 'Created',
      orderDate: '2024-12-19'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      doctor: {
        name: 'Dr. Williams',
        facility: 'Metro Health Center'
      },
      shipTo: {
        city: 'Fort Wayne',
        state: 'IN'
      },
      productCount: 2,
      priority: 'Urgent',
      status: 'Processing',
      orderDate: '2024-12-18'
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-004',
      doctor: {
        name: 'Dr. Brown',
        facility: 'Community Medical'
      },
      shipTo: {
        city: 'Evansville',
        state: 'IN'
      },
      productCount: 4,
      priority: 'Routine',
      status: 'Processing',
      orderDate: '2024-12-18'
    },
    {
      id: '5',
      orderNumber: 'ORD-2024-005',
      doctor: {
        name: 'Dr. Davis',
        facility: 'Northside Hospital'
      },
      shipTo: {
        city: 'South Bend',
        state: 'IN'
      },
      productCount: 1,
      priority: 'Routine',
      status: 'Shipped',
      orderDate: '2024-12-17'
    },
    {
      id: '6',
      orderNumber: 'ORD-2024-006',
      doctor: {
        name: 'Dr. Anderson',
        facility: 'Westside Medical Group'
      },
      shipTo: {
        city: 'Bloomington',
        state: 'IN'
      },
      productCount: 3,
      priority: 'Urgent',
      status: 'Created',
      orderDate: '2024-12-16'
    },
    {
      id: '7',
      orderNumber: 'ORD-2024-007',
      doctor: {
        name: 'Dr. Martinez',
        facility: 'Central Indiana Health'
      },
      shipTo: {
        city: 'Carmel',
        state: 'IN'
      },
      productCount: 2,
      priority: 'Routine',
      status: 'Shipped',
      orderDate: '2024-12-15'
    }
  ];

  // Filter the orders based on the current filters
  const filteredOrders = mockOrders.filter(order => {
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
      return false;
    }

    // Date range filter
    if (filters.startDate && order.orderDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && order.orderDate > filters.endDate) {
      return false;
    }

    // Doctor/Facility search filter (case-insensitive partial match)
    if (filters.doctorSearch) {
      const searchTerm = filters.doctorSearch.toLowerCase();
      const doctorName = order.doctor.name.toLowerCase();
      const facilityName = order.doctor.facility.toLowerCase();

      if (!doctorName.includes(searchTerm) && !facilityName.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  // Check if all selected orders can be processed (have "Created" status)
  const selectedOrdersData = filteredOrders.filter(order => selectedOrders.includes(order.id));
  const canProcessSelected = selectedOrdersData.length > 0 &&
    selectedOrdersData.every(order => order.status === 'Created');

    // Export to CSV functionality
  const exportToCSV = () => {
    const ordersToExport = selectedOrders.length > 0
      ? filteredOrders.filter(order => selectedOrders.includes(order.id))
      : filteredOrders;

    exportShippingOrdersToCSV(ordersToExport);
  };

  // Process multiple orders
  const handleProcessSelected = () => {
    if (selectedOrdersData.length === 0) return;

    const confirmed = window.confirm(`Process ${selectedOrdersData.length} orders?`);
    if (confirmed) {
      setIsProcessing(true);

      // Store remaining order IDs in sessionStorage for sequential processing
      const orderIds = selectedOrdersData.map(order => order.id);
      sessionStorage.setItem('remainingOrderIds', JSON.stringify(orderIds.slice(1)));

      // Navigate to first order's process page
      const firstOrderId = orderIds[0];
      window.location.href = `/logistics/orders/${firstOrderId}/process`;
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (priority) {
      case 'Urgent':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'Routine':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case 'Created':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'Processing':
        return `${baseClasses} bg-amber-100 text-amber-700`;
      case 'Shipped':
        return `${baseClasses} bg-emerald-100 text-emerald-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const isIndeterminate = selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Batch Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900">
                {selectedOrders.length} orders selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-slate-600 hover:text-slate-800 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleProcessSelected}
                disabled={!canProcessSelected || isProcessing}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors ${
                  canProcessSelected && !isProcessing
                    ? 'text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Process Selected'}
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Orders Ready for Shipping</h3>
        <p className="text-sm text-gray-500 mt-1">
          {filteredOrders.length} of {mockOrders.length} orders
          {filteredOrders.length !== mockOrders.length && ' (filtered)'}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ship To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className={`transition-colors ${
                  selectedOrders.includes(order.id)
                    ? 'bg-slate-50 hover:bg-slate-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.doctor.name}</div>
                  <div className="text-sm text-gray-500">{order.doctor.facility}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.shipTo.city}, {order.shipTo.state}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.productCount} items</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getPriorityBadge(order.priority)}>
                    {order.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(order.status)}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDisplayDate(order.orderDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {order.status === 'Created' && (
                      <Link
                        to={`/logistics/orders/${order.id}/process`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Process
                      </Link>
                    )}
                    <Link
                      to={`/logistics/orders/${order.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State or No Results */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          {mockOrders.length === 0 ? (
            <div className="text-gray-500">No orders in shipping queue</div>
          ) : (
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">No orders match your filters</div>
              <div className="text-sm">Try adjusting your filter criteria to see more results</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingQueueTable;