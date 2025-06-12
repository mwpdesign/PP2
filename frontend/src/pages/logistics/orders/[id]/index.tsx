import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../../../components/shared/layout/UnifiedDashboardLayout';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

interface LogisticsOrderDetail {
  id: string;
  orderNumber: string;
  status: 'Created' | 'Processing' | 'Shipped' | 'Delivered';
  priority: 'Urgent' | 'Routine';
  orderDate: string;
  doctor: {
    name: string;
    facility: string;
    phone: string;
    email: string;
  };
  patient: {
    name: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
  };
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  products: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shipping: {
    method: string;
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    cost: number;
  };
  notes?: string;
  timeline: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    details?: string;
  }>;
}

const LogisticsOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [order, setOrder] = useState<LogisticsOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Role protection
  if (user?.role !== 'Shipping and Logistics') {
    return <Navigate to="/dashboard" replace />;
  }

  // Mock order data - in real app, this would come from API
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockOrder: LogisticsOrderDetail = {
          id: id || '1',
          orderNumber: `ORD-2024-${id?.padStart(3, '0') || '001'}`,
          status: id === '3' || id === '4' ? 'Processing' : id === '5' || id === '7' ? 'Shipped' : 'Created',
          priority: id === '1' || id === '3' || id === '6' ? 'Urgent' : 'Routine',
          orderDate: '2024-12-19',
          doctor: {
            name: 'Dr. Sarah Johnson',
            facility: 'Metro Health Center',
            phone: '(555) 123-4567',
            email: 'sarah.johnson@metrohealth.com'
          },
          patient: {
            name: 'John Smith',
            dateOfBirth: '1975-03-15',
            medicalRecordNumber: 'MRN-789456'
          },
          shippingAddress: {
            name: 'Metro Health Center - Wound Care Dept',
            addressLine1: '123 Medical Plaza Drive',
            addressLine2: 'Suite 200',
            city: 'Indianapolis',
            state: 'IN',
            zipCode: '46240',
            phone: '(555) 123-4567'
          },
          products: [
            {
              id: '1',
              name: 'Apligraf Skin Graft - 2x2 inch',
              sku: 'APL-2X2-001',
              quantity: 2,
              unitPrice: 1250.00,
              totalPrice: 2500.00
            },
            {
              id: '2',
              name: 'Dermagraft Skin Substitute - 1x1 inch',
              sku: 'DRM-1X1-002',
              quantity: 1,
              unitPrice: 850.00,
              totalPrice: 850.00
            }
          ],
          shipping: {
            method: 'Overnight Express',
            carrier: id === '5' || id === '7' ? 'UPS' : undefined,
            trackingNumber: id === '5' || id === '7' ? `1Z999AA1${id}234567890` : undefined,
            estimatedDelivery: '2024-12-20',
            cost: 45.00
          },
          notes: 'Patient requires urgent treatment. Please expedite shipping and confirm delivery.',
          timeline: [
            {
              id: '1',
              action: 'Order Created',
              timestamp: '2024-12-19T08:30:00Z',
              user: 'Dr. Sarah Johnson',
              details: 'Order placed for urgent wound care treatment'
            },
            {
              id: '2',
              action: 'Payment Verified',
              timestamp: '2024-12-19T08:45:00Z',
              user: 'System',
              details: 'Insurance pre-authorization confirmed'
            },
            ...(id === '3' || id === '4' || id === '5' || id === '7' ? [{
              id: '3',
              action: 'Processing Started',
              timestamp: '2024-12-19T09:15:00Z',
              user: 'Logistics Team',
              details: 'Order picked up by warehouse team'
            }] : []),
            ...(id === '5' || id === '7' ? [{
              id: '4',
              action: 'Shipped',
              timestamp: '2024-12-19T14:30:00Z',
              user: 'Logistics Team',
              details: `Shipped via UPS - Tracking: 1Z999AA1${id}234567890`
            }] : [])
          ]
        };

        setOrder(mockOrder);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/logistics/dashboard', icon: HomeIcon },
    { name: 'Shipping Queue', href: '/logistics/shipping-queue', icon: QueueListIcon },
    { name: 'Settings', href: '/logistics/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Logistics Coordinator',
    role: 'Shipping & Logistics',
    avatar: user?.first_name?.charAt(0) || 'L'
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Created': { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon },
      'Processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
      'Shipped': { bg: 'bg-purple-100', text: 'text-purple-800', icon: TruckIcon },
      'Delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Created'];
  };

  const getPriorityBadge = (priority: string) => {
    return priority === 'Urgent'
      ? { bg: 'bg-red-100', text: 'text-red-800' }
      : { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-600">Loading order details...</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!order) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="text-center py-12">
          <div className="text-gray-500">Order not found</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const priorityBadge = getPriorityBadge(order.priority);
  const totalAmount = order.products.reduce((sum, product) => sum + product.totalPrice, 0) + order.shipping.cost;

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/logistics/shipping-queue')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
                <p className="text-gray-600 mt-1">Order details and shipping information</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                {order.priority} Priority
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                <statusBadge.icon className="h-4 w-4 mr-1" />
                {order.status}
              </span>
              {order.status === 'Created' && (
                <button
                  onClick={() => navigate(`/logistics/orders/${order.id}/process`)}
                  className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Process Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600" />
                Products Ordered
              </h2>
              <div className="space-y-4">
                {order.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Qty: {product.quantity}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(product.unitPrice)} each</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(product.totalPrice)}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(order.products.reduce((sum, p) => sum + p.totalPrice, 0))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shipping ({order.shipping.method}):</span>
                    <span className="font-medium">{formatCurrency(order.shipping.cost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    <p>Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Method:</strong> {order.shipping.method}</p>
                    {order.shipping.carrier && <p><strong>Carrier:</strong> {order.shipping.carrier}</p>}
                    {order.shipping.trackingNumber && (
                      <p><strong>Tracking:</strong> {order.shipping.trackingNumber}</p>
                    )}
                    <p><strong>Est. Delivery:</strong> {formatDate(order.shipping.estimatedDelivery!)}</p>
                    {order.shipping.actualDelivery && (
                      <p><strong>Delivered:</strong> {formatDate(order.shipping.actualDelivery)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h2>
                <p className="text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Customer & Timeline */}
          <div className="space-y-6">
            {/* Doctor Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Ordering Physician
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{order.doctor.name}</p>
                  <p className="text-sm text-gray-600">{order.doctor.facility}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Phone: {order.doctor.phone}</p>
                  <p>Email: {order.doctor.email}</p>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-600" />
                Patient Information
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{order.patient.name}</p>
                  <p className="text-gray-600">DOB: {formatDate(order.patient.dateOfBirth)}</p>
                  <p className="text-gray-600">MRN: {order.patient.medicalRecordNumber}</p>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-green-600" />
                Order Timeline
              </h2>
              <div className="space-y-4">
                {order.timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      index === 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.action}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                      <p className="text-xs text-gray-600">by {event.user}</p>
                      {event.details && (
                        <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default LogisticsOrderDetailPage;