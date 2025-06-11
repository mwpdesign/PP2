interface OrderResponse {
  id: string;
  order_number: string;
  organization_id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  ivr_request_id: string;
  status: string;
  order_type: string;
  priority: string;
  shipping_address: any;
  products: any;
  total_amount: number;
  notes: string;
  processed_at?: string;
  shipped_at?: string;
  received_at?: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
  documents: any[];
  status_history: any[];
}

interface CreateOrderFromIVRResponse {
  success: boolean;
  order: OrderResponse;
  message: string;
}

export const orderApiService = {
  /**
   * Create an order from an approved IVR request
   */
  createOrderFromIVR: async (ivrId: string): Promise<CreateOrderFromIVRResponse> => {
    const response = await fetch(`/api/v1/orders/create-from-ivr/${ivrId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create order from IVR');
    }

    const orderData = await response.json();

    return {
      success: true,
      order: orderData,
      message: `Order ${orderData.order_number} created successfully from IVR ${ivrId}`
    };
  },

  /**
   * Check if an order already exists for an IVR request
   */
  checkOrderExistsForIVR: async (ivrId: string): Promise<{ exists: boolean; orderId?: string; orderNumber?: string }> => {
    try {
      const response = await fetch(`/api/v1/orders/?ivr_request_id=${ivrId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const order = data.items[0];
          return {
            exists: true,
            orderId: order.id,
            orderNumber: order.order_number
          };
        }
      }
    } catch (error) {
      console.error('Error checking for existing order:', error);
    }

    return { exists: false };
  },

  /**
   * Get order details by ID
   */
  getOrderById: async (orderId: string): Promise<OrderResponse> => {
    const response = await fetch(`/api/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get order details');
    }

    return await response.json();
  }
};