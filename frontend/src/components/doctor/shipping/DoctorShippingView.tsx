import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { sharedOrderStore } from '../../../services/sharedOrderStore';
import ShippedOrderCard from './ShippedOrderCard';
import MarkReceivedModal from './MarkReceivedModal';
import type { LogisticsOrder } from '../../../types/order';

interface ShippedOrder {
  id: string;
  patientName: string;
  patientId: string;
  items: Array<{
    name: string;
    quantity: number;
    sku: string;
  }>;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedDate?: string;
  carrier?: string;
  priority: string;
  orderDate: string;
}

const DoctorShippingView: React.FC = () => {
  const { user } = useAuth();
  const [shippedOrders, setShippedOrders] = useState<ShippedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ShippedOrder | null>(null);
  const [showMarkReceivedModal, setShowMarkReceivedModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShippedOrders();
    // Subscribe to order updates
    const unsubscribe = sharedOrderStore.subscribe(() => {
      loadShippedOrders();
    });
    return unsubscribe;
  }, []);

  const loadShippedOrders = () => {
    try {
      const allOrders = sharedOrderStore.getOrders();
      // Filter for shipped orders and convert to ShippedOrder format
      const shipped = allOrders
        .filter(order => order.status === 'shipped' || order.status === 'delivered')
        .map((order: LogisticsOrder): ShippedOrder => ({
          id: order.id,
          patientName: order.patient.name,
          patientId: order.patient.contact, // Using contact as patientId
          items: [{
            name: `${order.product.type.toUpperCase()} - ${order.product.size} Size`,
            quantity: order.product.quantity,
            sku: `SKU-${order.product.type}-${order.product.size}`
          }],
          status: order.status,
          trackingNumber: order.logistics.trackingNumber,
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          shippedDate: order.logistics.estimatedShipDate || order.orderDate,
          carrier: order.logistics.carrier,
          priority: order.priority,
          orderDate: order.orderDate
        }));
      
      setShippedOrders(shipped);
    } catch (err) {
      setError('Failed to load shipped orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = (order: ShippedOrder) => {
    setSelectedOrder(order);
    setShowMarkReceivedModal(true);
  };

  const confirmMarkAsReceived = () => {
    if (selectedOrder) {
      // Update order status to delivered
      sharedOrderStore.updateOrderStatus(selectedOrder.id, 'delivered');
      setShowMarkReceivedModal(false);
      setSelectedOrder(null);
      loadShippedOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E86AB]"></div>
          <p className="text-slate-600">Loading your shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and confirm delivery of your medical supply orders
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  Welcome back, {user?.firstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipped Orders Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Shipments ({shippedOrders.length})
            </h2>
            <div className="text-sm text-gray-500">
              Orders shipped to your facility
            </div>
          </div>

          {shippedOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4l-4-4m0 0l-4 4m4-4v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Shipments Yet</h3>
              <p className="text-gray-500">Your shipped orders will appear here when they're sent</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {shippedOrders.map((order) => (
                <ShippedOrderCard
                  key={order.id}
                  order={order}
                  onMarkAsReceived={handleMarkAsReceived}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mark as Received Modal */}
      {showMarkReceivedModal && selectedOrder && (
        <MarkReceivedModal
          order={selectedOrder}
          onConfirm={confirmMarkAsReceived}
          onCancel={() => {
            setShowMarkReceivedModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default DoctorShippingView; 