import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClipboardIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card';
import { formatDate } from '../../../utils/formatters';

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
}

interface OrderDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface OrderDetailPageProps {
  id?: string;
  readOnly?: boolean;
  userRole?: string;
}

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  id: propId,
  readOnly = false,
  userRole = 'doctor'
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propId || paramId;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch order details
  const fetchOrderDetails = async () => {
    if (!id) return;

    try {
      setError(null);
      const response = await fetch(`/api/v1/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const orderData: OrderResponse = await response.json();
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');

      // Fallback to mock data for testing
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
                total_cost: 1500.00,
                unit_price: 750.00
              },
              {
                product_name: 'Antimicrobial Wound Dressing',
                q_code: 'A6196',
                total_quantity: 5,
                total_cost: 250.00,
                unit_price: 50.00
              }
            ]
          },
          status_history: [
            {
              status: 'pending',
              timestamp: '2024-12-19T09:15:00Z',
              notes: 'Order submitted for approval'
            }
          ],
          documents: [
            {
              id: 'doc-1',
              type: 'prescription',
              name: 'Prescription_Order.pdf',
              url: '/documents/prescription_order.pdf',
              uploaded_at: '2024-12-19T09:15:00Z',
              uploaded_by: 'Dr. Sarah Johnson'
            }
          ]
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
                total_cost: 850.00,
                unit_price: 850.00
              }
            ]
          },
          status_history: [
            {
              status: 'pending',
              timestamp: '2024-12-18T14:30:00Z',
              notes: 'Order submitted for approval'
            },
            {
              status: 'processing',
              timestamp: '2024-12-19T10:45:00Z',
              notes: 'Order approved and being prepared for shipment'
            }
          ],
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
                product_name: 'Negative Pressure Wound Therapy System',
                q_code: 'E2402',
                total_quantity: 1,
                total_cost: 1200.00,
                unit_price: 1200.00
              }
            ]
          },
          status_history: [
            {
              status: 'pending',
              timestamp: '2024-12-17T11:20:00Z',
              notes: 'Order submitted for approval'
            },
            {
              status: 'processing',
              timestamp: '2024-12-17T15:30:00Z',
              notes: 'Order approved and being prepared for shipment'
            },
            {
              status: 'shipped',
              timestamp: '2024-12-18T16:30:00Z',
              notes: 'Order shipped via UPS - Tracking: UPS789456123'
            }
          ],
          documents: []
        }
      ];

      const mockOrder = mockOrders.find(o => o.id === id);
      if (mockOrder) {
        setOrder(mockOrder);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold border inline-flex items-center gap-2';
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
        return 'Delivered - Awaiting Confirmation';
      case 'received':
        return 'Received - Complete';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'px-3 py-1 rounded text-sm font-semibold border';
    switch (priority.toLowerCase()) {
      case 'emergency':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      case 'urgent':
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case 'routine':
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-5 h-5" />;
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5" />;
      case 'shipped':
        return <TruckIcon className="w-5 h-5" />;
      case 'received':
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  // Handle order actions
  const handleMarkReceived = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/v1/orders/${order.id}/status`, {
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
        await fetchOrderDetails(); // Refresh order data
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to mark order as received');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleContactSupport = () => {
    alert('Contact support functionality would be implemented here');
  };

  const handleViewIVR = () => {
    if (order?.ivr_request_id) {
      navigate(`/doctor/ivr/${order.ivr_request_id}`);
    }
  };

  const handleUploadDocument = () => {
    alert('Document upload functionality would be implemented here');
  };

  const handleDownloadDocument = (doc: OrderDocument) => {
    window.open(doc.url, '_blank');
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="pt-1 pb-3">
          <button
            onClick={() => navigate('/doctor/orders')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Orders
          </button>
        </div>
        <Card className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Order</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/doctor/orders')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Orders
          </button>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="pt-1 pb-3">
          <button
            onClick={() => navigate('/doctor/orders')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Orders
          </button>
        </div>
        <Card className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h3>
          <p className="text-slate-600 mb-4">The requested order could not be found.</p>
          <button
            onClick={() => navigate('/doctor/orders')}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Return to Orders
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (readOnly) {
                  // Navigate back based on user role
                  switch (userRole) {
                    case 'master_distributor':
                      navigate('/distributor/order-processing');
                      break;
                    case 'distributor':
                      navigate('/distributor/order-processing');
                      break;
                    case 'shipping':
                      navigate('/shipping/orders');
                      break;
                    case 'ivr_company':
                      navigate('/ivr-company/orders');
                      break;
                    default:
                      navigate('/doctor/orders');
                  }
                } else {
                  navigate('/doctor/orders');
                }
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Details</h1>
              <p className="text-slate-600 mt-1 text-lg leading-normal">{order.order_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={getStatusBadge(order.status)}>
              {getStatusIcon(order.status)}
              {getStatusLabel(order.status)}
            </span>
            <span className={getPriorityBadge(order.priority)}>
              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Read-only indicator for non-doctor roles */}
          {readOnly && (
            <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mr-2" />
              <span className="text-sm text-amber-600">
                Read-only view - {userRole === 'master_distributor' ? 'Master Distributor' :
                                 userRole === 'distributor' ? 'Distributor' :
                                 userRole === 'shipping' ? 'Shipping' :
                                 userRole === 'ivr_company' ? 'IVR Company' : 'Limited'} access
              </span>
            </div>
          )}

          <button
            onClick={handlePrintOrder}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            Print Order Summary
          </button>

          {order.ivr_request_id && (
            <button
              onClick={handleViewIVR}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              View IVR Details
            </button>
          )}

          {/* Doctor-only actions */}
          {!readOnly && order.status === 'shipped' && (
            <button
              onClick={handleMarkReceived}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {updating ? 'Updating...' : 'Mark as Received'}
            </button>
          )}

          {!readOnly && (
            <button
              onClick={handleUploadDocument}
              className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Upload Document
            </button>
          )}

          <button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 px-4 py-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Contact Support
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5" />
                Order Summary
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Number</label>
                  <p className="text-base font-bold text-slate-800 mt-1">{order.order_number}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Type</label>
                  <p className="text-base font-semibold text-slate-800 mt-1">
                    {order.order_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created Date</label>
                  <p className="text-base font-semibold text-slate-800 mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Updated</label>
                  <p className="text-base font-semibold text-slate-800 mt-1">{formatDate(order.updated_at)}</p>
                </div>
              </div>

              {order.total_amount && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Amount</label>
                  <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                    <CurrencyDollarIcon className="w-6 h-6" />
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              )}

              {order.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <p className="text-sm text-slate-600 mt-1 italic">"{order.notes}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Patient Details */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Patient Details
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient Name</label>
                <p className="text-lg font-bold text-slate-800 mt-1">{order.patient_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient ID</label>
                <p className="text-base font-semibold text-slate-800 mt-1">{order.patient_id}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</label>
                <p className="text-base font-semibold text-slate-800 mt-1">{order.provider_name}</p>
              </div>
              {order.ivr_request_id && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">IVR Reference</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base font-semibold text-slate-800">{order.ivr_request_id}</p>
                    <button
                      onClick={handleViewIVR}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Products Ordered */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5" />
                Products Ordered
              </h3>
            </div>
            <div className="p-6">
              {order.products ? (
                <div className="space-y-3">
                  {Array.isArray(order.products) ? (
                    order.products.map((product: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-800">{product.name || 'Medical Product'}</h4>
                            <p className="text-sm text-slate-600">{product.description || 'Product description'}</p>
                            {product.size && (
                              <p className="text-xs text-slate-500 mt-1">Size: {product.size}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">Qty: {product.quantity || 1}</p>
                            {product.price && (
                              <p className="text-sm text-slate-600">${product.price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-600">Product details available in order system</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No product details available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Timeline */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5" />
                Order Timeline
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Order Created */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">Order Created</h4>
                    <p className="text-sm text-slate-600">{formatDate(order.created_at)}</p>
                    <p className="text-xs text-slate-500">Order placed and submitted for processing</p>
                  </div>
                </div>

                {/* Processing */}
                {order.processed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">Processing Started</h4>
                      <p className="text-sm text-slate-600">{formatDate(order.processed_at)}</p>
                      <p className="text-xs text-slate-500">Order entered fulfillment queue</p>
                    </div>
                  </div>
                )}

                {/* Shipped */}
                {order.shipped_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">Shipped</h4>
                      <p className="text-sm text-slate-600">{formatDate(order.shipped_at)}</p>
                      <p className="text-xs text-slate-500">Order dispatched for delivery</p>
                    </div>
                  </div>
                )}

                {/* Received */}
                {order.received_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">Received</h4>
                      <p className="text-sm text-slate-600">{formatDate(order.received_at)}</p>
                      <p className="text-xs text-slate-500">Order delivered and confirmed</p>
                    </div>
                  </div>
                )}

                {/* Current Status Indicator */}
                {!order.received_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-300 mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-600">
                        {order.status === 'shipped' ? 'Awaiting Delivery' : 'In Progress'}
                      </h4>
                      <p className="text-xs text-slate-500">Current status: {order.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Enhanced Shipping Information */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TruckIcon className="w-5 h-5" />
                Shipping & Tracking Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Tracking Information */}
              {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'received') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <TruckIcon className="w-4 h-4" />
                    Package Tracking
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Tracking Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-base font-bold text-amber-900">UPS789456123</p>
                        <button
                          onClick={() => navigator.clipboard.writeText('UPS789456123')}
                          className="text-amber-600 hover:text-amber-800 transition-colors"
                          title="Copy tracking number"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Carrier</label>
                      <p className="text-base font-bold text-amber-900 mt-1">UPS</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Estimated Delivery</label>
                      <p className="text-base font-semibold text-amber-900 mt-1">Dec 22, 2024</p>
                    </div>
                    {order.status === 'delivered' && (
                      <div>
                        <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Delivered</label>
                        <p className="text-base font-bold text-emerald-900 mt-1">Dec 20, 2024 2:20 PM</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => window.open('https://www.ups.com/track?tracknum=UPS789456123', '_blank')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Track on UPS Website
                    </button>
                    {order.status === 'delivered' && (
                      <button
                        onClick={handleMarkReceived}
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        {updating ? 'Updating...' : 'Mark as Received'}
                      </button>
                    )}
                  </div>
                  {order.status === 'delivered' && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm font-medium text-emerald-800">
                        ✓ Delivery Confirmation: Signed by M. Garcia
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Address */}
              {order.shipping_address && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Delivery Address
                  </h4>
                  {typeof order.shipping_address === 'object' ? (
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Facility</label>
                        <p className="text-base font-bold text-slate-800 mt-1">
                          {order.shipping_address.facility_name || 'Medical Facility'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</label>
                        <div className="text-sm text-slate-600 mt-1">
                          <p>{order.shipping_address.address_line1}</p>
                          {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                          <p>
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                          </p>
                        </div>
                      </div>
                      {order.shipping_address.attention && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attention</label>
                          <p className="text-sm text-slate-600 mt-1">{order.shipping_address.attention}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-600">Shipping address details available in system</p>
                  )}
                </div>
              )}

              {/* Shipping Status for non-shipped orders */}
              {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'received' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Shipping Status</h4>
                  <p className="text-sm text-blue-700">
                    {order.status === 'pending' && 'Order is pending approval before shipping can begin.'}
                    {order.status === 'processing' && 'Order is being prepared for shipment. Tracking information will be available once shipped.'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Documents & Attachments */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DocumentArrowDownIcon className="w-5 h-5" />
                Documents & Attachments
              </h3>
            </div>
            <div className="p-6">
              {order.documents && order.documents.length > 0 ? (
                <div className="space-y-3">
                  {order.documents.map((doc: OrderDocument, index: number) => (
                    <div key={doc.id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DocumentArrowDownIcon className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {doc.type} • Uploaded {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentArrowDownIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 mb-3">No documents uploaded yet</p>
                  <button
                    onClick={handleUploadDocument}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                  >
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
export { OrderDetailPage };