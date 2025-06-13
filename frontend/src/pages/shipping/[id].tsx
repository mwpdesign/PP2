import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ClipboardIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EyeIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import { formatDate } from '../../utils/formatters';

interface ShipmentResponse {
  id: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  doctorName: string;
  facility: string;
  trackingNumber: string;
  carrier: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other';
  status: 'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  shippedDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  destination: string;
  distributor: string;
  region: string;
  packageCount: number;
  weight: string;
  priority: 'standard' | 'expedited' | 'overnight';
  lastUpdate: string;
  currentLocation?: string;
  shippingAddress: {
    facility_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    attention?: string;
    phone?: string;
  };
  packageContents: Array<{
    productName: string;
    qCode: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalValue: number;
  specialInstructions?: string;
  deliveryProof?: {
    signedBy: string;
    signatureUrl?: string;
    photoUrl?: string;
    deliveredAt: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    location: string;
    description: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
}

interface ShippingDetailPageProps {
  id?: string;
  readOnly?: boolean;
  userRole?: string;
}

const ShippingDetailPage: React.FC<ShippingDetailPageProps> = ({
  id: propId,
  readOnly = false,
  userRole = 'logistics'
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propId || paramId;
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch shipment details
  const fetchShipmentDetails = async () => {
    if (!id) return;

    try {
      setError(null);
      const response = await fetch(`/api/v1/shipments/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipment not found');
        }
        throw new Error(`Failed to fetch shipment details: ${response.status}`);
      }

      const shipmentData: ShipmentResponse = await response.json();
      setShipment(shipmentData);
    } catch (err) {
      console.error('Error fetching shipment details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shipment details');

      // Fallback to mock data for testing
      const mockShipments: ShipmentResponse[] = [
        {
          id: 'SHP-2024-001',
          orderId: 'ORD-2024-001',
          orderNumber: 'ORD-2024-001',
          patientName: 'John Smith',
          doctorName: 'Dr. Sarah Chen',
          facility: 'Metro General Hospital',
          trackingNumber: '1Z999AA1234567890',
          carrier: 'UPS',
          status: 'delivered',
          shippedDate: '2024-12-19T10:00:00Z',
          estimatedDelivery: '2024-12-20T17:00:00Z',
          actualDelivery: '2024-12-20T14:30:00Z',
          destination: 'New York, NY',
          distributor: 'MedSupply East',
          region: 'East Coast',
          packageCount: 2,
          weight: '15.2 lbs',
          priority: 'standard',
          lastUpdate: '2024-12-20T14:30:00Z',
          currentLocation: 'Delivered',
          shippingAddress: {
            facility_name: 'Metro General Hospital',
            address_line1: '1500 Medical Center Drive',
            address_line2: 'Wound Care Unit - Building A',
            city: 'New York',
            state: 'NY',
            zip_code: '10001',
            attention: 'Dr. Sarah Chen - Wound Care Department',
            phone: '(555) 123-4567'
          },
          packageContents: [
            {
              productName: 'Advanced Skin Graft - Type A',
              qCode: 'Q4100',
              quantity: 2,
              unitPrice: 750.00,
              total: 1500.00
            },
            {
              productName: 'Antimicrobial Wound Dressing',
              qCode: 'A6196',
              quantity: 5,
              unitPrice: 50.00,
              total: 250.00
            }
          ],
          totalValue: 1750.00,
          specialInstructions: 'Temperature sensitive - keep refrigerated. Deliver to Wound Care Unit reception.',
          deliveryProof: {
            signedBy: 'M. Garcia - Receiving Clerk',
            deliveredAt: '2024-12-20T14:30:00Z'
          },
          timeline: [
            {
              status: 'preparing',
              timestamp: '2024-12-19T08:00:00Z',
              location: 'MedSupply East Warehouse',
              description: 'Package prepared for shipment'
            },
            {
              status: 'picked_up',
              timestamp: '2024-12-19T10:00:00Z',
              location: 'MedSupply East Warehouse',
              description: 'Package picked up by UPS'
            },
            {
              status: 'in_transit',
              timestamp: '2024-12-19T15:30:00Z',
              location: 'UPS Facility - Newark, NJ',
              description: 'Package in transit'
            },
            {
              status: 'out_for_delivery',
              timestamp: '2024-12-20T08:00:00Z',
              location: 'UPS Facility - Manhattan, NY',
              description: 'Out for delivery'
            },
            {
              status: 'delivered',
              timestamp: '2024-12-20T14:30:00Z',
              location: 'Metro General Hospital',
              description: 'Package delivered and signed for'
            }
          ],
          documents: [
            {
              id: 'doc-1',
              name: 'Shipping_Label.pdf',
              type: 'shipping_label',
              url: '/documents/shipping_label.pdf',
              uploadedAt: '2024-12-19T10:00:00Z',
              uploadedBy: 'System'
            },
            {
              id: 'doc-2',
              name: 'Delivery_Confirmation.pdf',
              type: 'delivery_proof',
              url: '/documents/delivery_confirmation.pdf',
              uploadedAt: '2024-12-20T14:30:00Z',
              uploadedBy: 'UPS Driver'
            }
          ]
        },
        {
          id: 'SHP-2024-002',
          orderId: 'ORD-2024-002',
          orderNumber: 'ORD-2024-002',
          patientName: 'Emily Davis',
          doctorName: 'Dr. Michael Rodriguez',
          facility: 'St. Mary\'s Medical Center',
          trackingNumber: '7712345678901234',
          carrier: 'FedEx',
          status: 'out_for_delivery',
          shippedDate: '2024-12-20T09:00:00Z',
          estimatedDelivery: '2024-12-21T17:00:00Z',
          destination: 'Phoenix, AZ',
          distributor: 'HealthCare Partners',
          region: 'Southwest',
          packageCount: 3,
          weight: '22.8 lbs',
          priority: 'expedited',
          lastUpdate: '2024-12-21T08:15:00Z',
          currentLocation: 'Phoenix, AZ - Out for delivery',
          shippingAddress: {
            facility_name: 'St. Mary\'s Medical Center',
            address_line1: '900 E 30th Street',
            city: 'Phoenix',
            state: 'AZ',
            zip_code: '85016',
            attention: 'Dr. Michael Rodriguez - Surgery Department',
            phone: '(555) 987-6543'
          },
          packageContents: [
            {
              productName: 'Collagen Matrix Implant',
              qCode: 'Q4110',
              quantity: 3,
              unitPrice: 850.00,
              total: 2550.00
            }
          ],
          totalValue: 2550.00,
          specialInstructions: 'Expedited delivery required. Contact facility before delivery.',
          timeline: [
            {
              status: 'preparing',
              timestamp: '2024-12-20T07:00:00Z',
              location: 'HealthCare Partners Warehouse',
              description: 'Package prepared for expedited shipment'
            },
            {
              status: 'picked_up',
              timestamp: '2024-12-20T09:00:00Z',
              location: 'HealthCare Partners Warehouse',
              description: 'Package picked up by FedEx'
            },
            {
              status: 'in_transit',
              timestamp: '2024-12-20T14:30:00Z',
              location: 'FedEx Facility - Albuquerque, NM',
              description: 'Package in transit'
            },
            {
              status: 'in_transit',
              timestamp: '2024-12-21T06:00:00Z',
              location: 'FedEx Facility - Phoenix, AZ',
              description: 'Arrived at destination facility'
            },
            {
              status: 'out_for_delivery',
              timestamp: '2024-12-21T08:15:00Z',
              location: 'Phoenix, AZ',
              description: 'Out for delivery - expedited service'
            }
          ],
          documents: [
            {
              id: 'doc-3',
              name: 'Expedited_Shipping_Label.pdf',
              type: 'shipping_label',
              url: '/documents/expedited_shipping_label.pdf',
              uploadedAt: '2024-12-20T09:00:00Z',
              uploadedBy: 'System'
            }
          ]
        }
      ];

      const mockShipment = mockShipments.find(s => s.id === id);
      if (mockShipment) {
        setShipment(mockShipment);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentDetails();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const badges = {
      preparing: { className: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full', label: 'Preparing' },
      picked_up: { className: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full', label: 'Picked Up' },
      in_transit: { className: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full', label: 'In Transit' },
      out_for_delivery: { className: 'px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full', label: 'Out for Delivery' },
      delivered: { className: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full', label: 'Delivered' },
      exception: { className: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full', label: 'Exception' }
    };
    return badges[status as keyof typeof badges] || badges.preparing;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      standard: { className: 'px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full', label: 'Standard' },
      expedited: { className: 'px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full', label: 'Expedited' },
      overnight: { className: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full', label: 'Overnight' }
    };
    return badges[priority as keyof typeof badges] || badges.standard;
  };

  const getCarrierColor = (carrier: string) => {
    const colors = {
      UPS: 'text-amber-600',
      FedEx: 'text-purple-600',
      USPS: 'text-blue-600',
      DHL: 'text-yellow-600',
      Other: 'text-gray-600'
    };
    return colors[carrier as keyof typeof colors] || colors.Other;
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const urls = {
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      DHL: `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`
    };
    return urls[carrier as keyof typeof urls];
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (readOnly) return;

    setUpdating(true);
    try {
      // API call to update status
      console.log('Updating shipment status to:', newStatus);
      // In real implementation, make API call here
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintLabel = () => {
    console.log('Printing shipping label for:', id);
    // In real implementation, generate and print label
  };

  const handleContactCarrier = () => {
    console.log('Contacting carrier for:', shipment?.carrier);
    // In real implementation, open carrier contact form
  };

  const handleViewOrder = () => {
    if (shipment?.orderId) {
      const orderPath = userRole === 'master_distributor'
        ? `/distributor/orders/${shipment.orderId}`
        : `/orders/${shipment.orderId}`;
      navigate(orderPath);
    }
  };

  const handleDownloadDocument = (doc: any) => {
    console.log('Downloading document:', doc.name);
    // In real implementation, download document
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <TruckIcon className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Shipment Not Found</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!shipment) return null;

  const statusBadge = getStatusBadge(shipment.status);
  const priorityBadge = getPriorityBadge(shipment.priority);
  const carrierColor = getCarrierColor(shipment.carrier);
  const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <TruckIcon className="h-8 w-8 text-slate-600" />
                  Shipment Details
                  {readOnly && (
                    <span className="text-sm font-medium bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                      Read Only
                    </span>
                  )}
                </h1>
                <p className="text-slate-600 mt-1">
                  {shipment.id} • {shipment.carrier} • {shipment.trackingNumber}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!readOnly && userRole === 'logistics' && (
                <>
                  <button
                    onClick={handlePrintLabel}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print Label
                  </button>
                  <button
                    onClick={handleContactCarrier}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Contact Carrier
                  </button>
                </>
              )}
              <button
                onClick={handleViewOrder}
                className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Order
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipment Overview */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5" />
                  Shipment Overview
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Shipment Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shipment ID</label>
                        <p className="text-base font-bold text-slate-800">{shipment.id}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Reference</label>
                        <p className="text-base font-bold text-slate-800">{shipment.orderNumber}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={statusBadge.className}>{statusBadge.label}</span>
                          <span className={priorityBadge.className}>{priorityBadge.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Tracking Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Carrier</label>
                        <p className={`text-base font-bold ${carrierColor}`}>{shipment.carrier}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tracking Number</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-base font-bold text-slate-800">{shipment.trackingNumber}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(shipment.trackingNumber)}
                            className="text-slate-600 hover:text-slate-800 transition-colors"
                            title="Copy tracking number"
                          >
                            <ClipboardIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {trackingUrl && (
                        <div>
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Track on {shipment.carrier} Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Package Details</label>
                      <p className="text-base font-bold text-slate-800 mt-1">
                        {shipment.packageCount} package{shipment.packageCount !== 1 ? 's' : ''} • {shipment.weight}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Value</label>
                      <p className="text-base font-bold text-slate-800 mt-1">
                        ${shipment.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Update</label>
                      <p className="text-base font-bold text-slate-800 mt-1">
                        {formatDate(shipment.lastUpdate)}
                      </p>
                    </div>
                  </div>
                </div>

                {shipment.currentLocation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-800">Current Location</p>
                        <p className="text-blue-700">{shipment.currentLocation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Package Contents */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Package Contents
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {shipment.packageContents.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{item.productName}</h4>
                        <p className="text-sm text-slate-600">Q-Code: {item.qCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">Qty: {item.quantity}</p>
                        <p className="text-sm text-slate-600">${item.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Total Package Value:</span>
                  <span className="text-xl font-bold text-slate-800">${shipment.totalValue.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Shipping Timeline */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Shipping Timeline
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {shipment.timeline.map((event, index) => {
                    const isLast = index === shipment.timeline.length - 1;
                    const eventBadge = getStatusBadge(event.status);

                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.status === shipment.status ? 'bg-blue-600' : 'bg-slate-300'
                          }`}></div>
                          {!isLast && <div className="w-0.5 h-8 bg-slate-200 mt-2"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={eventBadge.className}>{eventBadge.label}</span>
                            <span className="text-sm text-slate-500">{formatDate(event.timestamp)}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{event.description}</p>
                          <p className="text-sm text-slate-600">{event.location}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  Delivery Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Patient & Provider</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Patient:</span>
                      <span className="font-medium text-slate-800">{shipment.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Doctor:</span>
                      <span className="font-medium text-slate-800">{shipment.doctorName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Delivery Address</h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-slate-800">{shipment.shippingAddress.facility_name}</p>
                    <p className="text-slate-600">{shipment.shippingAddress.address_line1}</p>
                    {shipment.shippingAddress.address_line2 && (
                      <p className="text-slate-600">{shipment.shippingAddress.address_line2}</p>
                    )}
                    <p className="text-slate-600">
                      {shipment.shippingAddress.city}, {shipment.shippingAddress.state} {shipment.shippingAddress.zip_code}
                    </p>
                    {shipment.shippingAddress.attention && (
                      <p className="text-sm text-slate-500 mt-2">
                        Attention: {shipment.shippingAddress.attention}
                      </p>
                    )}
                    {shipment.shippingAddress.phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <PhoneIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{shipment.shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Delivery Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Shipped:</span>
                      <span className="font-medium text-slate-800">{formatDate(shipment.shippedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {shipment.actualDelivery ? 'Delivered:' : 'Estimated:'}
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatDate(shipment.actualDelivery || shipment.estimatedDelivery)}
                      </span>
                    </div>
                  </div>
                </div>

                {shipment.deliveryProof && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      Delivery Confirmation
                    </h4>
                    <p className="text-sm text-green-700">
                      Signed by: {shipment.deliveryProof.signedBy}
                    </p>
                    <p className="text-xs text-green-600">
                      {formatDate(shipment.deliveryProof.deliveredAt)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Special Instructions */}
            {shipment.specialInstructions && (
              <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Special Instructions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800">{shipment.specialInstructions}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Documents */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Documents
                </h3>
              </div>
              <div className="p-6">
                {shipment.documents.length > 0 ? (
                  <div className="space-y-3">
                    {shipment.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-800">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              {doc.type} • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No documents available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Distributor Information */}
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  Distribution Network
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Distributor</label>
                  <p className="text-base font-bold text-slate-800">{shipment.distributor}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Region</label>
                  <p className="text-base font-bold text-slate-800">{shipment.region}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDetailPage;
export { ShippingDetailPage };