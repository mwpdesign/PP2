import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole, NavigationItem } from '../../types/auth';

interface RoleBasedNavigationProps {
  userRole: UserRole;
}

const navigationConfig: Record<UserRole, NavigationItem[]> = {
  'admin': [
    {
      id: 'users',
      title: 'User Management',
      path: '/users',
      icon: 'people',
      roles: ['admin'],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      path: '/analytics',
      icon: 'assessment',
      roles: ['admin'],
    },
    {
      id: 'settings',
      title: 'System Settings',
      path: '/settings',
      icon: 'settings',
      roles: ['admin'],
    },
  ],
  'doctor': [
    {
      id: 'patients',
      title: 'Patients',
      path: '/patients',
      icon: 'person',
      roles: ['doctor'],
      children: [
        {
          id: 'patient-list',
          title: 'Patient List',
          path: '/patients',
          icon: 'list',
          roles: ['doctor'],
        },
        {
          id: 'new-patient',
          title: 'New Patient',
          path: '/patients/new',
          icon: 'add',
          roles: ['doctor'],
        },
        {
          id: 'wound-assessment',
          title: 'Wound Assessment',
          path: '/patients/assessment',
          icon: 'assessment',
          roles: ['doctor'],
        },
      ],
    },
    {
      id: 'ivr-submissions',
      title: 'IVR Submissions',
      path: '/ivr-submissions',
      icon: 'assignment',
      roles: ['doctor'],
    },
  ],
  'ivr_company': [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/ivr-company/dashboard',
      icon: 'dashboard',
      roles: ['ivr_company'],
    },
    {
      id: 'review-queue',
      title: 'Review Queue',
      path: '/ivr-company/queue',
      icon: 'queue',
      roles: ['ivr_company'],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      path: '/ivr-company/in-progress',
      icon: 'schedule',
      roles: ['ivr_company'],
    },
    {
      id: 'completed',
      title: 'Completed Today',
      path: '/ivr-company/completed',
      icon: 'check_circle',
      roles: ['ivr_company'],
    },
    {
      id: 'communications',
      title: 'Communications',
      path: '/ivr-company/communications',
      icon: 'message',
      roles: ['ivr_company'],
    },
    {
      id: 'documents',
      title: 'Documents',
      path: '/ivr-company/documents',
      icon: 'description',
      roles: ['ivr_company'],
    },
    {
      id: 'reports',
      title: 'Reports',
      path: '/ivr-company/reports',
      icon: 'assessment',
      roles: ['ivr_company'],
    },
  ],
  'logistics': [
    {
      id: 'logistics-orders',
      title: 'Orders',
      path: '/logistics/orders',
      icon: 'inventory',
      roles: ['logistics'],
    },
    {
      id: 'shipping',
      title: 'Shipping',
      path: '/shipping',
      icon: 'local_shipping',
      roles: ['logistics'],
    },
  ],
};

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ userRole }) => {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleItemClick = (itemId: string) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (!item.roles.includes(userRole)) return null;

    const isSelected = location.pathname === item.path;
    const isOpen = openItems.includes(item.id);
    const paddingLeft = `${(depth * 1) + 1}rem`;

    return (
      <React.Fragment key={item.id}>
        {item.children ? (
          <button
            onClick={() => handleItemClick(item.id)}
            className={`w-full text-left px-4 py-2 mb-1 flex items-center justify-between rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#375788] text-white'
                : 'text-gray-300 hover:bg-[#375788] hover:bg-opacity-20'
            }`}
            style={{ paddingLeft }}
          >
            <span className="flex items-center">
              <span className="text-sm font-medium">{item.title}</span>
            </span>
            <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        ) : (
          <Link
            to={item.path}
            className={`block px-4 py-2 mb-1 rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#375788] text-white'
                : 'text-gray-300 hover:bg-[#375788] hover:bg-opacity-20'
            }`}
            style={{ paddingLeft }}
          >
            <span className="text-sm font-medium">{item.title}</span>
          </Link>
        )}

        {item.children && isOpen && (
          <div className="ml-4">
            {item.children.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <nav className="px-2 py-4">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Main Navigation
      </div>
      <div className="space-y-1">
        {navigationConfig[userRole]?.map(item => renderNavigationItem(item))}
      </div>
    </nav>
  );
};

export default RoleBasedNavigation;