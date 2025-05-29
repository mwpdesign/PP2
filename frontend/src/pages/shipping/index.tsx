import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogisticsView from '../../components/orders/LogisticsView';
import DoctorShippingView from '../../components/doctor/shipping/DoctorShippingView';

const ShippingPage: React.FC = () => {
  const { user } = useAuth();

  // Role-based view switching
  if (user?.role === 'Doctor') {
    return <DoctorShippingView />;
  }

  // Default to logistics view for distributors and other roles
  return <LogisticsView />;
};

export default ShippingPage; 