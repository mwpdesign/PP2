import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../../../components/shared/layout/UnifiedDashboardLayout';
import DocumentUploadZone from '../../../../components/logistics/DocumentUploadZone';
import ShippingDetailsForm from '../../../../components/logistics/ShippingDetailsForm';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  TruckIcon,
  ArchiveBoxIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QueueListIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { LogisticsOrder } from '../../../../types/order';

interface ShippingDocument {
  id: string;
  type: 'shipping_label' | 'packing_slip' | 'invoice' | 'other';
  name: string;
  file: File;
  uploadedAt: string;
}

interface ShippingDetails {
  carrier: string;
  customCarrier?: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  shippingNotes: string;
}

const OrderProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // State management
  const [order, setOrder] = useState<LogisticsOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [documents, setDocuments] = useState<ShippingDocument[]>([]);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    carrier: '',
    customCarrier: '',
    trackingNumber: '',
    expectedDeliveryDate: '',
    shippingNotes: ''
  });

  // Role protection
  if (user?.role !== 'Shipping and Logistics') {
    return <Navigate to="/dashboard" replace />;
  }

  // Mock order data - in real app, this would come from API
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockOrder: LogisticsOrder = {
          id: id || 'ORD-2024-001',
          orderDate: '2024-06-10T10:30:00Z',
          priority: 'standard',
          status: 'processing',
          patient: {
            name: 'P-12345',
            contact: 'Contact via facility'
          },
          doctor: {
            name: 'Dr. Sarah Johnson',
            npi: '1234567890'
          },
          facility: {
            name: 'Chicago Medical Center',
            physicianName: 'Dr. Sarah Johnson',
            npiNumber: '1234567890',
            medicareProviderNumber: 'MED123456',
            taxId: '12-3456789',
            medicaidProviderNumber: 'MCAID123456',
            officeContact: 'Sarah Johnson, MD',
            phone: '(555) 123-4567',
            fax: '(555) 123-4568',
            shippingAddress: {
              street: '123 Medical Center Drive',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601',
              country: 'USA'
            },
            businessHours: 'Mon-Fri 8:00 AM - 6:00 PM',
            specialInstructions: 'Deliver to main reception desk. Call upon arrival.'
          },
          product: {
            type: 'type_a',
            size: 'medium',
            quantity: 2,
            specialRequirements: ['Temperature controlled', 'Handle with care']
          },
          ivrApproval: {
            authorizationNumber: 'AUTH-2024-001',
            approvalDocuments: [
              {
                id: 'doc1',
                type: 'application/pdf',
                url: '/docs/approval.pdf',
                name: 'Insurance Approval Letter',
                uploadedAt: '2024-06-10T09:00:00Z'
              }
            ],
            ivrSpecialist: 'Jennifer Martinez'
          },
          logistics: {
            assignedTo: 'Current User',
            estimatedShipDate: '2024-06-11',
            notes: 'Rush order - patient needs treatment ASAP'
          }
        };

        setOrder(mockOrder);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/logistics/dashboard', icon: HomeIcon },
    { name: 'Shipping Queue', href: '/logistics/shipping-queue', icon: QueueListIcon },
    { name: 'Shipment Processing', href: '/logistics/shipments', icon: TruckIcon },
    { name: 'Inventory Management', href: '/logistics/inventory', icon: ArchiveBoxIcon },
    { name: 'Delivery Tracking', href: '/logistics/tracking', icon: MapIcon },
    { name: 'Warehouse Operations', href: '/logistics/warehouse', icon: BuildingStorefrontIcon },
    { name: 'Reports', href: '/logistics/reports', icon: ClipboardDocumentListIcon },
    { name: 'Settings', href: '/logistics/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Logistics Coordinator',
    role: 'Shipping & Logistics',
    avatar: user?.first_name?.charAt(0) || 'L'
  };

  const handleDocumentUpload = (newDocuments: ShippingDocument[]) => {
    setDocuments(prev => [...prev, ...newDocuments]);
    toast.success(`${newDocuments.length} document(s) uploaded successfully`);
  };

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Document deleted successfully');
  };

  const handleShippingDetailsChange = (details: ShippingDetails) => {
    setShippingDetails(details);
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsShipped = async () => {
    // Validation
    const hasShippingLabel = documents.some(doc => doc.type === 'shipping_label');
    if (!hasShippingLabel) {
      toast.error('Shipping label is required before marking as shipped');
      return;
    }

    if (!shippingDetails.trackingNumber.trim()) {
      toast.error('Tracking number is required before marking as shipped');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to mark this order as shipped? This action cannot be undone.'
    );

    if (!confirmed) return;

    setShipping(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Order marked as shipped successfully!');

      // Check for next order in sequence
      const nextOrderId = sessionStorage.getItem('nextOrderId');
      if (nextOrderId) {
        const processNext = window.confirm('Order shipped! Process next order?');
        if (processNext) {
          navigate(`/logistics/orders/${nextOrderId}/process`);
          return;
        }
      }

      // Return to queue
      navigate('/logistics/shipping-queue');
    } catch (error) {
      console.error('Error marking as shipped:', error);
      toast.error('Failed to mark order as shipped');
    } finally {
      setShipping(false);
    }
  };

  const handleCancel = () => {
    const hasUnsavedChanges = documents.length > 0 ||
      shippingDetails.trackingNumber ||
      shippingDetails.carrier;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }

    navigate('/logistics/shipping-queue');
  };

  const canMarkAsShipped = documents.some(doc => doc.type === 'shipping_label') &&
                          shippingDetails.trackingNumber.trim();

  if (loading) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!order) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The requested order could not be found.</p>
          <button
            onClick={() => navigate('/logistics/shipping-queue')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Shipping Queue
          </button>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/logistics/shipping-queue')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Process Order {order.id}</h1>
                <p className="text-gray-600 mt-1">Complete shipping details and mark as shipped</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.priority === 'rush' ? 'bg-red-100 text-red-800' :
                order.priority === 'urgent' ? 'bg-amber-100 text-amber-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)} Priority
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Processing
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{order.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IVR Reference</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{order.ivrApproval.authorizationNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <p className="mt-1 text-sm text-gray-900">{order.patient.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date</label>
                    <div className="flex items-center mt-1">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor & Facility Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor & Facility Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.doctor.name}</p>
                    <p className="text-sm text-gray-600">NPI: {order.doctor.npi}</p>
                    <p className="text-sm text-gray-600">Phone: {order.facility.phone}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.facility.name}</p>
                    <p className="text-sm text-gray-600">Contact: {order.facility.officeContact}</p>
                    <p className="text-sm text-gray-600">Fax: {order.facility.fax}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shipping Address</p>
                    <p className="text-sm text-gray-600">{order.facility.shippingAddress.street}</p>
                    <p className="text-sm text-gray-600">
                      {order.facility.shippingAddress.city}, {order.facility.shippingAddress.state} {order.facility.shippingAddress.zipCode}
                    </p>
                    {order.facility.specialInstructions && (
                      <p className="text-sm text-amber-700 mt-2 p-2 bg-amber-50 rounded">
                        <strong>Special Instructions:</strong> {order.facility.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products to Ship */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Products to Ship</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Amniotic Skin Graft - Type {order.product.type.toUpperCase().slice(-1)}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            Size: {order.product.size}
                          </p>
                          {order.product.specialRequirements.length > 0 && (
                            <div className="mt-2">
                              {order.product.specialRequirements.map((req, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2 mb-1"
                                >
                                  {req}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {order.product.quantity}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                        ASG-{order.product.type.toUpperCase()}-{order.product.size.toUpperCase().slice(0, 1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Document Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Documents</h2>
              <DocumentUploadZone
                documents={documents}
                onDocumentUpload={handleDocumentUpload}
                onDocumentDelete={handleDocumentDelete}
              />
            </div>

            {/* Shipping Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Details</h2>
              <ShippingDetailsForm
                shippingDetails={shippingDetails}
                onChange={handleShippingDetailsChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleMarkAsShipped}
                  disabled={!canMarkAsShipped || shipping}
                  className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                    canMarkAsShipped && !shipping
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {shipping ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Marking as Shipped...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveProgress}
                  disabled={saving}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Save Progress
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {!canMarkAsShipped && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        <strong>Requirements to ship:</strong>
                      </p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {!documents.some(doc => doc.type === 'shipping_label') && (
                          <li>Upload shipping label</li>
                        )}
                        {!shippingDetails.trackingNumber.trim() && (
                          <li>Enter tracking number</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default OrderProcessingPage;