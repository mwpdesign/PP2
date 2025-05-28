import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import type { Order, IVRCommunication, LogisticsOrder } from '../../types/order';
import { sharedOrderStore } from '../../services/sharedOrderStore';

// We'll implement these components next
import ApprovedIVRList from './ApprovedIVRList';
import DirectOrderForm from './DirectOrderForm';
import IVRCommunicationThread from './IVRCommunication';
import OrderConfirmation from './OrderConfirmation';
import OrderHistory from './OrderHistory';

const OrderManagement: React.FC = () => {
  const [approvedIVRs, setApprovedIVRs] = useState<IVRCommunication[]>([]);
  const [selectedIVR, setSelectedIVR] = useState<IVRCommunication | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'list' | 'order' | 'confirmation'>('list');
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ivrData, orderData] = await Promise.all([
          orderService.getApprovedIVRs(),
          orderService.getOrderHistory()
        ]);
        setApprovedIVRs(ivrData);
        setOrders(orderData);
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleIVRSelect = (ivr: IVRCommunication) => {
    setSelectedIVR(ivr);
    setView('order');
  };

  const handleOrderSubmit = async (orderData: any) => {
    try {
      const createdOrder = await orderService.createOrder(orderData);
      setNewOrder(createdOrder);
      setOrders([createdOrder, ...orders]);
      
      // Add to shared store for logistics
      const logisticsOrder: LogisticsOrder = {
        id: createdOrder.id,
        orderDate: createdOrder.createdAt,
        priority: 'standard' as const,
        status: 'pending',
        patient: {
          name: 'Patient Name', // TODO: Get from patient service
          contact: 'Patient Contact'
        },
        doctor: {
          name: 'Doctor Name', // TODO: Get from provider service
          npi: createdOrder.facilityCredentials.npiNumber
        },
        facility: {
          name: createdOrder.facilityCredentials.officeContact,
          physicianName: 'Doctor Name', // TODO: Get from provider service
          npiNumber: createdOrder.facilityCredentials.npiNumber,
          medicareProviderNumber: createdOrder.facilityCredentials.medicareProviderId,
          taxId: createdOrder.facilityCredentials.taxId,
          medicaidProviderNumber: createdOrder.facilityCredentials.medicaidProviderId,
          officeContact: createdOrder.facilityCredentials.officeContact,
          phone: createdOrder.facilityCredentials.phone,
          fax: createdOrder.facilityCredentials.fax,
          shippingAddress: createdOrder.facilityCredentials.shippingAddress,
          businessHours: '9:00 AM - 5:00 PM', // TODO: Get from facility service
          specialInstructions: ''
        },
        product: {
          type: createdOrder.graftSelection.type,
          size: createdOrder.graftSelection.size.toLowerCase() as 'small' | 'medium' | 'large',
          quantity: createdOrder.graftSelection.quantity,
          specialRequirements: []
        },
        ivrApproval: {
          authorizationNumber: createdOrder.ivrId,
          approvalDocuments: createdOrder.approvalDocuments.map(doc => ({
            id: doc.id,
            type: doc.type,
            url: doc.url,
            name: doc.name,
            uploadedAt: doc.timestamp
          })),
          ivrSpecialist: 'IVR Specialist' // TODO: Get from IVR service
        },
        logistics: {
          assignedTo: undefined,
          estimatedShipDate: undefined,
          trackingNumber: undefined,
          carrier: undefined,
          notes: undefined
        }
      };
      
      sharedOrderStore.addOrder(logisticsOrder);
      setView('confirmation');
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedIVR(null);
    setNewOrder(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-600 mt-1">
              {view === 'list' 
                ? 'Select an approved IVR to place an order'
                : view === 'order'
                ? 'Place order for approved IVR'
                : 'Order confirmation'}
            </p>
          </div>
          {view !== 'list' && (
            <button
              onClick={handleBackToList}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to List
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {view === 'list' && (
          <ApprovedIVRList
            approvedIVRs={approvedIVRs}
            onSelect={handleIVRSelect}
          />
        )}

        {view === 'order' && selectedIVR && (
          <div className="p-6">
            <IVRCommunicationThread ivrData={selectedIVR} />
            <DirectOrderForm
              ivrData={selectedIVR}
              onSubmit={handleOrderSubmit}
            />
          </div>
        )}

        {view === 'confirmation' && newOrder && (
          <OrderConfirmation
            order={newOrder}
            onBackToList={handleBackToList}
          />
        )}
      </div>

      {/* Order History Section */}
      <OrderHistory orders={orders} />
    </div>
  );
};

export default OrderManagement; 