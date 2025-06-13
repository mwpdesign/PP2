import { User } from '../types/auth';

// Hierarchy role definitions
export enum HierarchyRole {
  SYSTEM_ADMIN = 'system_admin',
  CHP_ADMIN = 'chp_admin',
  MASTER_DISTRIBUTOR = 'master_distributor',
  REGIONAL_DISTRIBUTOR = 'regional_distributor',
  SALES_REPRESENTATIVE = 'sales_representative',
  DOCTOR = 'doctor',
  OFFICE_ADMIN = 'office_admin',
  MEDICAL_STAFF = 'medical_staff',
  IVR_COMPANY = 'ivr_company',
  SHIPPING_LOGISTICS = 'shipping_logistics'
}

// Data access scope definitions
export enum DataAccessScope {
  SYSTEM_WIDE = 'system_wide',
  ORGANIZATION_WIDE = 'organization_wide',
  NETWORK_WIDE = 'network_wide',
  TERRITORY_WIDE = 'territory_wide',
  PERSONAL_ONLY = 'personal_only',
  PRACTICE_ONLY = 'practice_only'
}

// Hierarchy relationship interface
export interface HierarchyRelationship {
  userId: string;
  role: HierarchyRole;
  parentId?: string;
  organizationId: string;
  territoryId?: string;
  networkIds: string[];
  accessScope: DataAccessScope;
  permissions: string[];
}

// Data filtering context
export interface FilteringContext {
  user: User;
  hierarchy: HierarchyRelationship;
  requestedDataType: 'ivr' | 'orders' | 'shipping' | 'patients' | 'doctors';
  additionalFilters?: Record<string, any>;
}

// Filtered data result
export interface FilteredDataResult<T> {
  data: T[];
  totalCount: number;
  accessibleCount: number;
  scope: DataAccessScope;
  appliedFilters: string[];
  restrictions: string[];
}

// Base data entity interface
export interface BaseDataEntity {
  id: string;
  organizationId: string;
  createdBy: string;
  assignedTo?: string;
  territoryId?: string;
  networkId?: string;
  doctorId?: string;
  distributorId?: string;
  salesRepId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// IVR data entity
export interface IVRDataEntity extends BaseDataEntity {
  patientId: string;
  requestingDoctorId: string;
  assignedSalesRepId?: string;
  distributorNetworkId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  insuranceProvider: string;
}

// Order data entity
export interface OrderDataEntity extends BaseDataEntity {
  customerId: string;
  orderNumber: string;
  totalAmount: number;
  shippingAddress: any;
  orderItems: any[];
  fulfillmentStatus: string;
}

// Shipping data entity
export interface ShippingDataEntity extends BaseDataEntity {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shipmentStatus: string;
  estimatedDelivery: string;
  actualDelivery?: string;
}

export class HierarchyFilteringService {
  private static instance: HierarchyFilteringService;
  private hierarchyCache: Map<string, HierarchyRelationship> = new Map();
  private networkCache: Map<string, string[]> = new Map();

  private constructor() {}

  public static getInstance(): HierarchyFilteringService {
    if (!HierarchyFilteringService.instance) {
      HierarchyFilteringService.instance = new HierarchyFilteringService();
    }
    return HierarchyFilteringService.instance;
  }

  /**
   * Get user's hierarchy relationship and access scope
   */
  public async getUserHierarchy(userId: string): Promise<HierarchyRelationship> {
    // Check cache first
    if (this.hierarchyCache.has(userId)) {
      return this.hierarchyCache.get(userId)!;
    }

    // Mock hierarchy data - in production, this would come from API
    const mockHierarchy = this.getMockHierarchyData(userId);

    // Cache the result
    this.hierarchyCache.set(userId, mockHierarchy);

    return mockHierarchy;
  }

  /**
   * Determine data access scope based on user role and hierarchy
   */
  public getDataAccessScope(role: HierarchyRole): DataAccessScope {
    switch (role) {
      case HierarchyRole.SYSTEM_ADMIN:
        return DataAccessScope.SYSTEM_WIDE;

      case HierarchyRole.CHP_ADMIN:
        return DataAccessScope.ORGANIZATION_WIDE;

      case HierarchyRole.MASTER_DISTRIBUTOR:
        return DataAccessScope.NETWORK_WIDE;

      case HierarchyRole.REGIONAL_DISTRIBUTOR:
        return DataAccessScope.TERRITORY_WIDE;

      case HierarchyRole.SALES_REPRESENTATIVE:
        return DataAccessScope.PERSONAL_ONLY;

      case HierarchyRole.DOCTOR:
      case HierarchyRole.OFFICE_ADMIN:
      case HierarchyRole.MEDICAL_STAFF:
        return DataAccessScope.PRACTICE_ONLY;

      case HierarchyRole.IVR_COMPANY:
      case HierarchyRole.SHIPPING_LOGISTICS:
        return DataAccessScope.ORGANIZATION_WIDE;

      default:
        return DataAccessScope.PERSONAL_ONLY;
    }
  }

  /**
   * Filter IVR data based on user hierarchy
   */
  public async filterIVRData(
    data: IVRDataEntity[],
    context: FilteringContext
  ): Promise<FilteredDataResult<IVRDataEntity>> {
    const { user, hierarchy } = context;
    const appliedFilters: string[] = [];
    const restrictions: string[] = [];

    let filteredData = [...data];

    switch (hierarchy.accessScope) {
      case DataAccessScope.SYSTEM_WIDE:
        // System admin sees everything
        appliedFilters.push('system_wide_access');
        break;

      case DataAccessScope.ORGANIZATION_WIDE:
        // CHP Admin sees all within organization
        filteredData = filteredData.filter(item =>
          item.organizationId === hierarchy.organizationId
        );
        appliedFilters.push('organization_filter');
        break;

      case DataAccessScope.NETWORK_WIDE:
        // Master Distributor sees their entire network
        const networkIds = await this.getNetworkIds(hierarchy.userId);
        filteredData = filteredData.filter(item =>
          networkIds.includes(item.distributorNetworkId) ||
          item.distributorId === hierarchy.userId
        );
        appliedFilters.push('network_filter');
        break;

      case DataAccessScope.TERRITORY_WIDE:
        // Regional Distributor sees their territory
        filteredData = filteredData.filter(item =>
          item.territoryId === hierarchy.territoryId ||
          item.distributorId === hierarchy.userId ||
          item.assignedSalesRepId && this.isInTerritory(item.assignedSalesRepId, hierarchy.territoryId!)
        );
        appliedFilters.push('territory_filter');
        break;

      case DataAccessScope.PERSONAL_ONLY:
        // Sales Rep sees only their assigned IVRs
        filteredData = filteredData.filter(item =>
          item.assignedSalesRepId === hierarchy.userId ||
          item.createdBy === hierarchy.userId
        );
        appliedFilters.push('personal_filter');
        restrictions.push('limited_to_assigned_ivrs');
        break;

      case DataAccessScope.PRACTICE_ONLY:
        // Doctors see only their practice IVRs
        filteredData = filteredData.filter(item =>
          item.requestingDoctorId === hierarchy.userId ||
          (hierarchy.role === HierarchyRole.OFFICE_ADMIN &&
           this.isInSamePractice(item.requestingDoctorId, hierarchy.userId))
        );
        appliedFilters.push('practice_filter');
        break;
    }

    // Apply additional role-specific filters
    if (hierarchy.role === HierarchyRole.IVR_COMPANY) {
      // IVR Company sees only IVRs assigned to them or in review
      filteredData = filteredData.filter(item =>
        ['submitted', 'in_review', 'documents_requested'].includes(item.status)
      );
      appliedFilters.push('ivr_company_status_filter');
    }

    // Apply priority-based filtering for certain roles
    if ([HierarchyRole.SALES_REPRESENTATIVE, HierarchyRole.REGIONAL_DISTRIBUTOR].includes(hierarchy.role)) {
      // Show high priority items first, but don't filter out others
      filteredData.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      appliedFilters.push('priority_sort');
    }

    return {
      data: filteredData,
      totalCount: data.length,
      accessibleCount: filteredData.length,
      scope: hierarchy.accessScope,
      appliedFilters,
      restrictions
    };
  }

  /**
   * Filter Order data based on user hierarchy
   */
  public async filterOrderData(
    data: OrderDataEntity[],
    context: FilteringContext
  ): Promise<FilteredDataResult<OrderDataEntity>> {
    const { user, hierarchy } = context;
    const appliedFilters: string[] = [];
    const restrictions: string[] = [];

    let filteredData = [...data];

    switch (hierarchy.accessScope) {
      case DataAccessScope.SYSTEM_WIDE:
        appliedFilters.push('system_wide_access');
        break;

      case DataAccessScope.ORGANIZATION_WIDE:
        filteredData = filteredData.filter(item =>
          item.organizationId === hierarchy.organizationId
        );
        appliedFilters.push('organization_filter');
        break;

      case DataAccessScope.NETWORK_WIDE:
        const networkIds = await this.getNetworkIds(hierarchy.userId);
        filteredData = filteredData.filter(item =>
          networkIds.includes(item.networkId!) ||
          item.distributorId === hierarchy.userId
        );
        appliedFilters.push('network_filter');
        break;

      case DataAccessScope.TERRITORY_WIDE:
        filteredData = filteredData.filter(item =>
          item.territoryId === hierarchy.territoryId ||
          item.salesRepId === hierarchy.userId ||
          (item.salesRepId && this.isInTerritory(item.salesRepId, hierarchy.territoryId!))
        );
        appliedFilters.push('territory_filter');
        break;

      case DataAccessScope.PERSONAL_ONLY:
        filteredData = filteredData.filter(item =>
          item.salesRepId === hierarchy.userId ||
          item.createdBy === hierarchy.userId
        );
        appliedFilters.push('personal_filter');
        restrictions.push('limited_to_assigned_orders');
        break;

      case DataAccessScope.PRACTICE_ONLY:
        filteredData = filteredData.filter(item =>
          item.customerId === hierarchy.userId ||
          (hierarchy.role === HierarchyRole.OFFICE_ADMIN &&
           this.isInSamePractice(item.customerId, hierarchy.userId))
        );
        appliedFilters.push('practice_filter');
        break;
    }

    // Apply shipping logistics specific filtering
    if (hierarchy.role === HierarchyRole.SHIPPING_LOGISTICS) {
      filteredData = filteredData.filter(item =>
        ['processing', 'shipped', 'in_transit'].includes(item.fulfillmentStatus)
      );
      appliedFilters.push('shipping_status_filter');
    }

    return {
      data: filteredData,
      totalCount: data.length,
      accessibleCount: filteredData.length,
      scope: hierarchy.accessScope,
      appliedFilters,
      restrictions
    };
  }

  /**
   * Filter Shipping data based on user hierarchy
   */
  public async filterShippingData(
    data: ShippingDataEntity[],
    context: FilteringContext
  ): Promise<FilteredDataResult<ShippingDataEntity>> {
    const { user, hierarchy } = context;
    const appliedFilters: string[] = [];
    const restrictions: string[] = [];

    let filteredData = [...data];

    switch (hierarchy.accessScope) {
      case DataAccessScope.SYSTEM_WIDE:
        appliedFilters.push('system_wide_access');
        break;

      case DataAccessScope.ORGANIZATION_WIDE:
        filteredData = filteredData.filter(item =>
          item.organizationId === hierarchy.organizationId
        );
        appliedFilters.push('organization_filter');
        break;

      case DataAccessScope.NETWORK_WIDE:
        const networkIds = await this.getNetworkIds(hierarchy.userId);
        filteredData = filteredData.filter(item =>
          networkIds.includes(item.networkId!) ||
          item.distributorId === hierarchy.userId
        );
        appliedFilters.push('network_filter');
        break;

      case DataAccessScope.TERRITORY_WIDE:
        filteredData = filteredData.filter(item =>
          item.territoryId === hierarchy.territoryId ||
          (item.salesRepId && this.isInTerritory(item.salesRepId, hierarchy.territoryId!))
        );
        appliedFilters.push('territory_filter');
        break;

      case DataAccessScope.PERSONAL_ONLY:
        filteredData = filteredData.filter(item =>
          item.salesRepId === hierarchy.userId ||
          item.createdBy === hierarchy.userId
        );
        appliedFilters.push('personal_filter');
        restrictions.push('limited_to_assigned_shipments');
        break;

      case DataAccessScope.PRACTICE_ONLY:
        // Doctors can see shipments for their orders
        filteredData = filteredData.filter(item =>
          this.isOrderFromPractice(item.orderId, hierarchy.userId)
        );
        appliedFilters.push('practice_filter');
        break;
    }

    return {
      data: filteredData,
      totalCount: data.length,
      accessibleCount: filteredData.length,
      scope: hierarchy.accessScope,
      appliedFilters,
      restrictions
    };
  }

  /**
   * Check if user can access specific data item
   */
  public async canAccessData(
    dataItem: BaseDataEntity,
    userId: string,
    dataType: string
  ): Promise<boolean> {
    const hierarchy = await this.getUserHierarchy(userId);

    switch (hierarchy.accessScope) {
      case DataAccessScope.SYSTEM_WIDE:
        return true;

      case DataAccessScope.ORGANIZATION_WIDE:
        return dataItem.organizationId === hierarchy.organizationId;

      case DataAccessScope.NETWORK_WIDE:
        const networkIds = await this.getNetworkIds(hierarchy.userId);
        return networkIds.includes(dataItem.networkId!) ||
               dataItem.distributorId === hierarchy.userId;

      case DataAccessScope.TERRITORY_WIDE:
        return dataItem.territoryId === hierarchy.territoryId ||
               dataItem.salesRepId === hierarchy.userId;

      case DataAccessScope.PERSONAL_ONLY:
        return dataItem.createdBy === hierarchy.userId ||
               dataItem.assignedTo === hierarchy.userId;

      case DataAccessScope.PRACTICE_ONLY:
        return dataItem.doctorId === hierarchy.userId ||
               (hierarchy.role === HierarchyRole.OFFICE_ADMIN &&
                this.isInSamePractice(dataItem.doctorId!, hierarchy.userId));

      default:
        return false;
    }
  }

  /**
   * Get accessible user IDs based on hierarchy
   */
  public async getAccessibleUserIds(userId: string): Promise<string[]> {
    const hierarchy = await this.getUserHierarchy(userId);
    const accessibleIds: string[] = [userId];

    switch (hierarchy.accessScope) {
      case DataAccessScope.SYSTEM_WIDE:
        // System admin can access all users
        return this.getAllUserIds();

      case DataAccessScope.ORGANIZATION_WIDE:
        return this.getOrganizationUserIds(hierarchy.organizationId);

      case DataAccessScope.NETWORK_WIDE:
        const networkIds = await this.getNetworkIds(hierarchy.userId);
        return this.getNetworkUserIds(networkIds);

      case DataAccessScope.TERRITORY_WIDE:
        return this.getTerritoryUserIds(hierarchy.territoryId!);

      case DataAccessScope.PERSONAL_ONLY:
        return [userId];

      case DataAccessScope.PRACTICE_ONLY:
        return this.getPracticeUserIds(userId);

      default:
        return [userId];
    }
  }

  /**
   * Validate hierarchy relationship
   */
  public async validateHierarchy(
    parentId: string,
    childId: string
  ): Promise<boolean> {
    const parentHierarchy = await this.getUserHierarchy(parentId);
    const childHierarchy = await this.getUserHierarchy(childId);

    // Check if parent has higher or equal access scope
    const scopeHierarchy = [
      DataAccessScope.PERSONAL_ONLY,
      DataAccessScope.PRACTICE_ONLY,
      DataAccessScope.TERRITORY_WIDE,
      DataAccessScope.NETWORK_WIDE,
      DataAccessScope.ORGANIZATION_WIDE,
      DataAccessScope.SYSTEM_WIDE
    ];

    const parentScopeLevel = scopeHierarchy.indexOf(parentHierarchy.accessScope);
    const childScopeLevel = scopeHierarchy.indexOf(childHierarchy.accessScope);

    return parentScopeLevel >= childScopeLevel;
  }

  // Private helper methods

  private getMockHierarchyData(userId: string): HierarchyRelationship {
    // Mock data - in production, this would come from database
    const mockHierarchies: Record<string, HierarchyRelationship> = {
      'system-admin-1': {
        userId: 'system-admin-1',
        role: HierarchyRole.SYSTEM_ADMIN,
        organizationId: 'org-1',
        networkIds: [],
        accessScope: DataAccessScope.SYSTEM_WIDE,
        permissions: ['*']
      },
      'chp-admin-1': {
        userId: 'chp-admin-1',
        role: HierarchyRole.CHP_ADMIN,
        organizationId: 'org-1',
        networkIds: ['network-1', 'network-2'],
        accessScope: DataAccessScope.ORGANIZATION_WIDE,
        permissions: ['view_all', 'manage_distributors', 'view_reports']
      },
      'master-dist-1': {
        userId: 'master-dist-1',
        role: HierarchyRole.MASTER_DISTRIBUTOR,
        organizationId: 'org-1',
        networkIds: ['network-1'],
        accessScope: DataAccessScope.NETWORK_WIDE,
        permissions: ['view_network', 'manage_regional', 'view_reports']
      },
      'regional-dist-1': {
        userId: 'regional-dist-1',
        role: HierarchyRole.REGIONAL_DISTRIBUTOR,
        parentId: 'master-dist-1',
        organizationId: 'org-1',
        territoryId: 'territory-1',
        networkIds: ['network-1'],
        accessScope: DataAccessScope.TERRITORY_WIDE,
        permissions: ['view_territory', 'manage_sales', 'view_reports']
      },
      'sales-rep-1': {
        userId: 'sales-rep-1',
        role: HierarchyRole.SALES_REPRESENTATIVE,
        parentId: 'regional-dist-1',
        organizationId: 'org-1',
        territoryId: 'territory-1',
        networkIds: ['network-1'],
        accessScope: DataAccessScope.PERSONAL_ONLY,
        permissions: ['view_assigned', 'manage_doctors']
      }
    };

    return mockHierarchies[userId] || {
      userId,
      role: HierarchyRole.SALES_REPRESENTATIVE,
      organizationId: 'org-1',
      networkIds: [],
      accessScope: DataAccessScope.PERSONAL_ONLY,
      permissions: ['view_assigned']
    };
  }

  private async getNetworkIds(userId: string): Promise<string[]> {
    if (this.networkCache.has(userId)) {
      return this.networkCache.get(userId)!;
    }

    // Mock network data
    const networkIds = ['network-1', 'network-2'];
    this.networkCache.set(userId, networkIds);
    return networkIds;
  }

  private isInTerritory(userId: string, territoryId: string): boolean {
    // Mock territory check
    return true;
  }

  private isInSamePractice(doctorId: string, userId: string): boolean {
    // Mock practice check
    return true;
  }

  private isOrderFromPractice(orderId: string, userId: string): boolean {
    // Mock order practice check
    return true;
  }

  private getAllUserIds(): string[] {
    return ['system-admin-1', 'chp-admin-1', 'master-dist-1', 'regional-dist-1', 'sales-rep-1'];
  }

  private getOrganizationUserIds(organizationId: string): string[] {
    return ['chp-admin-1', 'master-dist-1', 'regional-dist-1', 'sales-rep-1'];
  }

  private getNetworkUserIds(networkIds: string[]): string[] {
    return ['master-dist-1', 'regional-dist-1', 'sales-rep-1'];
  }

  private getTerritoryUserIds(territoryId: string): string[] {
    return ['regional-dist-1', 'sales-rep-1'];
  }

  private getPracticeUserIds(userId: string): string[] {
    return [userId];
  }

  /**
   * Clear caches (useful for testing or when hierarchy changes)
   */
  public clearCaches(): void {
    this.hierarchyCache.clear();
    this.networkCache.clear();
  }

  /**
   * Get filtering summary for debugging
   */
  public async getFilteringSummary(userId: string): Promise<{
    hierarchy: HierarchyRelationship;
    accessibleUserIds: string[];
    scope: DataAccessScope;
    permissions: string[];
  }> {
    const hierarchy = await this.getUserHierarchy(userId);
    const accessibleUserIds = await this.getAccessibleUserIds(userId);

    return {
      hierarchy,
      accessibleUserIds,
      scope: hierarchy.accessScope,
      permissions: hierarchy.permissions
    };
  }
}