import type { LogisticsOrder } from '../types/order';

// Mock LogisticsOrder data for testing
const mockLogisticsOrders: LogisticsOrder[] = [
  {
    id: 'ORD-2024-001',
    orderDate: '2024-12-19',
    priority: 'urgent',
    status: 'shipped',
    patient: {
      name: 'John D.',
      contact: 'PT-445782'
    },
    doctor: {
      name: 'Dr. Sarah Chen',
      npi: '1234567890'
    },
    facility: {
      name: 'Metro General Hospital',
      physicianName: 'Dr. Sarah Chen',
      npiNumber: '1234567890',
      medicareProviderNumber: 'MED123456',
      taxId: '12-3456789',
      medicaidProviderNumber: 'MCAID123456',
      officeContact: 'Dr. Sarah Chen',
      phone: '(555) 123-4567',
      fax: '(555) 123-4568',
      shippingAddress: {
        street: '1500 Medical Center Drive',
        city: 'Austin',
        state: 'TX',
        zipCode: '78712',
        country: 'USA'
      },
      businessHours: '9:00 AM - 5:00 PM',
      specialInstructions: 'Delivery to Wound Care Unit'
    },
    product: {
      type: 'type_a',
      size: 'medium',
      quantity: 2,
      specialRequirements: ['Temperature sensitive - store below 25°C']
    },
    ivrApproval: {
      authorizationNumber: 'IVR-2024-0892',
      approvalDocuments: [],
      ivrSpecialist: 'IVR Specialist'
    },
    logistics: {
      assignedTo: 'John Smith',
      estimatedShipDate: '2024-12-19',
      trackingNumber: 'TRK001ABC',
      carrier: 'FedEx Priority',
      notes: 'Shipped via FedEx Priority'
    }
  },
  {
    id: 'ORD-2024-002',
    orderDate: '2024-12-18',
    priority: 'standard',
    status: 'shipped',
    patient: {
      name: 'Sarah M.',
      contact: 'PT-556891'
    },
    doctor: {
      name: 'Dr. Michael Rodriguez',
      npi: '0987654321'
    },
    facility: {
      name: 'St. Mary\'s Medical Center',
      physicianName: 'Dr. Michael Rodriguez',
      npiNumber: '0987654321',
      medicareProviderNumber: 'MED098765',
      taxId: '98-7654321',
      medicaidProviderNumber: 'MCAID098765',
      officeContact: 'Dr. Michael Rodriguez',
      phone: '(555) 987-6543',
      fax: '(555) 987-6544',
      shippingAddress: {
        street: '900 E 30th Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78705',
        country: 'USA'
      },
      businessHours: '8:00 AM - 6:00 PM',
      specialInstructions: 'Surgery Department - Secure delivery required'
    },
    product: {
      type: 'type_b',
      size: 'large',
      quantity: 1,
      specialRequirements: ['Refrigerated storage required']
    },
    ivrApproval: {
      authorizationNumber: 'IVR-2024-0893',
      approvalDocuments: [],
      ivrSpecialist: 'IVR Specialist'
    },
    logistics: {
      assignedTo: 'Jane Doe',
      estimatedShipDate: '2024-12-18',
      trackingNumber: 'TRK002DEF',
      carrier: 'FedEx Priority',
      notes: 'Shipped with temperature control'
    }
  },
  {
    id: 'ORD-2024-003',
    orderDate: '2024-12-17',
    priority: 'standard',
    status: 'delivered',
    patient: {
      name: 'Mike R.',
      contact: 'PT-667234'
    },
    doctor: {
      name: 'Dr. James Wilson',
      npi: '1122334455'
    },
    facility: {
      name: 'Central Texas Medical',
      physicianName: 'Dr. James Wilson',
      npiNumber: '1122334455',
      medicareProviderNumber: 'MED112233',
      taxId: '11-2233445',
      medicaidProviderNumber: 'MCAID112233',
      officeContact: 'Dr. James Wilson',
      phone: '(555) 112-2334',
      fax: '(555) 112-2335',
      shippingAddress: {
        street: '2400 Medical Plaza Dr',
        city: 'Austin',
        state: 'TX',
        zipCode: '78731',
        country: 'USA'
      },
      businessHours: '7:00 AM - 7:00 PM',
      specialInstructions: 'Wound Care Unit - Room 205'
    },
    product: {
      type: 'type_a',
      size: 'small',
      quantity: 3,
      specialRequirements: []
    },
    ivrApproval: {
      authorizationNumber: 'IVR-2024-0890',
      approvalDocuments: [],
      ivrSpecialist: 'IVR Specialist'
    },
    logistics: {
      assignedTo: 'Bob Wilson',
      estimatedShipDate: '2024-12-17',
      trackingNumber: 'TRK003GHI',
      carrier: 'UPS Ground',
      notes: 'Delivered successfully'
    }
  }
];

class SharedOrderStore {
  private orders: LogisticsOrder[] = [...mockLogisticsOrders]; // Initialize with mock data
  private listeners: (() => void)[] = [];

  addOrder(order: LogisticsOrder): void {
    this.orders.push(order);
    this.notifyListeners();
  }

  getOrders(): LogisticsOrder[] {
    return [...this.orders]; // Return a copy to prevent direct mutations
  }

  updateOrderStatus(orderId: string, status: string): void {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex] = {
        ...this.orders[orderIndex],
        status: status as LogisticsOrder['status']
      };
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const sharedOrderStore = new SharedOrderStore(); 