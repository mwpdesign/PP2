export type Role = 
  | 'Doctor'
  | 'Doctor Assistant'
  | 'Master Distributor'
  | 'Distributor'
  | 'Sales Representative'
  | 'IVR Company Staff'
  | 'Logistics Coordinator'
  | 'System Admin'
  | 'Compliance Officer';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  lastLogin?: string;
  
  // Doctor fields
  medicalLicense?: string;
  npiNumber?: string;
  specialty?: string;
  practiceName?: string;
  credentials?: string;
  
  // Facility Information
  facilityName?: string;
  medicarePtan?: string;
  taxId?: string;
  medicaidProvider?: string;
  officeContact?: string;
  facilityPhone?: string;
  facilityFax?: string;
  facilityEmail?: string;

  // Shipping Information
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingInstructions?: string;

  // Doctor's Assistant fields
  assignedDoctor?: string;
  positionTitle?: string;
  certification?: string;
  yearsOfExperience?: string;
  accessLevel?: string;
  coverageHours?: string;
  ivrResponseAuthority?: string;
  patientDataAuthority?: string;
  employeeId?: string;
  hipaaTrainingDate?: string;
  emergencyContact?: string;
} 