import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ShippingDetailPage from '../shipping/[id]';

const ShippingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  useEffect(() => {
    console.log('🔍 DistributorShippingDetail Component Loaded');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Location pathname:', location.pathname);
    console.log('🆔 Shipment ID from params:', id);
    console.log('🔐 Auth token present:', !!localStorage.getItem('authToken'));
    console.log('👤 User role:', localStorage.getItem('userRole'));
  }, [id, location]);

  if (!id) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">No Shipment ID Found</h1>
        <p>Current URL: {window.location.href}</p>
        <p>Location pathname: {location.pathname}</p>
      </div>
    );
  }

  return (
    <ShippingDetailPage id={id} readOnly={true} userRole="master_distributor" />
  );
};

export default ShippingDetail;