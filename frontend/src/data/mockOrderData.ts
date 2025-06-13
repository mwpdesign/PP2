export interface SharedOrder {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  doctorId: string; // Links to hierarchy data
  doctorName: string;
  doctorEmail: string;
  facility: string;
  patient: {
    initials: string;
    patientId: string;
  };
  ivrReference: string;
  products: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    image?: string;
    specialHandling?: string;
  }>;
  shippingAddress: {
    facility: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    attention?: string;
  };
  priority: 'Standard' | 'Urgent' | 'Rush';
  status: 'Pending Fulfillment' | 'Preparing for Ship' | 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  preparingDate?: string;
  isOverdue?: boolean;
  deliveryIssues?: string;
  notes?: string;
  // Hierarchy fields for filtering
  salesRepId?: string;
  distributorId?: string;
  regionalDistributorId?: string;
  createdBy?: string;
  assignedSalesRepId?: string;
}

// Mock order data with hierarchy relationships
export const mockOrders: SharedOrder[] = [
  // Orders from Regional Distributor West doctors (Dr. Thompson, Dr. Patel, Dr. Anderson)
  {
    id: 'ORD-2024-001',
    orderNumber: 'ORD-2024-001',
    date: '2024-12-19',
    time: '09:15 AM',
    doctorId: 'D-001', // Dr. John Smith (Thompson in hierarchy)
    doctorName: 'Dr. John Smith',
    doctorEmail: 'doctor1@healthcare.local',
    facility: 'Metro General Hospital',
    patient: {
      initials: 'J.D.',
      patientId: 'PT-445782'
    },
    ivrReference: 'IVR-2024-0892',
    products: [
      {
        id: 'SKIN-001',
        name: 'Advanced Wound Dressing Kit',
        description: 'Premium biocompatible wound care system with antimicrobial properties',
        quantity: 2,
        image: '/api/placeholder/80/80',
        specialHandling: 'Temperature sensitive - store below 25°C'
      },
      {
        id: 'SKIN-002',
        name: 'Skin Graft Bar Code Labels',
        description: 'Sterile tracking labels for skin graft procedures',
        quantity: 1,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Metro General Hospital',
      address: '1500 Medical Center Drive',
      city: 'Austin',
      state: 'TX',
      zipCode: '78712',
      attention: 'Dr. John Smith - Wound Care Unit'
    },
    priority: 'Urgent',
    status: 'Pending Fulfillment',
    totalItems: 3,
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-001'
  },
  {
    id: 'ORD-2024-002',
    orderNumber: 'ORD-2024-002',
    date: '2024-12-19',
    time: '10:30 AM',
    doctorId: 'D-002', // Dr. Michael Brown (Patel in hierarchy)
    doctorName: 'Dr. Michael Brown',
    doctorEmail: 'doctor2@healthcare.local',
    facility: 'St. Mary\'s Medical Center',
    patient: {
      initials: 'M.S.',
      patientId: 'PT-556891'
    },
    ivrReference: 'IVR-2024-0893',
    products: [
      {
        id: 'SKIN-003',
        name: 'Collagen Matrix Implant',
        description: 'Bioengineered collagen scaffolding for tissue regeneration',
        quantity: 1,
        image: '/api/placeholder/80/80',
        specialHandling: 'Refrigerated storage required'
      }
    ],
    shippingAddress: {
      facility: 'St. Mary\'s Medical Center',
      address: '900 E 30th Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78705',
      attention: 'Dr. Michael Brown - Surgery Department'
    },
    priority: 'Standard',
    status: 'Preparing for Ship',
    preparingDate: '2024-12-19',
    totalItems: 1,
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-002'
  },
  {
    id: 'ORD-2024-003',
    orderNumber: 'ORD-2024-003',
    date: '2024-12-18',
    time: '02:45 PM',
    doctorId: 'D-003', // Dr. Jennifer Lee (Anderson in hierarchy)
    doctorName: 'Dr. Jennifer Lee',
    doctorEmail: 'doctor3@healthcare.local',
    facility: 'Austin Regional Medical',
    patient: {
      initials: 'K.R.',
      patientId: 'PT-667123'
    },
    ivrReference: 'IVR-2024-0891',
    products: [
      {
        id: 'SKIN-004',
        name: 'Bioactive Wound Matrix',
        description: 'Advanced bioactive matrix for chronic wound healing',
        quantity: 2,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Austin Regional Medical',
      address: '1301 W 38th Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78705',
      attention: 'Dr. Jennifer Lee - Plastic Surgery'
    },
    priority: 'Rush',
    status: 'Shipped',
    preparingDate: '2024-12-18',
    shipDate: '2024-12-19',
    estimatedDelivery: '2024-12-21',
    trackingNumber: 'FEDEX456789123',
    carrier: 'FedEx',
    totalItems: 2,
    salesRepId: 'sales-rep-3',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-003'
  },
  {
    id: 'ORD-2024-004',
    orderNumber: 'ORD-2024-004',
    date: '2024-12-17',
    time: '11:20 AM',
    doctorId: 'D-006', // Dr. Carlos Martinez (Wilson in hierarchy)
    doctorName: 'Dr. Carlos Martinez',
    doctorEmail: 'doctor6@healthcare.local',
    facility: 'Central Texas Medical',
    patient: {
      initials: 'A.M.',
      patientId: 'PT-778234'
    },
    ivrReference: 'IVR-2024-0890',
    products: [
      {
        id: 'SKIN-005',
        name: 'Antimicrobial Gauze Set',
        description: 'Silver-infused antimicrobial gauze for infection prevention',
        quantity: 3,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Central Texas Medical',
      address: '2400 Medical Plaza Dr',
      city: 'Austin',
      state: 'TX',
      zipCode: '78731',
      attention: 'Dr. Carlos Martinez - Wound Care'
    },
    priority: 'Rush',
    status: 'Shipped',
    preparingDate: '2024-12-17',
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    trackingNumber: 'UPS789456123',
    carrier: 'UPS',
    totalItems: 3,
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-006'
  },
  // Orders from Regional Distributor East doctors (Dr. Chen, Dr. Anderson)
  {
    id: 'ORD-2024-005',
    orderNumber: 'ORD-2024-005',
    date: '2024-12-18',
    time: '03:15 PM',
    doctorId: 'D-004', // Dr. Robert Chen
    doctorName: 'Dr. Robert Chen',
    doctorEmail: 'doctor4@healthcare.local',
    facility: 'East Coast Medical Center',
    patient: {
      initials: 'L.T.',
      patientId: 'PT-889345'
    },
    ivrReference: 'IVR-2024-0894',
    products: [
      {
        id: 'SKIN-006',
        name: 'Hydrocolloid Dressing Pack',
        description: 'Advanced hydrocolloid dressings for moist wound healing',
        quantity: 4,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'East Coast Medical Center',
      address: '500 Medical Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      attention: 'Dr. Robert Chen - Dermatology'
    },
    priority: 'Standard',
    status: 'Pending Fulfillment',
    totalItems: 4,
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-004'
  },
  {
    id: 'ORD-2024-006',
    orderNumber: 'ORD-2024-006',
    date: '2024-12-17',
    time: '01:30 PM',
    doctorId: 'D-005', // Dr. Lisa Anderson
    doctorName: 'Dr. Lisa Anderson',
    doctorEmail: 'doctor5@healthcare.local',
    facility: 'Southeast Regional Hospital',
    patient: {
      initials: 'P.K.',
      patientId: 'PT-990456'
    },
    ivrReference: 'IVR-2024-0895',
    products: [
      {
        id: 'SKIN-007',
        name: 'Negative Pressure Wound Therapy Kit',
        description: 'Complete NPWT system for complex wound management',
        quantity: 1,
        image: '/api/placeholder/80/80',
        specialHandling: 'Fragile - Handle with care'
      }
    ],
    shippingAddress: {
      facility: 'Southeast Regional Hospital',
      address: '1200 Hospital Boulevard',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309',
      attention: 'Dr. Lisa Anderson - Wound Care Center'
    },
    priority: 'Urgent',
    status: 'Preparing for Ship',
    preparingDate: '2024-12-17',
    totalItems: 1,
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-005'
  }
];

// Helper function to get orders by doctor ID
export const getOrdersByDoctorId = (doctorId: string): SharedOrder[] => {
  return mockOrders.filter(order => order.doctorId === doctorId);
};

// Helper function to get orders by regional distributor
export const getOrdersByRegionalDistributor = (regionalDistributorId: string): SharedOrder[] => {
  return mockOrders.filter(order => order.regionalDistributorId === regionalDistributorId);
};

// Helper function to get orders by sales rep
export const getOrdersBySalesRep = (salesRepId: string): SharedOrder[] => {
  return mockOrders.filter(order => order.salesRepId === salesRepId);
};