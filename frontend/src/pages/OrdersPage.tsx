import React, { useState } from 'react';

interface Order {
  id: string;
  patientName: string;
  type: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  total: string;
  items: number;
  priority: 'Standard' | 'Express' | 'Urgent';
}

const OrdersPage: React.FC = () => {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const orders: Order[] = [
    {
      id: 'ORD-001',
      patientName: 'John Smith',
      type: 'Medical Supplies',
      status: 'Processing',
      date: '2024-03-20',
      total: '$245.00',
      items: 3,
      priority: 'Standard'
    },
    {
      id: 'ORD-002',
      patientName: 'Sarah Johnson',
      type: 'Prescription',
      status: 'Shipped',
      date: '2024-03-19',
      total: '$89.99',
      items: 1,
      priority: 'Express'
    },
    {
      id: 'ORD-003',
      patientName: 'Michael Brown',
      type: 'Equipment',
      status: 'Delivered',
      date: '2024-03-18',
      total: '$1,299.00',
      items: 2,
      priority: 'Urgent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-600 mt-1">Track and manage patient orders</p>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] transition-colors"
          >
            New Order
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Orders', value: '156', subtext: 'This month' },
            { label: 'Processing', value: '23', subtext: 'Pending shipment' },
            { label: 'Shipped', value: '45', subtext: 'In transit' },
            { label: 'Delivered', value: '88', subtext: 'Successfully completed' }
          ].map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="">All Priorities</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Order ID</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Patient</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Total</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4 font-medium">{order.patientName}</td>
                  <td className="py-3 px-4">{order.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      order.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                      order.priority === 'Express' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">{order.date}</td>
                  <td className="py-3 px-4">{order.total}</td>
                  <td className="py-3 px-4">
                    <button className="text-[#2E86AB] hover:text-[#247297] font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create New Order</h2>
              <button
                onClick={() => setShowNewOrder(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
                  <option value="">Select Type</option>
                  <option value="medical-supplies">Medical Supplies</option>
                  <option value="prescription">Prescription</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items
                </label>
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white">
                      <option value="">Select Item</option>
                      <option value="item1">Item 1</option>
                      <option value="item2">Item 2</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-[#2E86AB] hover:text-[#247297]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewOrder(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297]"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 