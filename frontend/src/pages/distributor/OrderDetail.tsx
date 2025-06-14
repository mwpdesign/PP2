import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import OrderDetailPage from '../doctor/orders/[id]';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  useEffect(() => {
    console.log('🔍 DistributorOrderDetail Component Loaded');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Location pathname:', location.pathname);
    console.log('🆔 Order ID from params:', id);
    console.log('🔐 Auth token present:', !!localStorage.getItem('authToken'));
    console.log('👤 User role:', localStorage.getItem('userRole'));
  }, [id, location]);

  if (!id) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">No Order ID Found</h1>
        <p>Current URL: {window.location.href}</p>
        <p>Location pathname: {location.pathname}</p>
      </div>
    );
  }

  return (
    <div>
      <OrderDetailPage id={id} readOnly={true} userRole="master_distributor" />
    </div>
  );
};

export default OrderDetail;