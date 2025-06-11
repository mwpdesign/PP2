import React, { useState, useEffect } from 'react';
import { Card } from '../shared/ui/Card';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  LinkIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { orderApiService } from '../../services/orderApiService';
import { formatDate, formatMessageTimestamp } from '../../utils/formatters';

interface OrderResponse {
  id: string;
  order_number: string;
  organization_id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  ivr_request_id?: string;
  status: string;
  order_type: string;
  priority: string;
  shipping_address?: any;
  products?: any;
  total_amount?: number;
  notes?: string;
  processed_at?: string;
  shipped_at?: string;
  received_at?: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
  documents: any[];
  status_history: any[];
  // Enhanced shipping fields
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  delivery_confirmation?: string;
}

interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  limit: number;
  offset: number;
}

const DoctorOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await fetch('/api/v1/orders/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data: OrderListResponse = await response.json();
      setOrders(data.items || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      // Enhanced fallback with shipping data for testing
      const mockOrders: OrderResponse[] = [
        {
          id: 'ORD-2024-001',
          order_number: 'ORD-2024-001',
          organization_id: 'org-123',
          patient_id: 'patient-123',
          patient_name: 'John Smith',
          provider_id: 'provider-123',
          provider_name: 'Dr. Sarah Johnson',
          status: 'pending',
          order_type: 'medical_supplies',
          priority: 'high',
          total_amount: 1750.00,
          created_at: '2024-12-19T09:15:00Z',
          updated_at: '2024-12-19T09:15:00Z',
          ivr_request_id: 'IVR-2024-001',
          shipping_address: {
            street: '1500 Medical Center Drive',
            city: 'Austin',
            state: 'TX',
            zip: '78712',
            country: 'USA',
            attention: 'Dr. Sarah Johnson - Wound Care Unit',
            phone: '(555) 123-4567'
          },
          products: {
            items: [
              {
                product_name: 'Advanced Skin Graft - Type A',
                q_code: 'Q4100',
                total_quantity: 2,
                total_cost: 1500.00
              },
              {
                product_name: 'Antimicrobial Wound Dressing',
                q_code: 'A6196',
                total_quantity: 5,
                total_cost: 250.00
              }
            ]
          },
          status_history: [],
          documents: []
        },
        {
          id: 'ORD-2024-002',
          order_number: 'ORD-2024-002',
          organization_id: 'org-123',
          patient_id: 'patient-456',
          patient_name: 'Emily Davis',
          provider_id: 'provider-123',
          provider_name: 'Dr. Michael Rodriguez',
          status: 'processing',
          order_type: 'medical_supplies',
          priority: 'medium',
          total_amount: 850.00,
          created_at: '2024-12-18T14:30:00Z',
          updated_at: '2024-12-19T10:45:00Z',
          processed_at: '2024-12-19T10:45:00Z',
          ivr_request_id: 'IVR-2024-002',
          shipping_address: {
            street: '900 E 30th Street',
            city: 'Austin',
            state: 'TX',
            zip: '78705',
            country: 'USA',
            attention: 'Dr. Michael Rodriguez - Surgery Department',
            phone: '(555) 987-6543'
          },
          products: {
            items: [
              {
                product_name: 'Collagen Matrix Implant',
                q_code: 'Q4110',
                total_quantity: 1,
                total_cost: 850.00
              }
            ]
          },
          status_history: [],
          documents: []
        },
        {
          id: 'ORD-2024-003',
          order_number: 'ORD-2024-003',
          organization_id: 'org-123',
          patient_id: 'patient-789',
          patient_name: 'David Wilson',
          provider_id: 'provider-123',
          provider_name: 'Dr. Lisa Chen',
          status: 'shipped',
          order_type: 'medical_equipment',
          priority: 'urgent',
          total_amount: 1200.00,
          created_at: '2024-12-17T11:20:00Z',
          updated_at: '2024-12-18T16:30:00Z',
          shipped_at: '2024-12-18T16:30:00Z',
          ivr_request_id: 'IVR-2024-003',
          tracking_number: 'UPS789456123',
          carrier: 'UPS',
          estimated_delivery: '2024-12-22',
          shipping_address: {
            street: '2400 Medical Plaza Dr',
            city: 'Austin',
            state: 'TX',
            zip: '78731',
            country: 'USA',
            attention: 'Dr. Lisa Chen - Wound Care',
            phone: '(555) 112-2334'
          },
          products: {
            items: [
              {
                product_name: 'Negative Pressure Therapy Kit',
                q_code: 'E2402',
                total_quantity: 1,
                total_cost: 1200.00
              }
            ]
          },
          status_history: [],
          documents: []
        },
        {
          id: 'ORD-2024-004',
          order_number: 'ORD-2024-004',
          organization_id: 'org-123',
          patient_id: 'patient-101',
          patient_name: 'Maria Garcia',
          provider_id: 'provider-123',
          provider_name: 'Dr. James Wilson',
          status: 'delivered',
          order_type: 'medical_supplies',
          priority: 'standard',
          total_amount: 650.00,
          created_at: '2024-12-16T08:45:00Z',
          updated_at: '2024-12-20T14:20:00Z',
          shipped_at: '2024-12-17T09:15:00Z',
          actual_delivery: '2024-12-20T14:20:00Z',
          ivr_request_id: 'IVR-2024-004',
          tracking_number: 'FEDEX456789123',
          carrier: 'FedEx',
          estimated_delivery: '2024-12-20',
          delivery_confirmation: 'Signed by: M. Garcia',
          shipping_address: {
            street: '3200 Health Sciences Dr',
            city: 'Austin',
            state: 'TX',
            zip: '78723',
            country: 'USA',
            attention: 'Dr. James Wilson - Dermatology',
            phone: '(555) 334-5567'
          },
          products: {
            items: [
              {
                product_name: 'Hydrocolloid Dressing Set',
                q_code: 'A6234',
                total_quantity: 10,
                total_cost: 650.00
              }
            ]
          },
          status_history: [],
          documents: []
        }
      ];
      setOrders(mockOrders);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.ivr_request_id && order.ivr_request_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.tracking_number && order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    const matchesDate = dateFilter === '' ||
      (dateFilter === 'today' && new Date(order.created_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(order.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && new Date(order.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Calculate metrics
  const orderMetrics = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    received: orders.filter(o => o.status === 'received').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  // Enhanced status badge with more descriptive labels
  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border';
    switch (status.toLowerCase()) {
      case 'pending':
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
      case 'processing':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'shipped':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
      case 'delivered':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'received':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'completed':
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
      case 'cancelled':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  // Enhanced status labels
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending Approval';
      case 'processing':
        return 'Preparing Shipment';
      case 'shipped':
        return 'Shipped - In Transit';
      case 'delivered':
        return 'Delivered';
      case 'received':
        return 'Received';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium border';
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'high':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      case 'medium':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
      case 'low':
      case 'standard':
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'processing':
        return <ArrowPathIcon className="w-4 h-4" />;
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />;
      case 'delivered':
      case 'received':
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  // Handle order actions
  const handleViewDetails = (orderId: string) => {
    // Navigate to order detail page
    window.open(`/doctor/orders/${orderId}`, '_blank');
  };

  const handleTrackShipment = (order: OrderResponse) => {
    if (order.tracking_number && order.carrier) {
      // Open carrier tracking page
      let trackingUrl = '';
      switch (order.carrier.toLowerCase()) {
        case 'ups':
          trackingUrl = `https://www.ups.com/track?tracknum=${order.tracking_number}`;
          break;
        case 'fedex':
          trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`;
          break;
        case 'usps':
          trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`;
          break;
        default:
          alert(`Track package ${order.tracking_number} with ${order.carrier}`);
          return;
      }
      window.open(trackingUrl, '_blank');
    } else {
      alert('Tracking information not available yet');
    }
  };

  const handleCopyTracking = async (trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      alert('Tracking number copied to clipboard');
    } catch (err) {
      console.error('Failed to copy tracking number:', err);
    }
  };

  const handleMarkReceived = async (orderId: string) => {
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'received',
          reason: 'Marked as received by doctor'
        })
      });

      if (response.ok) {
        // Refresh orders
        fetchOrders();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to mark order as received');
    }
  };

  const handleDownloadInvoice = (order: OrderResponse) => {
    // Download invoice/documents
    alert(`Downloading documents for order ${order.order_number}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Management</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Track and manage your medical product orders from creation through delivery</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              disabled={refreshing}
              className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Total Orders: </span>
              <span className="text-xl font-bold text-slate-900">{orderMetrics.total}</span>
            </div>
          </div>
        </div>

        {/* Order Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-700 leading-tight">{orderMetrics.pending}</div>
            <div className="text-sm font-medium text-gray-600 mt-1">Pending Approval</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting processing</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{orderMetrics.processing}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Preparing Shipment</div>
            <div className="text-xs text-blue-500 mt-1">Being prepared</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 leading-tight">{orderMetrics.shipped}</div>
            <div className="text-sm font-medium text-amber-600 mt-1">Shipped - In Transit</div>
            <div className="text-xs text-amber-500 mt-1">On the way</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{orderMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600 mt-1">Delivered</div>
            <div className="text-xs text-emerald-500 mt-1">Awaiting confirmation</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{orderMetrics.received}</div>
            <div className="text-sm font-medium text-emerald-600 mt-1">Received</div>
            <div className="text-xs text-emerald-500 mt-1">Confirmed</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{orderMetrics.completed}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Completed</div>
            <div className="text-xs text-slate-500 mt-1">Finished</div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                Search Orders
              </label>
              <input
                type="text"
                placeholder="Order number, patient, IVR, or tracking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FunnelIcon className="w-4 h-4 inline mr-1" />
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="processing">Preparing Shipment</option>
                <option value="shipped">Shipped - In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="received">Received</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">Error loading orders: {error}</span>
          </div>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Orders Found</h3>
            <p className="text-slate-600 text-base">
              {orders.length === 0
                ? "You haven't placed any orders yet. Orders will appear here after you submit approved IVR requests."
                : "No orders match your current search criteria. Try adjusting your filters."
              }
            </p>
          </Card>
        ) :
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out">
              {/* Order Header */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{order.order_number}</h3>
                    <span className={getStatusBadge(order.status)}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                    <span className={getPriorityBadge(order.priority)}>
                      {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {order.total_amount && (
                      <span className="text-lg font-bold text-slate-900">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                  <span className="font-medium">Created: {formatDate(order.created_at)}</span>
                  {order.shipped_at && (
                    <span className="font-medium">Shipped: {formatDate(order.shipped_at)}</span>
                  )}
                  {order.estimated_delivery && (
                    <span className="font-medium">Est. Delivery: {formatDate(order.estimated_delivery)}</span>
                  )}
                  {order.actual_delivery && (
                    <span className="font-medium text-emerald-600">Delivered: {formatDate(order.actual_delivery)}</span>
                  )}
                </div>
              </div>

              {/* Order Content */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Patient Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Patient Information</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {order.patient_name}
                      </p>
                      <p className="text-xs text-slate-600">Patient ID: {order.patient_id}</p>
                      {order.ivr_request_id && (
                        <p className="text-xs text-slate-600">IVR: {order.ivr_request_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Order Details</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {order.order_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {order.products && (
                        <p className="text-xs text-slate-600">
                          Products: {Array.isArray(order.products.items) ? order.products.items.length : 'Multiple items'}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-slate-600 italic">"{order.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shipping Information</h4>
                    <div className="space-y-1">
                      {order.tracking_number ? (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-600">
                              <span className="font-medium">Tracking:</span> {order.tracking_number}
                            </p>
                            <button
                              onClick={() => handleCopyTracking(order.tracking_number!)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copy tracking number"
                            >
                              <ClipboardIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-600">
                            <span className="font-medium">Carrier:</span> {order.carrier}
                          </p>
                          {order.delivery_confirmation && (
                            <p className="text-xs text-emerald-600 font-medium">
                              ✓ {order.delivery_confirmation}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Tracking info pending</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-3 h-3" />
                        View Details
                      </button>

                      {order.status === 'shipped' && order.tracking_number && (
                        <button
                          onClick={() => handleTrackShipment(order)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-600 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Track Shipment
                        </button>
                      )}

                      {(order.status === 'shipped' || order.status === 'delivered') && (
                        <button
                          onClick={() => handleMarkReceived(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                        >
                          <CheckCircleIcon className="w-3 h-3" />
                          Mark Received
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        <DocumentArrowDownIcon className="w-3 h-3" />
                        Documents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

export default DoctorOrderManagement;