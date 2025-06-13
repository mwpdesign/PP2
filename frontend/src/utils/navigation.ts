import {
  HomeIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  TruckIcon,
  BuildingOffice2Icon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

// Navigation item interface
export interface NavigationItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
  viewOnly?: boolean;
}

// Master Distributor Navigation Function
export const createMasterDistributorNavigation = (): NavigationItem[] => [
  { icon: HomeIcon, label: 'Dashboard', path: '/master-distributor' },
  { icon: DocumentTextIcon, label: 'IVR Management', path: '/master-distributor/ivr-management' },
  { icon: ArchiveBoxIcon, label: 'Order Processing', path: '/master-distributor/orders' },
  { icon: TruckIcon, label: 'Shipping & Logistics', path: '/master-distributor/shipping' },
  { icon: BuildingOffice2Icon, label: 'Distributors', path: '/master-distributor/distributors' },
  { icon: UsersIcon, label: 'Salespeople', path: '/master-distributor/salespeople' },
  { icon: CreditCardIcon, label: 'Invoicing', path: '/master-distributor/invoicing' },
  { icon: Cog6ToothIcon, label: 'Settings', path: '/master-distributor/settings' },
];

// Regional Distributor Navigation Function (same visibility as Master, scoped to their downline)
export const createRegionalDistributorNavigation = (): NavigationItem[] => [
  { icon: HomeIcon, label: 'Dashboard', path: '/distributor-regional/dashboard' },
  { icon: UsersIcon, label: 'Sales Team', path: '/distributor-regional/sales-team' },
  { icon: UserGroupIcon, label: 'Doctor Network', path: '/distributor-regional/doctor-network' },
  { icon: DocumentTextIcon, label: 'IVR Management', path: '/distributor-regional/ivr-management' },
  { icon: ArchiveBoxIcon, label: 'Order Management', path: '/distributor-regional/order-management' },
  { icon: TruckIcon, label: 'Shipping & Logistics', path: '/distributor-regional/shipping-logistics' },
  { icon: ChartBarIcon, label: 'Analytics', path: '/distributor-regional/analytics' },
  { icon: Cog6ToothIcon, label: 'Settings', path: '/distributor-regional/settings' },
];

// Navigation by role function
export const getNavigationByRole = (role: string): NavigationItem[] => {
  switch (role) {
    case 'master_distributor':
      return createMasterDistributorNavigation();
    case 'regional_distributor':
      return createRegionalDistributorNavigation();
    default:
      return [];
  }
};