// Facility Information Types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FacilityCredentials {
  npiNumber: string;
  medicareProviderId: string;
  medicaidProviderId: string;
  taxId: string;
  officeContact: string;
  phone: string;
  fax: string;
  shippingAddress: Address;
}

// Amniotic Skin Graft Types
export interface GraftProduct {
  id: string;
  type: 'type_a' | 'type_b';  // "Amniotic Skin Graft - Type A/B"
  size: 'Small' | 'Medium' | 'Large';
  insuranceCovered: boolean;
  description: string;
}

// IVR Communication Types
export interface IVRMessage {
  id: string;
  sender: 'doctor' | 'ivr_specialist';
  timestamp: string;
  content: string;
  attachments?: IVRDocument[];
}

export interface IVRDocument {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  timestamp: string;
  url: string;
  category: 'insurance_approval' | 'medical_documentation' | 'facility_credentials';
}

export interface IVRCommunication {
  id: string;
  ivrId: string;
  patientId: string;
  doctorId: string;
  messages: IVRMessage[];
  documents: IVRDocument[];
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  approvalDate?: string;
  approvedBy?: string;
}

// Order Types
export interface GraftSelection {
  type: 'type_a' | 'type_b';
  size: 'Small' | 'Medium' | 'Large';
  quantity: number;
}

export interface Order {
  id: string;
  ivrId: string;
  patientId: string;
  doctorId: string;
  facilityCredentials: FacilityCredentials;
  graftSelection: GraftSelection;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  approvalDocuments: IVRDocument[];
  communicationThread: IVRCommunication;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
}

// View Types
export interface OrderListItem {
  id: string;
  patientName: string;
  doctorName: string;
  facilityName: string;
  graftType: string;
  status: Order['status'];
  createdAt: string;
  estimatedDelivery?: string;
}

export interface Document {
  id: string;
  type: string;
  url: string;
  name: string;
  uploadedAt: string;
}

export interface LogisticsOrder {
  id: string;
  orderDate: string;
  priority: 'standard' | 'urgent' | 'rush';
  status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered';
  
  // Patient Context
  patient: {
    name: string;
    contact: string;
  };
  
  // Doctor Context  
  doctor: {
    name: string;
    npi: string;
  };
  
  // Complete Facility Information
  facility: {
    name: string;
    physicianName: string;
    npiNumber: string;
    medicareProviderNumber: string;
    taxId: string;
    medicaidProviderNumber: string;
    officeContact: string;
    phone: string;
    fax: string;
    shippingAddress: Address;
    businessHours: string;
    specialInstructions: string;
  };
  
  // Product Information
  product: {
    type: 'type_a' | 'type_b';
    size: 'small' | 'medium' | 'large';
    quantity: number;
    specialRequirements: string[];
  };
  
  // IVR Documentation
  ivrApproval: {
    authorizationNumber: string;
    approvalDocuments: Document[];
    ivrSpecialist: string;
  };
  
  // Logistics Information
  logistics: {
    assignedTo?: string;
    estimatedShipDate?: string;
    trackingNumber?: string;
    carrier?: string;
    notes?: string;
  };
} 