export interface HierarchyUser {
  id: string;
  email: string;
  name: string;
  role: 'Master Distributor' | 'Distributor' | 'Sales' | 'Doctor';
  organizationId: string;
  territoryId?: string;
  parentId?: string; // Who added this user
  addedBy?: string; // User ID who added this person
  isActive: boolean;
  createdAt: string;
  // Hierarchy-specific fields
  distributorId?: string; // For sales reps and doctors
  salesRepId?: string; // For doctors
  regionalDistributorId?: string; // For tracking regional distributor relationships
}

export interface HierarchyRelationship {
  parentId: string;
  childId: string;
  relationshipType: 'manages' | 'reports_to' | 'assigned_to';
  createdAt: string;
}

// Mock hierarchy data representing the user structure
export const mockHierarchyUsers: HierarchyUser[] = [
  // Master Distributor (Top Level)
  {
    id: 'master-dist-1',
    email: 'distributor@healthcare.local',
    name: 'Master Distributor',
    role: 'Master Distributor',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Regional Distributors (Level 2)
  {
    id: 'regional-dist-1',
    email: 'distributor2@healthcare.local',
    name: 'Regional Distributor West',
    role: 'Distributor',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'master-dist-1',
    addedBy: 'master-dist-1',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'regional-dist-2',
    email: 'regional2@healthcare.local',
    name: 'Regional Distributor East',
    role: 'Distributor',
    organizationId: 'org-1',
    territoryId: 'territory-2',
    parentId: 'master-dist-1',
    addedBy: 'master-dist-1',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z'
  },

  // Sales Representatives (Level 3)
  {
    id: 'sales-rep-1',
    email: 'sales@healthcare.local',
    name: 'Sales Rep West',
    role: 'Sales',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'regional-dist-1',
    addedBy: 'regional-dist-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z'
  },
  {
    id: 'sales-rep-2',
    email: 'sales2@healthcare.local',
    name: 'Sales Rep East',
    role: 'Sales',
    organizationId: 'org-1',
    territoryId: 'territory-2',
    parentId: 'regional-dist-2',
    addedBy: 'regional-dist-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'sales-rep-3',
    email: 'sales3@healthcare.local',
    name: 'Sales Rep West 2',
    role: 'Sales',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'regional-dist-1',
    addedBy: 'regional-dist-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-06T00:00:00Z'
  },

  // Doctors (Level 4) - Added by Sales Reps
  {
    id: 'D-001',
    email: 'doctor1@healthcare.local',
    name: 'Dr. John Smith',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'sales-rep-1',
    addedBy: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-07T00:00:00Z'
  },
  {
    id: 'D-002',
    email: 'doctor2@healthcare.local',
    name: 'Dr. Michael Brown',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'sales-rep-1',
    addedBy: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-08T00:00:00Z'
  },
  {
    id: 'D-003',
    email: 'doctor3@healthcare.local',
    name: 'Dr. Jennifer Lee',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'sales-rep-3',
    addedBy: 'sales-rep-3',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-3',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-09T00:00:00Z'
  },
  {
    id: 'D-004',
    email: 'doctor4@healthcare.local',
    name: 'Dr. Robert Chen',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-2',
    parentId: 'sales-rep-2',
    addedBy: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    salesRepId: 'sales-rep-2',
    regionalDistributorId: 'regional-dist-2',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 'D-005',
    email: 'doctor5@healthcare.local',
    name: 'Dr. Lisa Anderson',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-2',
    parentId: 'sales-rep-2',
    addedBy: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    salesRepId: 'sales-rep-2',
    regionalDistributorId: 'regional-dist-2',
    isActive: true,
    createdAt: '2024-01-11T00:00:00Z'
  },
  {
    id: 'D-006',
    email: 'doctor6@healthcare.local',
    name: 'Dr. Carlos Martinez',
    role: 'Doctor',
    organizationId: 'org-1',
    territoryId: 'territory-1',
    parentId: 'sales-rep-1',
    addedBy: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    regionalDistributorId: 'regional-dist-1',
    isActive: true,
    createdAt: '2024-01-12T00:00:00Z'
  }
];

// Hierarchy relationships for easier traversal
export const mockHierarchyRelationships: HierarchyRelationship[] = [
  // Master Distributor manages Regional Distributors
  { parentId: 'master-dist-1', childId: 'regional-dist-1', relationshipType: 'manages', createdAt: '2024-01-02T00:00:00Z' },
  { parentId: 'master-dist-1', childId: 'regional-dist-2', relationshipType: 'manages', createdAt: '2024-01-03T00:00:00Z' },

  // Regional Distributors manage Sales Reps
  { parentId: 'regional-dist-1', childId: 'sales-rep-1', relationshipType: 'manages', createdAt: '2024-01-04T00:00:00Z' },
  { parentId: 'regional-dist-1', childId: 'sales-rep-3', relationshipType: 'manages', createdAt: '2024-01-06T00:00:00Z' },
  { parentId: 'regional-dist-2', childId: 'sales-rep-2', relationshipType: 'manages', createdAt: '2024-01-05T00:00:00Z' },

  // Sales Reps manage Doctors
  { parentId: 'sales-rep-1', childId: 'D-001', relationshipType: 'manages', createdAt: '2024-01-07T00:00:00Z' },
  { parentId: 'sales-rep-1', childId: 'D-002', relationshipType: 'manages', createdAt: '2024-01-08T00:00:00Z' },
  { parentId: 'sales-rep-1', childId: 'D-006', relationshipType: 'manages', createdAt: '2024-01-12T00:00:00Z' },
  { parentId: 'sales-rep-3', childId: 'D-003', relationshipType: 'manages', createdAt: '2024-01-09T00:00:00Z' },
  { parentId: 'sales-rep-2', childId: 'D-004', relationshipType: 'manages', createdAt: '2024-01-10T00:00:00Z' },
  { parentId: 'sales-rep-2', childId: 'D-005', relationshipType: 'manages', createdAt: '2024-01-11T00:00:00Z' }
];

// Helper function to get user by ID
export const getUserById = (userId: string): HierarchyUser | undefined => {
  return mockHierarchyUsers.find(user => user.id === userId);
};

// Helper function to get user by email
export const getUserByEmail = (email: string): HierarchyUser | undefined => {
  return mockHierarchyUsers.find(user => user.email === email);
};

// Helper function to get children of a user
export const getDirectChildren = (userId: string): HierarchyUser[] => {
  return mockHierarchyUsers.filter(user => user.parentId === userId);
};

// Helper function to get all descendants (recursive)
export const getAllDescendants = (userId: string): HierarchyUser[] => {
  const descendants: HierarchyUser[] = [];
  const directChildren = getDirectChildren(userId);

  for (const child of directChildren) {
    descendants.push(child);
    descendants.push(...getAllDescendants(child.id));
  }

  return descendants;
};

// Helper function to check if user A is in the downline of user B
export const isInDownline = (descendantId: string, ancestorId: string): boolean => {
  const descendants = getAllDescendants(ancestorId);
  return descendants.some(user => user.id === descendantId);
};

// Helper function to get all doctors in a user's downline
export const getDoctorsInDownline = (userId: string): HierarchyUser[] => {
  const allDescendants = getAllDescendants(userId);
  return allDescendants.filter(user => user.role === 'Doctor');
};

// Helper function to get hierarchy path for a user
export const getHierarchyPath = (userId: string): HierarchyUser[] => {
  const path: HierarchyUser[] = [];
  let currentUser = getUserById(userId);

  while (currentUser) {
    path.unshift(currentUser);
    currentUser = currentUser.parentId ? getUserById(currentUser.parentId) : undefined;
  }

  return path;
};

// Export hierarchy summary for debugging
export const getHierarchySummary = () => {
  console.log('🏢 Hierarchy Summary:');
  console.log('Master Distributor:', getUserById('master-dist-1')?.name);
  console.log('Regional Distributors:', getDirectChildren('master-dist-1').map(u => u.name));
  console.log('Regional Dist 1 Sales Reps:', getDirectChildren('regional-dist-1').map(u => u.name));
  console.log('Regional Dist 1 Doctors:', getDoctorsInDownline('regional-dist-1').map(u => u.name));
  console.log('Regional Dist 2 Doctors:', getDoctorsInDownline('regional-dist-2').map(u => u.name));
};