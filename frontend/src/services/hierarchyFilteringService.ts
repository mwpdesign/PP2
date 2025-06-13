import { SharedIVRRequest } from '../data/mockIVRData';
import { SharedOrder } from '../data/mockOrderData';
import { UserProfile } from '../types/auth';
import {
  getUserByEmail,
  getDoctorsInDownline,
  getAllDescendants,
  getHierarchySummary,
  HierarchyUser
} from '../data/mockHierarchyData';

// Add Salesperson interface for filtering
export interface Salesperson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  distributorId: string;
  distributorName: string;
  territory: string;
  activeDoctors: number;
  totalIVRs: number;
  status: 'active' | 'inactive';
  employeeId: string;
  startDate: string;
  commissionRate: number;
  salesGoals: {
    monthly: number;
    quarterly: number;
  };
  performance: {
    doctorsAdded: number;
    ivrsGenerated: number;
    growthRate: number;
    tier: 'top' | 'average' | 'low';
  };
  lastActivity: string;
}

export interface FilterResult {
  filteredData: SharedIVRRequest[];
  totalCount: number;
  filteredCount: number;
  filterReason: string;
  allowedDoctorIds: string[];
  userHierarchyInfo: {
    userId: string;
    role: string;
    downlineUsers: HierarchyUser[];
    downlineDoctors: HierarchyUser[];
  };
}

export interface OrderFilterResult {
  filteredData: SharedOrder[];
  totalCount: number;
  filteredCount: number;
  filterReason: string;
  allowedDoctorIds: string[];
  userHierarchyInfo: {
    userId: string;
    role: string;
    downlineUsers: HierarchyUser[];
    downlineDoctors: HierarchyUser[];
  };
}

export interface SalespeopleFilterResult {
  filteredData: Salesperson[];
  totalCount: number;
  filteredCount: number;
  filterReason: string;
  allowedSalesRepIds: string[];
  userHierarchyInfo: {
    userId: string;
    role: string;
    downlineUsers: HierarchyUser[];
    downlineSalesReps: HierarchyUser[];
  };
}

export class HierarchyFilteringService {
  /**
   * Main filtering method - filters IVR data based on user hierarchy
   */
  static filterIVRDataByHierarchy(
    ivrData: SharedIVRRequest[],
    currentUser: UserProfile | null
  ): FilterResult {
    console.log('🔍 [HierarchyFilteringService] Starting hierarchy filtering...');
    console.log('📊 Input data count:', ivrData.length);
    console.log('👤 Current user:', currentUser?.email, 'Role:', currentUser?.role);

    // Print hierarchy summary for debugging
    getHierarchySummary();

    if (!currentUser) {
      console.log('❌ No current user - returning empty results');
      return {
        filteredData: [],
        totalCount: ivrData.length,
        filteredCount: 0,
        filterReason: 'No authenticated user',
        allowedDoctorIds: [],
        userHierarchyInfo: {
          userId: '',
          role: '',
          downlineUsers: [],
          downlineDoctors: []
        }
      };
    }

    // Get hierarchy user data
    const hierarchyUser = getUserByEmail(currentUser.email);
    if (!hierarchyUser) {
      console.log('❌ User not found in hierarchy data:', currentUser.email);
      return {
        filteredData: [],
        totalCount: ivrData.length,
        filteredCount: 0,
        filterReason: `User ${currentUser.email} not found in hierarchy`,
        allowedDoctorIds: [],
        userHierarchyInfo: {
          userId: '',
          role: currentUser.role || '',
          downlineUsers: [],
          downlineDoctors: []
        }
      };
    }

    console.log('✅ Found hierarchy user:', hierarchyUser.name, 'ID:', hierarchyUser.id);

    // Apply role-based filtering
    switch (currentUser.role) {
      case 'Master Distributor':
        return this.filterForMasterDistributor(ivrData, hierarchyUser);

      case 'Distributor': // Regional Distributor
        return this.filterForRegionalDistributor(ivrData, hierarchyUser);

      case 'Sales':
        return this.filterForSalesRep(ivrData, hierarchyUser);

      case 'Doctor':
        return this.filterForDoctor(ivrData, hierarchyUser);

      case 'Admin':
      case 'CHP Admin':
        return this.filterForAdmin(ivrData, hierarchyUser);

      default:
        console.log('❌ Unknown role:', currentUser.role);
        return {
          filteredData: [],
          totalCount: ivrData.length,
          filteredCount: 0,
          filterReason: `Unknown role: ${currentUser.role}`,
          allowedDoctorIds: [],
          userHierarchyInfo: {
            userId: hierarchyUser.id,
            role: currentUser.role || '',
            downlineUsers: [],
            downlineDoctors: []
          }
        };
    }
  }

  /**
   * Main filtering method - filters Order data based on user hierarchy
   */
  static filterOrderDataByHierarchy(
    orderData: SharedOrder[],
    currentUser: UserProfile | null
  ): OrderFilterResult {
    console.log('🔍 [HierarchyFilteringService] Starting order hierarchy filtering...');
    console.log('📦 Input order count:', orderData.length);
    console.log('👤 Current user:', currentUser?.email, 'Role:', currentUser?.role);

    // Print hierarchy summary for debugging
    getHierarchySummary();

    if (!currentUser) {
      console.log('❌ No current user - returning empty results');
      return {
        filteredData: [],
        totalCount: orderData.length,
        filteredCount: 0,
        filterReason: 'No authenticated user',
        allowedDoctorIds: [],
        userHierarchyInfo: {
          userId: '',
          role: '',
          downlineUsers: [],
          downlineDoctors: []
        }
      };
    }

    // Get hierarchy user data
    const hierarchyUser = getUserByEmail(currentUser.email);
    if (!hierarchyUser) {
      console.log('❌ User not found in hierarchy data:', currentUser.email);
      return {
        filteredData: [],
        totalCount: orderData.length,
        filteredCount: 0,
        filterReason: `User ${currentUser.email} not found in hierarchy`,
        allowedDoctorIds: [],
        userHierarchyInfo: {
          userId: '',
          role: currentUser.role || '',
          downlineUsers: [],
          downlineDoctors: []
        }
      };
    }

    console.log('✅ Found hierarchy user:', hierarchyUser.name, 'ID:', hierarchyUser.id);

    // Apply role-based filtering
    switch (currentUser.role) {
      case 'Master Distributor':
        return this.filterOrdersForMasterDistributor(orderData, hierarchyUser);

      case 'Distributor': // Regional Distributor
        return this.filterOrdersForRegionalDistributor(orderData, hierarchyUser);

      case 'Sales':
        return this.filterOrdersForSalesRep(orderData, hierarchyUser);

      case 'Doctor':
        return this.filterOrdersForDoctor(orderData, hierarchyUser);

      case 'Admin':
      case 'CHP Admin':
        return this.filterOrdersForAdmin(orderData, hierarchyUser);

      default:
        console.log('❌ Unknown role:', currentUser.role);
        return {
          filteredData: [],
          totalCount: orderData.length,
          filteredCount: 0,
          filterReason: `Unknown role: ${currentUser.role}`,
          allowedDoctorIds: [],
          userHierarchyInfo: {
            userId: hierarchyUser.id,
            role: currentUser.role || '',
            downlineUsers: [],
            downlineDoctors: []
          }
        };
    }
  }

  /**
   * Filter for Master Distributor - sees all IVRs
   */
  private static filterForMasterDistributor(
    ivrData: SharedIVRRequest[],
    hierarchyUser: HierarchyUser
  ): FilterResult {
    console.log('🏢 [Master Distributor] Showing all IVRs');

    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    return {
      filteredData: ivrData,
      totalCount: ivrData.length,
      filteredCount: ivrData.length,
      filterReason: 'Master Distributor - Full access to all IVRs',
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Master Distributor',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Regional Distributor - sees only IVRs from doctors in their downline
   */
  private static filterForRegionalDistributor(
    ivrData: SharedIVRRequest[],
    hierarchyUser: HierarchyUser
  ): FilterResult {
    console.log('🌍 [Regional Distributor] Filtering for downline doctors...');

    // Get all doctors in this regional distributor's downline
    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    console.log('👥 Downline users:', downlineUsers.map(u => `${u.name} (${u.role})`));
    console.log('👨‍⚕️ Downline doctors:', downlineDoctors.map(d => d.name));
    console.log('🆔 Allowed doctor IDs:', allowedDoctorIds);

    // Filter IVRs to only include those from doctors in the downline
    const filteredData = ivrData.filter(ivr => {
      const isAllowed = allowedDoctorIds.includes(ivr.doctorId) ||
                       allowedDoctorIds.includes(ivr.requestingDoctorId) ||
                       ivr.distributorId === hierarchyUser.id ||
                       ivr.regionalDistributorId === hierarchyUser.id;

      if (isAllowed) {
        console.log(`✅ Including IVR ${ivr.ivrNumber} from doctor ${ivr.doctorId} (${ivr.doctorName})`);
      } else {
        console.log(`❌ Excluding IVR ${ivr.ivrNumber} from doctor ${ivr.doctorId} (${ivr.doctorName}) - not in downline`);
      }

      return isAllowed;
    });

    console.log(`📊 Filtered ${filteredData.length} IVRs out of ${ivrData.length} total`);

    return {
      filteredData,
      totalCount: ivrData.length,
      filteredCount: filteredData.length,
      filterReason: `Regional Distributor - Showing IVRs from ${downlineDoctors.length} doctors in downline`,
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Regional Distributor',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Sales Rep - sees only IVRs from doctors they manage
   */
  private static filterForSalesRep(
    ivrData: SharedIVRRequest[],
    hierarchyUser: HierarchyUser
  ): FilterResult {
    console.log('💼 [Sales Rep] Filtering for managed doctors...');

    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    const filteredData = ivrData.filter(ivr =>
      allowedDoctorIds.includes(ivr.doctorId) ||
      allowedDoctorIds.includes(ivr.requestingDoctorId) ||
      ivr.salesRepId === hierarchyUser.id ||
      ivr.assignedSalesRepId === hierarchyUser.id
    );

    return {
      filteredData,
      totalCount: ivrData.length,
      filteredCount: filteredData.length,
      filterReason: `Sales Rep - Showing IVRs from ${downlineDoctors.length} managed doctors`,
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Sales Rep',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Doctor - sees only their own IVRs
   */
  private static filterForDoctor(
    ivrData: SharedIVRRequest[],
    hierarchyUser: HierarchyUser
  ): FilterResult {
    console.log('👨‍⚕️ [Doctor] Filtering for own IVRs...');

    const filteredData = ivrData.filter(ivr =>
      ivr.doctorId === hierarchyUser.id ||
      ivr.requestingDoctorId === hierarchyUser.id ||
      ivr.createdBy === hierarchyUser.id
    );

    return {
      filteredData,
      totalCount: ivrData.length,
      filteredCount: filteredData.length,
      filterReason: 'Doctor - Showing only own IVRs',
      allowedDoctorIds: [hierarchyUser.id],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Doctor',
        downlineUsers: [],
        downlineDoctors: []
      }
    };
  }

  /**
   * Filter for Admin - sees all IVRs
   */
  private static filterForAdmin(
    ivrData: SharedIVRRequest[],
    hierarchyUser: HierarchyUser
  ): FilterResult {
    console.log('🔧 [Admin] Showing all IVRs');

    return {
      filteredData: ivrData,
      totalCount: ivrData.length,
      filteredCount: ivrData.length,
      filterReason: 'Admin - Full access to all IVRs',
      allowedDoctorIds: [],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Admin',
        downlineUsers: [],
        downlineDoctors: []
      }
    };
  }

  // ORDER FILTERING METHODS

  /**
   * Filter for Master Distributor - sees all orders
   */
  private static filterOrdersForMasterDistributor(
    orderData: SharedOrder[],
    hierarchyUser: HierarchyUser
  ): OrderFilterResult {
    console.log('🏢 [Master Distributor] Showing all orders');

    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    return {
      filteredData: orderData,
      totalCount: orderData.length,
      filteredCount: orderData.length,
      filterReason: 'Master Distributor - Full access to all orders',
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Master Distributor',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Regional Distributor - sees only orders from doctors in their downline
   */
  private static filterOrdersForRegionalDistributor(
    orderData: SharedOrder[],
    hierarchyUser: HierarchyUser
  ): OrderFilterResult {
    console.log('🌍 [Regional Distributor] Filtering orders for downline doctors...');

    // Get all doctors in this regional distributor's downline
    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    console.log('👥 Downline users:', downlineUsers.map(u => `${u.name} (${u.role})`));
    console.log('👨‍⚕️ Downline doctors:', downlineDoctors.map(d => d.name));
    console.log('🆔 Allowed doctor IDs:', allowedDoctorIds);

    // Filter orders to only include those from doctors in the downline
    const filteredData = orderData.filter(order => {
      const isAllowed = allowedDoctorIds.includes(order.doctorId) ||
                       order.distributorId === hierarchyUser.id ||
                       order.regionalDistributorId === hierarchyUser.id;

      if (isAllowed) {
        console.log(`✅ Including order ${order.orderNumber} from doctor ${order.doctorId} (${order.doctorName})`);
      } else {
        console.log(`❌ Excluding order ${order.orderNumber} from doctor ${order.doctorId} (${order.doctorName}) - not in downline`);
      }

      return isAllowed;
    });

    console.log(`📦 Filtered ${filteredData.length} orders out of ${orderData.length} total`);

    return {
      filteredData,
      totalCount: orderData.length,
      filteredCount: filteredData.length,
      filterReason: `Regional Distributor - Showing orders from ${downlineDoctors.length} doctors in downline`,
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Regional Distributor',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Sales Rep - sees only orders from doctors they manage
   */
  private static filterOrdersForSalesRep(
    orderData: SharedOrder[],
    hierarchyUser: HierarchyUser
  ): OrderFilterResult {
    console.log('💼 [Sales Rep] Filtering orders for managed doctors...');

    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineDoctors = downlineUsers.filter(user => user.role === 'Doctor');
    const allowedDoctorIds = downlineDoctors.map(doctor => doctor.id);

    const filteredData = orderData.filter(order =>
      allowedDoctorIds.includes(order.doctorId) ||
      order.salesRepId === hierarchyUser.id ||
      order.assignedSalesRepId === hierarchyUser.id
    );

    return {
      filteredData,
      totalCount: orderData.length,
      filteredCount: filteredData.length,
      filterReason: `Sales Rep - Showing orders from ${downlineDoctors.length} managed doctors`,
      allowedDoctorIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Sales Rep',
        downlineUsers,
        downlineDoctors
      }
    };
  }

  /**
   * Filter for Doctor - sees only their own orders
   */
  private static filterOrdersForDoctor(
    orderData: SharedOrder[],
    hierarchyUser: HierarchyUser
  ): OrderFilterResult {
    console.log('👨‍⚕️ [Doctor] Filtering for own orders...');

    const filteredData = orderData.filter(order =>
      order.doctorId === hierarchyUser.id ||
      order.createdBy === hierarchyUser.id
    );

    return {
      filteredData,
      totalCount: orderData.length,
      filteredCount: filteredData.length,
      filterReason: 'Doctor - Showing only own orders',
      allowedDoctorIds: [hierarchyUser.id],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Doctor',
        downlineUsers: [],
        downlineDoctors: []
      }
    };
  }

  /**
   * Filter for Admin - sees all orders
   */
  private static filterOrdersForAdmin(
    orderData: SharedOrder[],
    hierarchyUser: HierarchyUser
  ): OrderFilterResult {
    console.log('🔧 [Admin] Showing all orders');

    return {
      filteredData: orderData,
      totalCount: orderData.length,
      filteredCount: orderData.length,
      filterReason: 'Admin - Full access to all orders',
      allowedDoctorIds: [],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Admin',
        downlineUsers: [],
        downlineDoctors: []
      }
    };
  }

  /**
   * Get hierarchy information for a user (for debugging/display)
   */
  static getUserHierarchyInfo(userEmail: string): HierarchyUser | null {
    return getUserByEmail(userEmail);
  }

  /**
   * Check if a user can access a specific IVR
   */
  static canUserAccessIVR(
    ivr: SharedIVRRequest,
    currentUser: UserProfile | null
  ): boolean {
    if (!currentUser) return false;

    const filterResult = this.filterIVRDataByHierarchy([ivr], currentUser);
    return filterResult.filteredData.length > 0;
  }

  /**
   * Check if a user can access a specific order
   */
  static canUserAccessOrder(
    order: SharedOrder,
    currentUser: UserProfile | null
  ): boolean {
    if (!currentUser) return false;

    const filterResult = this.filterOrderDataByHierarchy([order], currentUser);
    return filterResult.filteredData.length > 0;
  }

  /**
   * Get summary of filtering results for display
   */
  static getFilteringSummary(filterResult: FilterResult): string {
    const { totalCount, filteredCount, filterReason, userHierarchyInfo } = filterResult;

    if (filteredCount === totalCount) {
      return `Showing all ${totalCount} IVRs - ${filterReason}`;
    } else {
      return `Showing ${filteredCount} of ${totalCount} IVRs - ${filterReason}`;
    }
  }

  /**
   * Get summary of order filtering results for display
   */
  static getOrderFilteringSummary(filterResult: OrderFilterResult): string {
    const { filteredCount, totalCount, filterReason } = filterResult;
    if (filteredCount === totalCount) {
      return `Showing all ${totalCount} orders`;
    }
    return `Showing ${filteredCount} of ${totalCount} orders - ${filterReason}`;
  }

  /**
   * Main filtering method - filters Salespeople data based on user hierarchy
   */
  static filterSalespeopleDataByHierarchy(
    salespeopleData: Salesperson[],
    currentUser: UserProfile | null
  ): SalespeopleFilterResult {
    console.log('🔍 [HierarchyFilteringService] Starting salespeople hierarchy filtering...');
    console.log('👥 Input salespeople count:', salespeopleData.length);
    console.log('👤 Current user:', currentUser?.email, 'Role:', currentUser?.role);

    // Print hierarchy summary for debugging
    getHierarchySummary();

    if (!currentUser) {
      console.log('❌ No current user - returning empty results');
      return {
        filteredData: [],
        totalCount: salespeopleData.length,
        filteredCount: 0,
        filterReason: 'No authenticated user',
        allowedSalesRepIds: [],
        userHierarchyInfo: {
          userId: '',
          role: '',
          downlineUsers: [],
          downlineSalesReps: []
        }
      };
    }

    // Get hierarchy user data
    const hierarchyUser = getUserByEmail(currentUser.email);
    if (!hierarchyUser) {
      console.log('❌ User not found in hierarchy data:', currentUser.email);
      return {
        filteredData: [],
        totalCount: salespeopleData.length,
        filteredCount: 0,
        filterReason: `User ${currentUser.email} not found in hierarchy`,
        allowedSalesRepIds: [],
        userHierarchyInfo: {
          userId: '',
          role: currentUser.role || '',
          downlineUsers: [],
          downlineSalesReps: []
        }
      };
    }

    console.log('✅ Found hierarchy user:', hierarchyUser.name, 'ID:', hierarchyUser.id);

    // Apply role-based filtering
    switch (currentUser.role) {
      case 'Master Distributor':
        return this.filterSalespeopleForMasterDistributor(salespeopleData, hierarchyUser);

      case 'Distributor': // Regional Distributor
        return this.filterSalespeopleForRegionalDistributor(salespeopleData, hierarchyUser);

      case 'Sales':
        return this.filterSalespeopleForSalesRep(salespeopleData, hierarchyUser);

      case 'Admin':
      case 'CHP Admin':
        return this.filterSalespeopleForAdmin(salespeopleData, hierarchyUser);

      default:
        console.log('❌ Unknown role for salespeople filtering:', currentUser.role);
        return {
          filteredData: [],
          totalCount: salespeopleData.length,
          filteredCount: 0,
          filterReason: `Role ${currentUser.role} cannot access salespeople data`,
          allowedSalesRepIds: [],
          userHierarchyInfo: {
            userId: hierarchyUser.id,
            role: currentUser.role || '',
            downlineUsers: [],
            downlineSalesReps: []
          }
        };
    }
  }

  // SALESPEOPLE FILTERING METHODS

  /**
   * Filter for Master Distributor - sees all salespeople
   */
  private static filterSalespeopleForMasterDistributor(
    salespeopleData: Salesperson[],
    hierarchyUser: HierarchyUser
  ): SalespeopleFilterResult {
    console.log('🏢 [Master Distributor] Showing all salespeople');

    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineSalesReps = downlineUsers.filter(user => user.role === 'Sales');
    const allowedSalesRepIds = downlineSalesReps.map(rep => rep.id);

    return {
      filteredData: salespeopleData,
      totalCount: salespeopleData.length,
      filteredCount: salespeopleData.length,
      filterReason: 'Master Distributor - Full access to all salespeople',
      allowedSalesRepIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Master Distributor',
        downlineUsers,
        downlineSalesReps
      }
    };
  }

  /**
   * Filter for Regional Distributor - sees only salespeople in their downline
   */
  private static filterSalespeopleForRegionalDistributor(
    salespeopleData: Salesperson[],
    hierarchyUser: HierarchyUser
  ): SalespeopleFilterResult {
    console.log('🌍 [Regional Distributor] Filtering for downline salespeople...');

    // Get all sales reps in this regional distributor's downline
    const downlineUsers = getAllDescendants(hierarchyUser.id);
    const downlineSalesReps = downlineUsers.filter(user => user.role === 'Sales');
    const allowedSalesRepIds = downlineSalesReps.map(rep => rep.id);

    console.log('👥 Downline users:', downlineUsers.map(u => `${u.name} (${u.role})`));
    console.log('💼 Downline sales reps:', downlineSalesReps.map(s => s.name));
    console.log('🆔 Allowed sales rep IDs:', allowedSalesRepIds);

    // Filter salespeople to only include those in the downline
    const filteredData = salespeopleData.filter(salesperson => {
      const isAllowed = allowedSalesRepIds.includes(salesperson.id) ||
                       salesperson.distributorId === hierarchyUser.id;

      if (isAllowed) {
        console.log(`✅ Including salesperson ${salesperson.firstName} ${salesperson.lastName} (${salesperson.id})`);
      } else {
        console.log(`❌ Excluding salesperson ${salesperson.firstName} ${salesperson.lastName} (${salesperson.id}) - not in downline`);
      }

      return isAllowed;
    });

    console.log(`👥 Filtered ${filteredData.length} salespeople out of ${salespeopleData.length} total`);

    return {
      filteredData,
      totalCount: salespeopleData.length,
      filteredCount: filteredData.length,
      filterReason: `Regional Distributor - Showing ${downlineSalesReps.length} sales reps in your team`,
      allowedSalesRepIds,
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Regional Distributor',
        downlineUsers,
        downlineSalesReps
      }
    };
  }

  /**
   * Filter for Sales Rep - sees only themselves (no subordinate sales reps)
   */
  private static filterSalespeopleForSalesRep(
    salespeopleData: Salesperson[],
    hierarchyUser: HierarchyUser
  ): SalespeopleFilterResult {
    console.log('💼 [Sales Rep] Filtering for self only...');

    const filteredData = salespeopleData.filter(salesperson =>
      salesperson.id === hierarchyUser.id
    );

    return {
      filteredData,
      totalCount: salespeopleData.length,
      filteredCount: filteredData.length,
      filterReason: 'Sales Rep - Showing only your own profile',
      allowedSalesRepIds: [hierarchyUser.id],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Sales Rep',
        downlineUsers: [],
        downlineSalesReps: []
      }
    };
  }

  /**
   * Filter for Admin - sees all salespeople
   */
  private static filterSalespeopleForAdmin(
    salespeopleData: Salesperson[],
    hierarchyUser: HierarchyUser
  ): SalespeopleFilterResult {
    console.log('🔧 [Admin] Showing all salespeople');

    return {
      filteredData: salespeopleData,
      totalCount: salespeopleData.length,
      filteredCount: salespeopleData.length,
      filterReason: 'Admin - Full access to all salespeople',
      allowedSalesRepIds: [],
      userHierarchyInfo: {
        userId: hierarchyUser.id,
        role: 'Admin',
        downlineUsers: [],
        downlineSalesReps: []
      }
    };
  }

  static getSalespeopleFilteringSummary(filterResult: SalespeopleFilterResult): string {
    const { filteredCount, totalCount, filterReason } = filterResult;
    if (filteredCount === totalCount) {
      return `Showing all ${totalCount} sales representatives`;
    }
    return `Showing ${filteredCount} of ${totalCount} sales representatives - ${filterReason}`;
  }
}