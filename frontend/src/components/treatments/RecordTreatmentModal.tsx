import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import DocumentUpload from './DocumentUpload';
import { TreatmentFormData, UploadFile } from '../../types/treatments';
import { mockOrders, addMockTreatment, DEMO_MODE } from '../../data/mockTreatmentData';

interface Order {
  id: string;
  order_number: string;
  status: string;
  products: Product[];
}

interface Product {
  id: string;
  product_name: string;
  quantity: number;
  used_quantity?: number;
  available_quantity: number;
}

interface RecordTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (treatmentData: TreatmentFormData) => void;
  patientId: string;
  isLoading?: boolean;
}

const RecordTreatmentModal: React.FC<RecordTreatmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patientId,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<TreatmentFormData>({
    patient_id: patientId,
    order_id: '',
    product_id: '',
    product_name: '',
    quantity_used: 1,
    date_applied: new Date().toISOString().split('T')[0], // Today's date
    diagnosis: '',
    procedure_performed: '',
    wound_location: '',
    doctor_notes: '',
    documents: []
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Partial<TreatmentFormData>>({});
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load patient orders when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      if (DEMO_MODE) {
        console.log('🎭 Running in demo mode - using mock data');
        loadMockOrders();
      } else {
        loadPatientOrders();
      }
      // Reset form data with current patient ID
      setFormData(prev => ({ ...prev, patient_id: patientId }));
    }
  }, [isOpen, patientId]);

  // Update available products when order is selected
  useEffect(() => {
    if (selectedOrder) {
      const products = selectedOrder.products.map(product => ({
        ...product,
        available_quantity: product.quantity - (product.used_quantity || 0)
      })).filter(product => product.available_quantity > 0);

      setAvailableProducts(products);

      // Reset product selection
      setSelectedProduct(null);
      setFormData(prev => ({ ...prev, product_id: '', product_name: '', quantity_used: 1 }));
    } else {
      setAvailableProducts([]);
    }
  }, [selectedOrder]);

  const loadMockOrders = () => {
    setIsLoadingOrders(true);
    // Simulate loading delay for realistic demo
    setTimeout(() => {
      const eligibleOrders = mockOrders.filter(order =>
        ['received', 'completed'].includes(order.status)
      );
      setOrders(eligibleOrders);
      setIsLoadingOrders(false);
    }, 300);
  };

  const loadPatientOrders = async () => {
    setIsLoadingOrders(true);
    try {
      // This would be the real API call when not in demo mode
      const patientOrders = []; // await treatmentService.getPatientOrders(patientId);

      // Filter to only show received/completed orders
      const eligibleOrders = patientOrders.filter(order =>
        ['received', 'completed'].includes(order.status)
      );

      setOrders(eligibleOrders);
    } catch (error) {
      console.error('Failed to load patient orders:', error);
      setOrders([]);
      setSaveError('Failed to load patient orders. Please try again.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TreatmentFormData> = {};

    if (!formData.order_id) {
      newErrors.order_id = 'Please select an order';
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Please select a product';
    }

    if (!formData.quantity_used || formData.quantity_used < 1) {
      newErrors.quantity_used = 'Quantity must be at least 1';
    } else if (selectedProduct && formData.quantity_used > selectedProduct.available_quantity) {
      newErrors.quantity_used = `Cannot exceed available quantity (${selectedProduct.available_quantity})`;
    }

    if (!formData.date_applied) {
      newErrors.date_applied = 'Date applied is required';
    } else {
      const selectedDate = new Date(formData.date_applied);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (selectedDate > today) {
        newErrors.date_applied = 'Date cannot be in the future';
      }
    }

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    if (!formData.procedure_performed.trim()) {
      newErrors.procedure_performed = 'Procedure performed is required';
    }

    if (!formData.wound_location.trim()) {
      newErrors.wound_location = 'Wound location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (DEMO_MODE) {
        // Demo mode - simulate API call and add to mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

        const treatmentData = {
          ...formData,
          applied_by_id: 'current-user',
          applied_by_name: 'Dr. Demo User',
          documents: formData.documents || []
        };

        const newTreatment = addMockTreatment(treatmentData);
        console.log('🎭 Demo: Added treatment to mock data', newTreatment);

        // Show success message
        setSaveSuccess(true);

        // Call parent save handler
        onSave(formData);

        // Close modal after short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        // Real API mode (commented out for demo)
        /*
        const newTreatment = await treatmentService.createTreatment(formData);

        // Handle document uploads if any
        if (formData.documents && formData.documents.length > 0) {
          try {
            const files = formData.documents.map(doc => doc.file);
            await treatmentService.uploadTreatmentDocuments(newTreatment.id, files);
          } catch (docError) {
            console.warn('Document upload failed:', docError);
          }
        }

        setSaveSuccess(true);
        onSave(formData);
        setTimeout(() => {
          handleClose();
        }, 1500);
        */
        setSaveError('Backend integration temporarily disabled for demo');
      }

    } catch (error) {
      console.error('Failed to save treatment:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save treatment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof TreatmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear save error when user makes changes
    if (saveError) {
      setSaveError(null);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setFormData(prev => ({ ...prev, order_id: order.id }));
    setIsOrderDropdownOpen(false);
    // Clear order error
    if (errors.order_id) {
      setErrors(prev => ({ ...prev, order_id: undefined }));
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      product_id: product.id,
      product_name: product.product_name,
      quantity_used: Math.min(1, product.available_quantity) // Default to 1 or max available
    }));
    setIsProductDropdownOpen(false);
    // Clear product error
    if (errors.product_id) {
      setErrors(prev => ({ ...prev, product_id: undefined }));
    }
  };

  const handleDocumentsChange = (files: UploadFile[]) => {
    setFormData(prev => ({ ...prev, documents: files }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: patientId,
      order_id: '',
      product_id: '',
      product_name: '',
      quantity_used: 1,
      date_applied: new Date().toISOString().split('T')[0],
      diagnosis: '',
      procedure_performed: '',
      wound_location: '',
      doctor_notes: '',
      documents: []
    });
    setSelectedOrder(null);
    setSelectedProduct(null);
    setAvailableProducts([]);
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-slate-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-6 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 animate-slide-up">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  {saveSuccess ? (
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {saveSuccess ? 'Treatment Recorded!' : 'Record Treatment'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {saveSuccess ? 'Treatment has been successfully recorded' : 'Document product usage for patient care'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Success Message */}
            {saveSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                  <span className="text-emerald-800 font-medium">Treatment recorded successfully!</span>
                </div>
                <p className="text-emerald-700 text-sm mt-1">
                  The treatment record has been saved and inventory has been updated.
                </p>
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Error saving treatment</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{saveError}</p>
              </div>
            )}

            {/* Form Fields - Only show if not in success state */}
            {!saveSuccess && (
              <div className="space-y-6">
                {/* Order Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Order Selection *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                      disabled={isLoadingOrders || isSaving}
                      className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.order_id ? 'border-red-300' : 'border-slate-300'
                      } ${isLoadingOrders || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`block truncate ${selectedOrder ? 'text-slate-900' : 'text-slate-500'}`}>
                        {isLoadingOrders ? 'Loading orders...' :
                         selectedOrder ? `${selectedOrder.order_number} (${selectedOrder.status})` :
                         'Select an order'}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                      </span>
                    </button>

                    {isOrderDropdownOpen && !isLoadingOrders && !isSaving && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                        {orders.length > 0 ? (
                          orders.map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => handleOrderSelect(order)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${
                                selectedOrder?.id === order.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span>{order.order_number}</span>
                                <span className="text-xs text-slate-500 capitalize">{order.status}</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-slate-500">
                            No eligible orders found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.order_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.order_id}</p>
                  )}
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product Selection *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      disabled={!selectedOrder || availableProducts.length === 0 || isSaving}
                      className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.product_id ? 'border-red-300' : 'border-slate-300'
                      } ${!selectedOrder || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`block truncate ${selectedProduct ? 'text-slate-900' : 'text-slate-500'}`}>
                        {!selectedOrder ? 'Select an order first' :
                         availableProducts.length === 0 ? 'No products available' :
                         selectedProduct ? selectedProduct.product_name : 'Select a product'}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                      </span>
                    </button>

                    {isProductDropdownOpen && availableProducts.length > 0 && !isSaving && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                        {availableProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${
                              selectedProduct?.id === product.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{product.product_name}</span>
                              <span className="text-xs text-emerald-600 font-medium">
                                {product.available_quantity} available
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.product_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
                  )}
                </div>

                {/* Quantity Used and Date Applied - Side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quantity Used */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantity Used *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct?.available_quantity || 1}
                      value={formData.quantity_used}
                      onChange={(e) => handleInputChange('quantity_used', parseInt(e.target.value) || 1)}
                      disabled={isSaving}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.quantity_used ? 'border-red-300' : 'border-slate-300'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="1"
                    />
                    {selectedProduct && (
                      <p className="mt-1 text-xs text-slate-500">
                        Max available: {selectedProduct.available_quantity}
                      </p>
                    )}
                    {errors.quantity_used && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity_used}</p>
                    )}
                  </div>

                  {/* Date Applied */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Applied *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.date_applied}
                        max={new Date().toISOString().split('T')[0]} // Cannot be future
                        onChange={(e) => handleInputChange('date_applied', e.target.value)}
                        disabled={isSaving}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.date_applied ? 'border-red-300' : 'border-slate-300'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {errors.date_applied && (
                      <p className="mt-1 text-sm text-red-600">{errors.date_applied}</p>
                    )}
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2">
                    Clinical Information
                  </h4>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={formData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      disabled={isSaving}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.diagnosis ? 'border-red-300' : 'border-slate-300'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g., Chronic wound, diabetic ulcer"
                    />
                    {errors.diagnosis && (
                      <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
                    )}
                  </div>

                  {/* Procedure Performed */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Procedure Performed *
                    </label>
                    <input
                      type="text"
                      value={formData.procedure_performed}
                      onChange={(e) => handleInputChange('procedure_performed', e.target.value)}
                      disabled={isSaving}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.procedure_performed ? 'border-red-300' : 'border-slate-300'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g., Wound dressing change, debridement"
                    />
                    {errors.procedure_performed && (
                      <p className="mt-1 text-sm text-red-600">{errors.procedure_performed}</p>
                    )}
                  </div>

                  {/* Wound Location */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Wound Location *
                    </label>
                    <input
                      type="text"
                      value={formData.wound_location}
                      onChange={(e) => handleInputChange('wound_location', e.target.value)}
                      disabled={isSaving}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.wound_location ? 'border-red-300' : 'border-slate-300'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g., Left ankle, right heel, sacrum"
                    />
                    {errors.wound_location && (
                      <p className="mt-1 text-sm text-red-600">{errors.wound_location}</p>
                    )}
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Clinical Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.doctor_notes}
                      onChange={(e) => handleInputChange('doctor_notes', e.target.value)}
                      disabled={isSaving}
                      className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        isSaving ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Additional notes about the treatment..."
                    />
                  </div>
                </div>

                {/* Treatment Documentation */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                    <DocumentArrowUpIcon className="h-5 w-5 text-slate-600" />
                    <h4 className="text-sm font-medium text-slate-700">Treatment Documentation</h4>
                    <span className="text-xs text-slate-500">(Optional)</span>
                  </div>

                  <div className="text-sm text-slate-600 mb-4">
                    Upload photos and documents related to this treatment for comprehensive documentation.
                  </div>

                  <DocumentUpload
                    onFilesChange={handleDocumentsChange}
                    maxFiles={5}
                    maxFileSize={10}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {/* Info Box - Only show if not in success state */}
            {!saveSuccess && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Treatment record will:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Update inventory levels for the selected product</li>
                      <li>Create permanent clinical documentation</li>
                      <li>Support billing and compliance requirements</li>
                      <li>Track product usage for analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {saveSuccess ? 'Close' : 'Cancel'}
              </button>
              {!saveSuccess && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                      Record Treatment
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordTreatmentModal;