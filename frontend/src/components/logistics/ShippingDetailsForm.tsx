import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/solid';

interface ShippingDetails {
  carrier: string;
  customCarrier?: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  shippingNotes: string;
}

interface ShippingDetailsFormProps {
  shippingDetails: ShippingDetails;
  onChange: (details: ShippingDetails) => void;
}

const ShippingDetailsForm: React.FC<ShippingDetailsFormProps> = ({
  shippingDetails,
  onChange
}) => {
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      if (shippingDetails.trackingNumber || shippingDetails.carrier) {
        setLastSaved(new Date());
        // In real app, this would trigger an API call to save progress
        console.log('Auto-saving shipping details:', shippingDetails);
      }
    }, 3000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [shippingDetails]);

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    onChange({
      ...shippingDetails,
      [field]: value
    });
  };

  const carriers = [
    { value: '', label: 'Select carrier...' },
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'usps', label: 'USPS' },
    { value: 'other', label: 'Other' }
  ];

  const getCarrierTrackingUrl = (carrier: string, trackingNumber: string) => {
    if (!trackingNumber.trim()) return null;

    switch (carrier) {
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'usps':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
      default:
        return null;
    }
  };

  const trackingUrl = getCarrierTrackingUrl(shippingDetails.carrier, shippingDetails.trackingNumber);

  // Calculate minimum delivery date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeliveryDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Carrier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <TruckIcon className="h-4 w-4 inline mr-1" />
          Shipping Carrier *
        </label>
        <select
          value={shippingDetails.carrier}
          onChange={(e) => handleInputChange('carrier', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
          required
        >
          {carriers.map((carrier) => (
            <option key={carrier.value} value={carrier.value}>
              {carrier.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Carrier Input */}
      {shippingDetails.carrier === 'other' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Carrier Name *
          </label>
          <input
            type="text"
            value={shippingDetails.customCarrier || ''}
            onChange={(e) => handleInputChange('customCarrier', e.target.value)}
            placeholder="Enter carrier name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            required
          />
        </div>
      )}

      {/* Tracking Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DocumentTextIcon className="h-4 w-4 inline mr-1" />
          Tracking Number *
        </label>
        <div className="relative">
          <input
            type="text"
            value={shippingDetails.trackingNumber}
            onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
            placeholder="Enter tracking number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 pr-10"
            required
          />
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-800"
              title="Track package"
            >
              <LinkIcon className="h-4 w-4" />
            </a>
          )}
        </div>
        {trackingUrl && (
          <p className="mt-1 text-xs text-gray-500">
            Click the link icon to track this package
          </p>
        )}
      </div>

      {/* Expected Delivery Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
          Expected Delivery Date
        </label>
        <input
          type="date"
          value={shippingDetails.expectedDeliveryDate}
          onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
          min={minDeliveryDate}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps with delivery planning
        </p>
      </div>

      {/* Shipping Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shipping Notes
        </label>
        <textarea
          value={shippingDetails.shippingNotes}
          onChange={(e) => handleInputChange('shippingNotes', e.target.value)}
          placeholder="Add any special shipping instructions or notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional - any special handling or delivery instructions
        </p>
      </div>

      {/* Auto-save Status */}
      {lastSaved && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Requirements</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              shippingDetails.carrier && shippingDetails.carrier !== '' ? 'bg-emerald-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-xs text-gray-600">Carrier selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              shippingDetails.trackingNumber.trim() ? 'bg-emerald-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-xs text-gray-600">Tracking number entered</span>
          </div>
          {shippingDetails.carrier === 'other' && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                shippingDetails.customCarrier?.trim() ? 'bg-emerald-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-xs text-gray-600">Custom carrier name provided</span>
            </div>
          )}
        </div>
      </div>

      {/* Carrier-specific Information */}
      {shippingDetails.carrier && shippingDetails.carrier !== 'other' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            {carriers.find(c => c.value === shippingDetails.carrier)?.label} Information
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            {shippingDetails.carrier === 'ups' && (
              <>
                <p>• Tracking numbers are typically 18 characters (1Z...)</p>
                <p>• Standard delivery: 1-5 business days</p>
              </>
            )}
            {shippingDetails.carrier === 'fedex' && (
              <>
                <p>• Tracking numbers are 12-14 digits</p>
                <p>• Standard delivery: 1-5 business days</p>
              </>
            )}
            {shippingDetails.carrier === 'usps' && (
              <>
                <p>• Tracking numbers vary by service type</p>
                <p>• Priority Mail: 1-3 business days</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingDetailsForm;