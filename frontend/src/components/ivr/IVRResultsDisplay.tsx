import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, ClipboardDocumentListIcon, EyeIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { orderApiService } from '../../services/orderApiService';
import toast from 'react-hot-toast';

interface IVRResults {
  caseNumber: string;
  verificationDate: string;
  coverageStatus: "Covered" | "Not Covered" | "Partial";
  coveragePercentage: number;
  deductibleAmount: number;
  copayAmount: number;
  outOfPocketMax: number;
  priorAuthStatus: "Approved" | "Denied" | "Pending";
  coverageDetails: string;
  coverageNotes: string;
}

interface IVRResultsDisplayProps {
  results: IVRResults;
  className?: string;
  showOrderButton?: boolean;
  onOrderClick?: () => void;
  ivrId?: string;
  onNavigateToOrder?: (orderId: string) => void;
}

const IVRResultsDisplay: React.FC<IVRResultsDisplayProps> = ({
  results,
  className = "",
  showOrderButton = false,
  onOrderClick,
  ivrId,
  onNavigateToOrder
}) => {
  const { hasPermission } = usePermissions();
  const [existingOrder, setExistingOrder] = useState<{ exists: boolean; orderId?: string; orderNumber?: string }>({ exists: false });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);

  // Check if order already exists for this IVR
  useEffect(() => {
    if (ivrId && showOrderButton) {
      checkExistingOrder();
    }
  }, [ivrId, showOrderButton]);

  const checkExistingOrder = async () => {
    if (!ivrId) return;

    setIsCheckingOrder(true);
    try {
      const orderCheck = await orderApiService.checkOrderExistsForIVR(ivrId);
      setExistingOrder(orderCheck);
    } catch (error) {
      console.error('Error checking existing order:', error);
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!ivrId) {
      console.error('No IVR ID provided for order creation');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const response = await orderApiService.createOrderFromIVR(ivrId);

      // Show success toast
      toast.success(
        `Order ${response.order.order_number} created successfully!`,
        {
          duration: 6000,
          style: {
            background: '#10b981',
            color: 'white',
          },
        }
      );

      // Update existing order state
      setExistingOrder({
        exists: true,
        orderId: response.order.id,
        orderNumber: response.order.order_number
      });

      // Navigate to order if callback provided
      if (onNavigateToOrder) {
        onNavigateToOrder(response.order.id);
      }

      // Call original callback if provided
      if (onOrderClick) {
        onOrderClick();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(
        `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          duration: 6000,
        }
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleViewOrder = () => {
    if (existingOrder.orderId && onNavigateToOrder) {
      onNavigateToOrder(existingOrder.orderId);
    }
  };

  // Check if user has permission to create orders
  const canCreateOrders = hasPermission('create_orders') || hasPermission('order_create');
  const getCoverageStatusBadge = (status: string) => {
    const statusConfig = {
      "Covered": { bg: 'bg-green-100', text: 'text-green-800', label: 'Covered' },
      "Not Covered": { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Covered' },
      "Partial": { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial Coverage' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Covered"];
  };

  const getPriorAuthBadge = (status: string) => {
    const statusConfig = {
      "Approved": { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      "Denied": { bg: 'bg-red-100', text: 'text-red-800', label: 'Denied' },
      "Pending": { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Pending"];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const coverageStatusBadge = getCoverageStatusBadge(results.coverageStatus);
  const priorAuthBadge = getPriorAuthBadge(results.priorAuthStatus);

  return (
    <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">IVR Results</h3>
        </div>
        {showOrderButton && canCreateOrders && (
          <div className="flex items-center space-x-3">
            {isCheckingOrder ? (
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                Checking...
              </div>
            ) : existingOrder.exists ? (
              <button
                onClick={handleViewOrder}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Order {existingOrder.orderNumber}
              </button>
            ) : (
              <button
                onClick={handleCreateOrder}
                disabled={isCreatingOrder}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingOrder ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Order Medical Products
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        {/* Case Number and Verification Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case Number
            </label>
            <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded border">
              {results.caseNumber}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Date
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border">
              {formatDate(results.verificationDate)}
            </p>
          </div>
        </div>

        {/* Coverage Status and Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Status
            </label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${coverageStatusBadge.bg} ${coverageStatusBadge.text}`}>
              {coverageStatusBadge.label}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coverage Percentage
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold text-lg">
              {results.coveragePercentage}%
            </p>
          </div>
        </div>

        {/* Financial Details - Updated to show actual approval data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deductible Amount
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.deductibleAmount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copay Amount
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.copayAmount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Out of Pocket Max
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.outOfPocketMax)}
            </p>
          </div>
        </div>

        {/* Prior Authorization Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prior Authorization Status
          </label>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorAuthBadge.bg} ${priorAuthBadge.text}`}>
            {priorAuthBadge.label}
          </span>
        </div>

        {/* Coverage Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coverage Details
          </label>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-900 text-sm leading-relaxed">
              {results.coverageDetails}
            </p>
          </div>
        </div>

        {/* Coverage Notes (from approval) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approval Notes
          </label>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-900 text-sm leading-relaxed">
              {results.coverageNotes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRResultsDisplay;