import { 
  Order, 
  GraftProduct, 
  IVRCommunication,
  FacilityCredentials,
  IVRDocument
} from '../types/order';

// Mock Graft Products
export const GRAFT_PRODUCTS: GraftProduct[] = [
  {
    id: 'graft_a_s',
    type: 'type_a',
    size: 'Small',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type A (Small)'
  },
  {
    id: 'graft_a_m',
    type: 'type_a',
    size: 'Medium',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type A (Medium)'
  },
  {
    id: 'graft_a_l',
    type: 'type_a',
    size: 'Large',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type A (Large)'
  },
  {
    id: 'graft_b_s',
    type: 'type_b',
    size: 'Small',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type B (Small)'
  },
  {
    id: 'graft_b_m',
    type: 'type_b',
    size: 'Medium',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type B (Medium)'
  },
  {
    id: 'graft_b_l',
    type: 'type_b',
    size: 'Large',
    insuranceCovered: true,
    description: 'Amniotic Skin Graft - Type B (Large)'
  }
];

// Mock Facility Data
export const MOCK_FACILITIES: FacilityCredentials[] = [
  {
    npiNumber: '1234567890',
    medicareProviderId: 'MED123456',
    medicaidProviderId: 'MCAID123456',
    taxId: '12-3456789',
    officeContact: 'Dr. Sarah Johnson',
    phone: '(555) 123-4567',
    fax: '(555) 123-4568',
    shippingAddress: {
      street: '123 Medical Center Drive',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    }
  },
  {
    npiNumber: '0987654321',
    medicareProviderId: 'MED098765',
    medicaidProviderId: 'MCAID098765',
    taxId: '98-7654321',
    officeContact: 'Dr. Michael Chen',
    phone: '(555) 987-6543',
    fax: '(555) 987-6544',
    shippingAddress: {
      street: '456 Healthcare Plaza',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    }
  }
];

// Mock IVR Communication Threads
export const MOCK_IVR_COMMUNICATIONS: IVRCommunication[] = [
  {
    id: 'ivr_001',
    ivrId: 'IVR2024001',
    patientId: 'PAT001',
    doctorId: 'DOC001',
    status: 'approved',
    approvalDate: '2024-03-15T10:30:00Z',
    approvedBy: 'IVR_SPEC_001',
    messages: [
      {
        id: 'msg_001',
        sender: 'doctor',
        timestamp: '2024-03-10T09:00:00Z',
        content: 'Submitting IVR request for patient wound care treatment.'
      },
      {
        id: 'msg_002',
        sender: 'ivr_specialist',
        timestamp: '2024-03-11T14:20:00Z',
        content: 'Please provide additional wound measurements and photos.'
      },
      {
        id: 'msg_003',
        sender: 'doctor',
        timestamp: '2024-03-12T11:15:00Z',
        content: 'Additional measurements and photos attached.',
        attachments: [{
          id: 'doc_001',
          name: 'wound_measurements.pdf',
          type: 'application/pdf',
          uploadedBy: 'DOC001',
          timestamp: '2024-03-12T11:15:00Z',
          url: '/documents/wound_measurements.pdf',
          category: 'medical_documentation'
        }]
      },
      {
        id: 'msg_004',
        sender: 'ivr_specialist',
        timestamp: '2024-03-15T10:30:00Z',
        content: 'IVR request approved. Insurance coverage confirmed.',
        attachments: [{
          id: 'doc_002',
          name: 'insurance_approval.pdf',
          type: 'application/pdf',
          uploadedBy: 'IVR_SPEC_001',
          timestamp: '2024-03-15T10:30:00Z',
          url: '/documents/insurance_approval.pdf',
          category: 'insurance_approval'
        }]
      }
    ],
    documents: [
      {
        id: 'doc_001',
        name: 'wound_measurements.pdf',
        type: 'application/pdf',
        uploadedBy: 'DOC001',
        timestamp: '2024-03-12T11:15:00Z',
        url: '/documents/wound_measurements.pdf',
        category: 'medical_documentation'
      },
      {
        id: 'doc_002',
        name: 'insurance_approval.pdf',
        type: 'application/pdf',
        uploadedBy: 'IVR_SPEC_001',
        timestamp: '2024-03-15T10:30:00Z',
        url: '/documents/insurance_approval.pdf',
        category: 'insurance_approval'
      }
    ]
  }
];

// Mock Orders
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD2024001',
    ivrId: 'IVR2024001',
    patientId: 'PAT001',
    doctorId: 'DOC001',
    facilityCredentials: MOCK_FACILITIES[0],
    graftSelection: {
      type: 'type_a',
      size: 'Medium',
      quantity: 1
    },
    status: 'processing',
    approvalDocuments: MOCK_IVR_COMMUNICATIONS[0].documents,
    communicationThread: MOCK_IVR_COMMUNICATIONS[0],
    createdAt: '2024-03-15T11:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z',
    estimatedDelivery: '2024-03-18T17:00:00Z'
  }
];

// Helper function to generate unique order ID
const generateUniqueOrderId = () => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `ORD${timestamp}${random}`;
};

// Service Functions
export const orderService = {
  getApprovedIVRs: async () => {
    return MOCK_IVR_COMMUNICATIONS.filter(ivr => ivr.status === 'approved');
  },

  getOrderHistory: async () => {
    return MOCK_ORDERS;
  },

  getFacilityCredentials: async (doctorId: string) => {
    return MOCK_FACILITIES[0];
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const newOrder: Order = {
      id: generateUniqueOrderId(),
      ivrId: orderData.ivrId || 'IVR' + Date.now(),
      patientId: orderData.patientId || 'PAT' + Date.now(),
      doctorId: orderData.doctorId || 'DOC' + Date.now(),
      facilityCredentials: orderData.facilityCredentials || MOCK_FACILITIES[0],
      graftSelection: orderData.graftSelection || {
        type: 'type_a',
        size: 'Medium',
        quantity: 1
      },
      status: 'pending',
      approvalDocuments: orderData.approvalDocuments || [],
      communicationThread: orderData.communicationThread || MOCK_IVR_COMMUNICATIONS[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: orderData.estimatedDelivery
    };

    // Add to mock orders
    MOCK_ORDERS.unshift(newOrder);
    
    return newOrder;
  },

  getOrderById: async (orderId: string) => {
    return MOCK_ORDERS.find(order => order.id === orderId);
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    const order = MOCK_ORDERS.find(order => order.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
    return order;
  },

  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    MOCK_ORDERS[orderIndex] = {
      ...MOCK_ORDERS[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return MOCK_ORDERS[orderIndex];
  }
}; 