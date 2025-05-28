import React from 'react';
import OrderManagement from '../../components/orders/OrderManagement';

const OrderManagementPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      <OrderManagement />
    </div>
  );
};

export default OrderManagementPage; 