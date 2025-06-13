import {
  HierarchyFilteringService,
  HierarchyRole,
  DataAccessScope,
  IVRDataEntity,
  OrderDataEntity,
  ShippingDataEntity,
  FilteringContext,
  HierarchyRelationship
} from '../hierarchyFilteringService';

describe('HierarchyFilteringService', () => {
  let service: HierarchyFilteringService;

  beforeEach(() => {
    service = HierarchyFilteringService.getInstance();
    service.clearCaches();
  });

  describe('Data Access Scope Determination', () => {
    test('should return correct access scope for each role', () => {
      expect(service.getDataAccessScope(HierarchyRole.SYSTEM_ADMIN))
        .toBe(DataAccessScope.SYSTEM_WIDE);

      expect(service.getDataAccessScope(HierarchyRole.CHP_ADMIN))
        .toBe(DataAccessScope.ORGANIZATION_WIDE);

      expect(service.getDataAccessScope(HierarchyRole.MASTER_DISTRIBUTOR))
        .toBe(DataAccessScope.NETWORK_WIDE);

      expect(service.getDataAccessScope(HierarchyRole.REGIONAL_DISTRIBUTOR))
        .toBe(DataAccessScope.TERRITORY_WIDE);

      expect(service.getDataAccessScope(HierarchyRole.SALES_REPRESENTATIVE))
        .toBe(DataAccessScope.PERSONAL_ONLY);

      expect(service.getDataAccessScope(HierarchyRole.DOCTOR))
        .toBe(DataAccessScope.PRACTICE_ONLY);
    });
  });

  describe('IVR Data Filtering', () => {
    const mockIVRData: IVRDataEntity[] = [
      {
        id: 'ivr-1',
        organizationId: 'org-1',
        createdBy: 'sales-rep-1',
        territoryId: 'territory-1',
        networkId: 'network-1',
        distributorId: 'regional-dist-1',
        salesRepId: 'sales-rep-1',
        status: 'submitted',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        patientId: 'patient-1',
        requestingDoctorId: 'doctor-1',
        assignedSalesRepId: 'sales-rep-1',
        distributorNetworkId: 'network-1',
        priority: 'high',
        insuranceProvider: 'Blue Cross'
      },
      {
        id: 'ivr-2',
        organizationId: 'org-1',
        createdBy: 'sales-rep-2',
        territoryId: 'territory-2',
        networkId: 'network-1',
        distributorId: 'regional-dist-2',
        salesRepId: 'sales-rep-2',
        status: 'in_review',
        createdAt: '2025-01-02',
        updatedAt: '2025-01-02',
        patientId: 'patient-2',
        requestingDoctorId: 'doctor-2',
        assignedSalesRepId: 'sales-rep-2',
        distributorNetworkId: 'network-1',
        priority: 'medium',
        insuranceProvider: 'Aetna'
      },
      {
        id: 'ivr-3',
        organizationId: 'org-2',
        createdBy: 'sales-rep-3',
        territoryId: 'territory-3',
        networkId: 'network-2',
        distributorId: 'regional-dist-3',
        salesRepId: 'sales-rep-3',
        status: 'approved',
        createdAt: '2025-01-03',
        updatedAt: '2025-01-03',
        patientId: 'patient-3',
        requestingDoctorId: 'doctor-3',
        assignedSalesRepId: 'sales-rep-3',
        distributorNetworkId: 'network-2',
        priority: 'low',
        insuranceProvider: 'UnitedHealth'
      }
    ];

    test('System Admin should see all IVR data', async () => {
      const hierarchy = await service.getUserHierarchy('system-admin-1');
      const context: FilteringContext = {
        user: { id: 'system-admin-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData(mockIVRData, context);

      expect(result.data).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.accessibleCount).toBe(3);
      expect(result.scope).toBe(DataAccessScope.SYSTEM_WIDE);
      expect(result.appliedFilters).toContain('system_wide_access');
    });

    test('CHP Admin should see organization-wide IVR data', async () => {
      const hierarchy = await service.getUserHierarchy('chp-admin-1');
      const context: FilteringContext = {
        user: { id: 'chp-admin-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData(mockIVRData, context);

      expect(result.data).toHaveLength(2); // Only org-1 data
      expect(result.appliedFilters).toContain('organization_filter');
      expect(result.data.every(item => item.organizationId === 'org-1')).toBe(true);
    });

    test('Master Distributor should see network-wide IVR data', async () => {
      const hierarchy = await service.getUserHierarchy('master-dist-1');
      const context: FilteringContext = {
        user: { id: 'master-dist-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData(mockIVRData, context);

      expect(result.data).toHaveLength(2); // network-1 data
      expect(result.appliedFilters).toContain('network_filter');
      expect(result.scope).toBe(DataAccessScope.NETWORK_WIDE);
    });

    test('Regional Distributor should see territory-wide IVR data', async () => {
      const hierarchy = await service.getUserHierarchy('regional-dist-1');
      const context: FilteringContext = {
        user: { id: 'regional-dist-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData(mockIVRData, context);

      expect(result.appliedFilters).toContain('territory_filter');
      expect(result.scope).toBe(DataAccessScope.TERRITORY_WIDE);
    });

    test('Sales Representative should see only assigned IVR data', async () => {
      const hierarchy = await service.getUserHierarchy('sales-rep-1');
      const context: FilteringContext = {
        user: { id: 'sales-rep-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData(mockIVRData, context);

      expect(result.data).toHaveLength(1); // Only assigned to sales-rep-1
      expect(result.appliedFilters).toContain('personal_filter');
      expect(result.restrictions).toContain('limited_to_assigned_ivrs');
      expect(result.scope).toBe(DataAccessScope.PERSONAL_ONLY);
    });

    test('should apply priority sorting for sales representatives', async () => {
      const hierarchy = await service.getUserHierarchy('sales-rep-1');
      const context: FilteringContext = {
        user: { id: 'sales-rep-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const priorityData = [
        { ...mockIVRData[0], priority: 'low' as const, assignedSalesRepId: 'sales-rep-1' },
        { ...mockIVRData[0], id: 'ivr-high', priority: 'high' as const, assignedSalesRepId: 'sales-rep-1' },
        { ...mockIVRData[0], id: 'ivr-urgent', priority: 'urgent' as const, assignedSalesRepId: 'sales-rep-1' }
      ];

      const result = await service.filterIVRData(priorityData, context);

      expect(result.appliedFilters).toContain('priority_sort');
      expect(result.data[0].priority).toBe('urgent');
      expect(result.data[1].priority).toBe('high');
      expect(result.data[2].priority).toBe('low');
    });
  });

  describe('Order Data Filtering', () => {
    const mockOrderData: OrderDataEntity[] = [
      {
        id: 'order-1',
        organizationId: 'org-1',
        createdBy: 'sales-rep-1',
        territoryId: 'territory-1',
        networkId: 'network-1',
        distributorId: 'regional-dist-1',
        salesRepId: 'sales-rep-1',
        status: 'pending',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        customerId: 'customer-1',
        orderNumber: 'ORD-001',
        totalAmount: 1500.00,
        shippingAddress: {},
        orderItems: [],
        fulfillmentStatus: 'pending'
      },
      {
        id: 'order-2',
        organizationId: 'org-1',
        createdBy: 'sales-rep-2',
        territoryId: 'territory-2',
        networkId: 'network-1',
        distributorId: 'regional-dist-2',
        salesRepId: 'sales-rep-2',
        status: 'processing',
        createdAt: '2025-01-02',
        updatedAt: '2025-01-02',
        customerId: 'customer-2',
        orderNumber: 'ORD-002',
        totalAmount: 2500.00,
        shippingAddress: {},
        orderItems: [],
        fulfillmentStatus: 'processing'
      }
    ];

    test('should filter orders by sales representative', async () => {
      const hierarchy = await service.getUserHierarchy('sales-rep-1');
      const context: FilteringContext = {
        user: { id: 'sales-rep-1' } as any,
        hierarchy,
        requestedDataType: 'orders'
      };

      const result = await service.filterOrderData(mockOrderData, context);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].salesRepId).toBe('sales-rep-1');
      expect(result.appliedFilters).toContain('personal_filter');
      expect(result.restrictions).toContain('limited_to_assigned_orders');
    });

    test('should apply shipping logistics filtering', async () => {
      const shippingHierarchy: HierarchyRelationship = {
        userId: 'shipping-1',
        role: HierarchyRole.SHIPPING_LOGISTICS,
        organizationId: 'org-1',
        networkIds: [],
        accessScope: DataAccessScope.ORGANIZATION_WIDE,
        permissions: ['view_shipments']
      };

      const context: FilteringContext = {
        user: { id: 'shipping-1' } as any,
        hierarchy: shippingHierarchy,
        requestedDataType: 'orders'
      };

      const result = await service.filterOrderData(mockOrderData, context);

      expect(result.appliedFilters).toContain('shipping_status_filter');
      expect(result.data.every(order =>
        ['processing', 'shipped', 'in_transit'].includes(order.fulfillmentStatus)
      )).toBe(true);
    });
  });

  describe('Shipping Data Filtering', () => {
    const mockShippingData: ShippingDataEntity[] = [
      {
        id: 'ship-1',
        organizationId: 'org-1',
        createdBy: 'sales-rep-1',
        territoryId: 'territory-1',
        networkId: 'network-1',
        distributorId: 'regional-dist-1',
        salesRepId: 'sales-rep-1',
        status: 'in_transit',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        orderId: 'order-1',
        trackingNumber: 'TRK-001',
        carrier: 'UPS',
        shipmentStatus: 'in_transit',
        estimatedDelivery: '2025-01-05'
      }
    ];

    test('should filter shipping data by territory', async () => {
      const hierarchy = await service.getUserHierarchy('regional-dist-1');
      const context: FilteringContext = {
        user: { id: 'regional-dist-1' } as any,
        hierarchy,
        requestedDataType: 'shipping'
      };

      const result = await service.filterShippingData(mockShippingData, context);

      expect(result.appliedFilters).toContain('territory_filter');
      expect(result.scope).toBe(DataAccessScope.TERRITORY_WIDE);
    });
  });

  describe('Access Control Methods', () => {
    test('should validate data access correctly', async () => {
      const dataItem = {
        id: 'test-1',
        organizationId: 'org-1',
        createdBy: 'sales-rep-1',
        territoryId: 'territory-1',
        networkId: 'network-1',
        distributorId: 'regional-dist-1',
        salesRepId: 'sales-rep-1',
        status: 'active',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      // Sales rep should have access to their own data
      const canAccess = await service.canAccessData(dataItem, 'sales-rep-1', 'ivr');
      expect(canAccess).toBe(true);

      // Different sales rep should not have access
      const cannotAccess = await service.canAccessData(dataItem, 'sales-rep-2', 'ivr');
      expect(cannotAccess).toBe(false);
    });

    test('should get accessible user IDs correctly', async () => {
      const systemAdminIds = await service.getAccessibleUserIds('system-admin-1');
      expect(systemAdminIds).toContain('system-admin-1');
      expect(systemAdminIds).toContain('chp-admin-1');
      expect(systemAdminIds).toContain('sales-rep-1');

      const salesRepIds = await service.getAccessibleUserIds('sales-rep-1');
      expect(salesRepIds).toEqual(['sales-rep-1']);
    });

    test('should validate hierarchy relationships', async () => {
      // Master distributor should be able to manage regional distributor
      const validHierarchy = await service.validateHierarchy('master-dist-1', 'regional-dist-1');
      expect(validHierarchy).toBe(true);

      // Sales rep should not be able to manage regional distributor
      const invalidHierarchy = await service.validateHierarchy('sales-rep-1', 'regional-dist-1');
      expect(invalidHierarchy).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should provide filtering summary', async () => {
      const summary = await service.getFilteringSummary('master-dist-1');

      expect(summary.hierarchy.role).toBe(HierarchyRole.MASTER_DISTRIBUTOR);
      expect(summary.scope).toBe(DataAccessScope.NETWORK_WIDE);
      expect(summary.permissions).toContain('view_network');
      expect(summary.accessibleUserIds).toContain('master-dist-1');
    });

    test('should clear caches', () => {
      service.clearCaches();
      // Cache should be empty after clearing
      expect(() => service.clearCaches()).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle unknown user ID gracefully', async () => {
      const hierarchy = await service.getUserHierarchy('unknown-user');

      expect(hierarchy.role).toBe(HierarchyRole.SALES_REPRESENTATIVE);
      expect(hierarchy.accessScope).toBe(DataAccessScope.PERSONAL_ONLY);
      expect(hierarchy.permissions).toContain('view_assigned');
    });

    test('should handle empty data arrays', async () => {
      const hierarchy = await service.getUserHierarchy('sales-rep-1');
      const context: FilteringContext = {
        user: { id: 'sales-rep-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const result = await service.filterIVRData([], context);

      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.accessibleCount).toBe(0);
    });

    test('should handle malformed data gracefully', async () => {
      const hierarchy = await service.getUserHierarchy('sales-rep-1');
      const context: FilteringContext = {
        user: { id: 'sales-rep-1' } as any,
        hierarchy,
        requestedDataType: 'ivr'
      };

      const malformedData = [
        {
          id: 'malformed-1',
          // Missing required fields
        } as any
      ];

      const result = await service.filterIVRData(malformedData, context);

      expect(result.data).toHaveLength(0); // Should filter out malformed data
      expect(result.totalCount).toBe(1);
      expect(result.accessibleCount).toBe(0);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache hierarchy data', async () => {
      const startTime = Date.now();
      await service.getUserHierarchy('sales-rep-1');
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await service.getUserHierarchy('sales-rep-1');
      const cachedCallTime = Date.now() - cachedStartTime;

      // Cached call should be faster (though this is a simple test)
      expect(cachedCallTime).toBeLessThanOrEqual(firstCallTime);
    });

    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.getUserHierarchy(`user-${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.userId).toBe(`user-${index}`);
      });
    });
  });
});