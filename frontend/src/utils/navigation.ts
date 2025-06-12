import {
  HomeIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  TruckIcon,
  BuildingOffice2Icon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon
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

// Navigation by role function
export const getNavigationByRole = (role: string): NavigationItem[] => {
  switch (role) {
    case 'master_distributor':
      return createMasterDistributorNavigation();
    default:
      return [];
  }
};