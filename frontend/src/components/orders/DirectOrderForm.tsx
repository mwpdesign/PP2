import React, { useState, useEffect } from 'react';
import type { IVRCommunication, Order, GraftSelection, FacilityCredentials } from '../../types/order';
import { orderService, GRAFT_PRODUCTS } from '../../services/orderService';

interface DirectOrderFormProps {
  ivrData: IVRCommunication;
  onSubmit: (orderData: Partial<Order>) => Promise<void>;
}

const DirectOrderForm: React.FC<DirectOrderFormProps> = ({ ivrData, onSubmit }) => {
  const [graftSelection, setGraftSelection] = useState<GraftSelection>({
    type: 'type_a',
    size: 'Small',
    quantity: 1
  });
  const [facilityCredentials, setFacilityCredentials] = useState<FacilityCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        const data = await orderService.getFacilityCredentials(ivrData.doctorId);
        setFacilityCredentials(data);
      } catch (err) {
        setError('Error loading facility data');
      }
    };

    fetchFacilityData();
  }, [ivrData.doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityCredentials) {
      setError('Facility credentials are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        ivrId: ivrData.ivrId,
        patientId: ivrData.patientId,
        doctorId: ivrData.doctorId,
        facilityCredentials,
        graftSelection,
        approvalDocuments: ivrData.documents,
        communicationThread: ivrData
      });
    } catch (err) {
      setError('Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (!facilityCredentials) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center">
        <p className="text-gray-500">Loading facility information...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Place Order</h3>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Graft Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Graft Type
          </label>
          <select
            value={graftSelection.type}
            onChange={(e) => setGraftSelection({
              ...graftSelection,
              type: e.target.value as 'type_a' | 'type_b'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="type_a">Amniotic Skin Graft - Type A</option>
            <option value="type_b">Amniotic Skin Graft - Type B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size
          </label>
          <select
            value={graftSelection.size}
            onChange={(e) => setGraftSelection({
              ...graftSelection,
              size: e.target.value as 'Small' | 'Medium' | 'Large'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={graftSelection.quantity}
            onChange={(e) => setGraftSelection({
              ...graftSelection,
              quantity: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
          />
        </div>

        {/* Facility Information Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping to Facility:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">NPI Number:</p>
              <p className="font-medium">{facilityCredentials.npiNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Medicare Provider ID:</p>
              <p className="font-medium">{facilityCredentials.medicareProviderId}</p>
            </div>
            <div>
              <p className="text-gray-500">Contact:</p>
              <p className="font-medium">{facilityCredentials.officeContact}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone:</p>
              <p className="font-medium">{facilityCredentials.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Shipping Address:</p>
              <p className="font-medium">
                {facilityCredentials.shippingAddress.street}<br />
                {facilityCredentials.shippingAddress.city}, {facilityCredentials.shippingAddress.state} {facilityCredentials.shippingAddress.zipCode}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
            }`}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectOrderForm; 