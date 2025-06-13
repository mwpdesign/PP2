import { Treatment, InventoryItem, TreatmentDocument } from '../types/treatments';

// Mock treatment documents
const mockDocuments: TreatmentDocument[] = [
  {
    id: 'doc-001',
    treatment_id: 'treat-001',
    document_type: 'before_photo',
    file_name: 'before_treatment_001.jpg',
    file_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJlZm9yZSBQaG90bzwvdGV4dD48L3N2Zz4=',
    uploaded_at: '2024-12-10T14:25:00Z'
  },
  {
    id: 'doc-002',
    treatment_id: 'treat-001',
    document_type: 'after_photo',
    file_name: 'after_treatment_001.jpg',
    file_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTZmZmU2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2YzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFmdGVyIFBob3RvPC90ZXh0Pjwvc3ZnPg==',
    uploaded_at: '2024-12-10T14:35:00Z'
  },
  {
    id: 'doc-003',
    treatment_id: 'treat-001',
    document_type: 'graft_sticker',
    file_name: 'graft_sticker_001.jpg',
    file_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmMGU2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmOTUwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdyYWZ0IFN0aWNrZXI8L3RleHQ+PC9zdmc+',
    uploaded_at: '2024-12-10T14:40:00Z'
  },
  {
    id: 'doc-004',
    treatment_id: 'treat-002',
    document_type: 'before_photo',
    file_name: 'before_treatment_002.jpg',
    file_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJlZm9yZSBQaG90bzwvdGV4dD48L3N2Zz4=',
    uploaded_at: '2024-12-08T10:10:00Z'
  },
  {
    id: 'doc-005',
    treatment_id: 'treat-004',
    document_type: 'usage_log',
    file_name: 'usage_log_004.pdf',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKFVzYWdlIExvZyBEb2N1bWVudCkKL0NyZWF0b3IgKE1vY2sgRGF0YSkKL1Byb2R1Y2VyIChNb2NrIFBERikKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDE3OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMiAwIFIKPj4Kc3RhcnR4cmVmCjI1NQolJUVPRgo=',
    uploaded_at: '2024-12-03T11:25:00Z'
  }
];

// Mock treatment data
export const mockTreatments: Treatment[] = [
  {
    id: 'treat-001',
    patient_id: 'patient-001',
    order_id: 'order-001',
    product_id: 'prod-001',
    product_name: 'Kerecis Omega3 Wound 4x4 inch',
    quantity_used: 2,
    date_applied: '2024-12-10',
    diagnosis: 'Diabetic foot ulcer with infection',
    procedure_performed: 'Debridement and biological graft application',
    wound_location: 'Right foot, plantar surface',
    doctor_notes: 'Patient responded well to treatment. Wound showing signs of granulation. Continue with weekly applications.',
    applied_by_id: 'user-001',
    applied_by_name: 'Dr. Sarah Johnson',
    created_at: '2024-12-10T14:30:00Z',
    updated_at: '2024-12-10T14:30:00Z',
    documents: [
      {
        id: 'doc-001',
        file_name: 'pre_treatment_photo.jpg',
        file_url: '/api/documents/doc-001',
        file_type: 'image/jpeg',
        file_size: 245760,
        uploaded_at: '2024-12-10T14:25:00Z'
      },
      {
        id: 'doc-002',
        file_name: 'post_treatment_photo.jpg',
        file_url: '/api/documents/doc-002',
        file_type: 'image/jpeg',
        file_size: 198432,
        uploaded_at: '2024-12-10T14:35:00Z'
      }
    ]
  },
  {
    id: 'treat-002',
    patient_id: 'patient-001',
    order_id: 'order-001',
    product_id: 'prod-002',
    product_name: 'Dermagraft Wound Dressing 2x2 inch',
    quantity_used: 1,
    date_applied: '2024-12-08',
    diagnosis: 'Venous leg ulcer',
    procedure_performed: 'Wound cleaning and dressing application',
    wound_location: 'Left lower leg, medial aspect',
    doctor_notes: 'Initial application of dermal substitute. Patient tolerated procedure well. Schedule follow-up in 5 days.',
    applied_by_id: 'user-002',
    applied_by_name: 'Dr. Michael Chen',
    created_at: '2024-12-08T10:15:00Z',
    updated_at: '2024-12-08T10:15:00Z',
    documents: [
      {
        id: 'doc-003',
        file_name: 'wound_measurement.pdf',
        file_url: '/api/documents/doc-003',
        file_type: 'application/pdf',
        file_size: 156789,
        uploaded_at: '2024-12-08T10:20:00Z'
      }
    ]
  },
  {
    id: 'treat-003',
    patient_id: 'patient-001',
    order_id: 'order-002',
    product_id: 'prod-003',
    product_name: 'Integra Bilayer Matrix 6x6 inch',
    quantity_used: 1,
    date_applied: '2024-12-05',
    diagnosis: 'Post-surgical wound dehiscence',
    procedure_performed: 'Surgical debridement and matrix placement',
    wound_location: 'Abdomen, right lower quadrant',
    doctor_notes: 'Large matrix applied to cover exposed fascia. Good hemostasis achieved. Patient stable post-procedure.',
    applied_by_id: 'user-001',
    applied_by_name: 'Dr. Sarah Johnson',
    created_at: '2024-12-05T16:45:00Z',
    updated_at: '2024-12-05T16:45:00Z',
    documents: [
      {
        id: 'doc-004',
        file_name: 'surgical_notes.pdf',
        file_url: '/api/documents/doc-004',
        file_type: 'application/pdf',
        file_size: 234567,
        uploaded_at: '2024-12-05T17:00:00Z'
      },
      {
        id: 'doc-005',
        file_name: 'post_op_photo.jpg',
        file_url: '/api/documents/doc-005',
        file_type: 'image/jpeg',
        file_size: 312456,
        uploaded_at: '2024-12-05T17:05:00Z'
      }
    ]
  },
  {
    id: 'treat-004',
    patient_id: 'patient-001',
    order_id: 'order-001',
    product_id: 'prod-001',
    product_name: 'Kerecis Omega3 Wound 4x4 inch',
    quantity_used: 1,
    date_applied: '2024-12-03',
    diagnosis: 'Pressure ulcer, stage III',
    procedure_performed: 'Wound preparation and graft application',
    wound_location: 'Sacral region',
    doctor_notes: 'First application of fish skin graft. Wound bed prepared with sharp debridement. Patient educated on positioning.',
    applied_by_id: 'user-003',
    applied_by_name: 'Dr. Emily Rodriguez',
    created_at: '2024-12-03T11:20:00Z',
    updated_at: '2024-12-03T11:20:00Z',
    documents: [
      {
        id: 'doc-006',
        file_name: 'pressure_ulcer_staging.pdf',
        file_url: '/api/documents/doc-006',
        file_type: 'application/pdf',
        file_size: 189234,
        uploaded_at: '2024-12-03T11:25:00Z'
      }
    ]
  },
  {
    id: 'treat-005',
    patient_id: 'patient-001',
    order_id: 'order-002',
    product_id: 'prod-004',
    product_name: 'Apligraf Skin Substitute 3x3 inch',
    quantity_used: 1,
    date_applied: '2024-12-01',
    diagnosis: 'Chronic venous leg ulcer',
    procedure_performed: 'Wound bed preparation and skin substitute application',
    wound_location: 'Left lower leg, lateral malleolus',
    doctor_notes: 'Applied Apligraf to chronic venous ulcer after thorough debridement. Compression therapy initiated. Patient counseled on leg elevation and wound care.',
    applied_by_id: 'user-002',
    applied_by_name: 'Dr. Michael Chen',
    created_at: '2024-12-01T09:30:00Z',
    updated_at: '2024-12-01T09:30:00Z',
    documents: [
      {
        id: 'doc-007',
        file_name: 'venous_ulcer_before.jpg',
        file_url: '/api/documents/doc-007',
        file_type: 'image/jpeg',
        file_size: 287654,
        uploaded_at: '2024-12-01T09:25:00Z'
      },
      {
        id: 'doc-008',
        file_name: 'compression_therapy_notes.pdf',
        file_url: '/api/documents/doc-008',
        file_type: 'application/pdf',
        file_size: 145678,
        uploaded_at: '2024-12-01T09:40:00Z'
      }
    ]
  },
  {
    id: 'treat-006',
    patient_id: 'patient-001',
    order_id: 'order-001',
    product_id: 'prod-002',
    product_name: 'Dermagraft Wound Dressing 2x2 inch',
    quantity_used: 2,
    date_applied: '2024-11-28',
    diagnosis: 'Diabetic foot ulcer, Wagner grade 2',
    procedure_performed: 'Sharp debridement and dermal substitute application',
    wound_location: 'Right foot, first metatarsal head',
    doctor_notes: 'Extensive debridement performed to remove hyperkeratotic tissue. Applied 2 units of Dermagraft. Patient education on offloading and glucose control provided.',
    applied_by_id: 'user-001',
    applied_by_name: 'Dr. Sarah Johnson',
    created_at: '2024-11-28T14:15:00Z',
    updated_at: '2024-11-28T14:15:00Z',
    documents: [
      {
        id: 'doc-009',
        file_name: 'diabetic_foot_assessment.pdf',
        file_url: '/api/documents/doc-009',
        file_type: 'application/pdf',
        file_size: 198765,
        uploaded_at: '2024-11-28T14:20:00Z'
      },
      {
        id: 'doc-010',
        file_name: 'offloading_device_photo.jpg',
        file_url: '/api/documents/doc-010',
        file_type: 'image/jpeg',
        file_size: 234567,
        uploaded_at: '2024-11-28T14:25:00Z'
      }
    ]
  },
  {
    id: 'treat-007',
    patient_id: 'patient-001',
    order_id: 'order-002',
    product_id: 'prod-003',
    product_name: 'Integra Bilayer Matrix 6x6 inch',
    quantity_used: 1,
    date_applied: '2024-11-25',
    diagnosis: 'Traumatic wound with exposed tendon',
    procedure_performed: 'Surgical debridement and bilayer matrix reconstruction',
    wound_location: 'Right hand, dorsal surface',
    doctor_notes: 'Complex traumatic wound with exposed extensor tendons. Applied Integra bilayer matrix for tissue reconstruction. Patient scheduled for staged reconstruction.',
    applied_by_id: 'user-003',
    applied_by_name: 'Dr. Emily Rodriguez',
    created_at: '2024-11-25T16:00:00Z',
    updated_at: '2024-11-25T16:00:00Z',
    documents: [
      {
        id: 'doc-011',
        file_name: 'trauma_wound_initial.jpg',
        file_url: '/api/documents/doc-011',
        file_type: 'image/jpeg',
        file_size: 345678,
        uploaded_at: '2024-11-25T15:55:00Z'
      },
      {
        id: 'doc-012',
        file_name: 'surgical_procedure_notes.pdf',
        file_url: '/api/documents/doc-012',
        file_type: 'application/pdf',
        file_size: 267890,
        uploaded_at: '2024-11-25T16:10:00Z'
      },
      {
        id: 'doc-013',
        file_name: 'post_matrix_application.jpg',
        file_url: '/api/documents/doc-013',
        file_type: 'image/jpeg',
        file_size: 298765,
        uploaded_at: '2024-11-25T16:15:00Z'
      }
    ]
  }
];

// Calculate inventory from treatments and mock orders
export const calculateInventory = (treatments: Treatment[]): InventoryItem[] => {
  // Mock order data for calculation
  const mockOrdersForCalc = [
    { product_id: 'prod-001', product_name: 'Kerecis Omega3 Wound 4x4 inch', quantity_ordered: 15 },
    { product_id: 'prod-002', product_name: 'Dermagraft Wound Dressing 2x2 inch', quantity_ordered: 8 },
    { product_id: 'prod-003', product_name: 'Integra Bilayer Matrix 6x6 inch', quantity_ordered: 5 },
    { product_id: 'prod-004', product_name: 'Apligraf Skin Substitute 3x3 inch', quantity_ordered: 6 }
  ];

  // Group treatments by product
  const usageByProduct = treatments.reduce((acc, treatment) => {
    if (!acc[treatment.product_id]) {
      acc[treatment.product_id] = {
        product_name: treatment.product_name,
        total_used: 0
      };
    }
    acc[treatment.product_id].total_used += treatment.quantity_used;
    return acc;
  }, {} as Record<string, { product_name: string; total_used: number }>);

  // Calculate inventory for each product
  return mockOrdersForCalc.map(order => {
    const usage = usageByProduct[order.product_id] || { total_used: 0, product_name: order.product_name };
    const on_hand = order.quantity_ordered - usage.total_used;
    const usage_percentage = order.quantity_ordered > 0 ? (usage.total_used / order.quantity_ordered) * 100 : 0;

    let status: 'plenty' | 'low' | 'out' = 'plenty';
    if (on_hand <= 0) {
      status = 'out';
    } else if (usage_percentage >= 75) {
      status = 'low';
    }

    return {
      product_id: order.product_id,
      product_name: order.product_name,
      total_ordered: order.quantity_ordered,
      total_used: usage.total_used,
      on_hand: Math.max(0, on_hand),
      usage_percentage,
      status
    };
  });
};

export const mockInventory = calculateInventory(mockTreatments);

export const mockOrders = [
  {
    id: 'order-001',
    order_number: 'ORD-2024-001',
    status: 'received',
    order_date: '2024-11-15',
    received_date: '2024-11-20',
    products: [
      {
        id: 'prod-001',
        product_name: 'Kerecis Omega3 Wound 4x4 inch',
        quantity: 15,
        used_quantity: 5, // Updated: 2 + 1 + 1 + 1 = 5 total used
        available_quantity: 10
      },
      {
        id: 'prod-002',
        product_name: 'Dermagraft Wound Dressing 2x2 inch',
        quantity: 8,
        used_quantity: 3, // Updated: 1 + 2 = 3 total used
        available_quantity: 5
      }
    ]
  },
  {
    id: 'order-002',
    order_number: 'ORD-2024-002',
    status: 'received',
    order_date: '2024-11-20',
    received_date: '2024-11-25',
    products: [
      {
        id: 'prod-003',
        product_name: 'Integra Bilayer Matrix 6x6 inch',
        quantity: 5,
        used_quantity: 3, // Updated: 1 + 1 + 1 = 3 total used
        available_quantity: 2
      },
      {
        id: 'prod-004',
        product_name: 'Apligraf Skin Substitute 3x3 inch',
        quantity: 6,
        used_quantity: 1, // Updated: 1 used
        available_quantity: 5
      }
    ]
  }
];

// Demo mode flag
export const DEMO_MODE = true;

// Helper function to add new treatment to mock data
export const addMockTreatment = (treatment: Omit<Treatment, 'id' | 'created_at' | 'updated_at'>) => {
  const newTreatment: Treatment = {
    ...treatment,
    id: `treat-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockTreatments.unshift(newTreatment);

  // Update inventory
  const inventoryItem = mockInventory.find(item => item.product_id === treatment.product_id);
  if (inventoryItem) {
    inventoryItem.total_used += treatment.quantity_used;
    inventoryItem.total_on_hand -= treatment.quantity_used;
    inventoryItem.last_used_date = treatment.date_applied;
    inventoryItem.total_value = inventoryItem.total_on_hand * inventoryItem.unit_cost;
  }

  // Update order availability
  const order = mockOrders.find(o => o.id === treatment.order_id);
  if (order) {
    const product = order.products.find(p => p.id === treatment.product_id);
    if (product) {
      product.used_quantity += treatment.quantity_used;
      product.available_quantity -= treatment.quantity_used;
    }
  }

  return newTreatment;
};

// Helper function to get treatments by patient
export const getMockTreatmentsByPatient = (patientId: string) => {
  // For demo purposes, return all treatments regardless of patient ID
  // In real implementation, this would be filtered by actual patient ID
  console.log('🎭 Demo: Getting treatments for patient', patientId);
  return mockTreatments;
};

// Helper function to get inventory for patient
export const getMockInventoryByPatient = (patientId: string) => {
  // For demo purposes, return all inventory items
  // In real implementation, this would be filtered by patient's orders
  return mockInventory;
};

// Helper function to get orders for patient
export const getMockOrdersByPatient = (patientId: string) => {
  // For demo purposes, return all orders
  // In real implementation, this would be filtered by patient
  return mockOrders;
};