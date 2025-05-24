import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  LocalHospital as LocalHospitalIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Message as MessageIcon,
  Queue as QueueIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
} from '@mui/icons-material';
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
      id: 'review-queue',
      title: 'Review Queue',
      path: '/review-queue',
      icon: 'queue',
      roles: ['ivr_company'],
    },
    {
      id: 'communications',
      title: 'Communications',
      path: '/communications',
      icon: 'message',
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

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'dashboard':
      return <DashboardIcon />;
    case 'people':
      return <PeopleIcon />;
    case 'assessment':
      return <AssessmentIcon />;
    case 'settings':
      return <SettingsIcon />;
    case 'person':
      return <PersonIcon />;
    case 'local_hospital':
      return <LocalHospitalIcon />;
    case 'assignment':
      return <AssignmentIcon />;
    case 'local_shipping':
      return <LocalShippingIcon />;
    case 'inventory':
      return <InventoryIcon />;
    case 'message':
      return <MessageIcon />;
    case 'queue':
      return <QueueIcon />;
    default:
      return <DashboardIcon />;
  }
};

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      setOpenItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      navigate(item.path);
    }
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (!item.roles.includes(userRole)) return null;

    const isSelected = location.pathname === item.path;
    const isOpen = openItems.includes(item.id);

    return (
      <React.Fragment key={item.id}>
        <ListItemButton
          onClick={() => handleItemClick(item)}
          selected={isSelected}
          sx={{
            pl: depth * 2 + 2,
            borderRadius: 1,
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: '#375788',
              '&:hover': {
                bgcolor: '#375788',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(55, 87, 136, 0.2)', // #375788 with 20% opacity
            },
            '& .MuiListItemIcon-root': {
              color: 'inherit',
              minWidth: 40,
            },
            '&.Mui-selected .MuiListItemIcon-root': {
              color: '#ffffff',
            },
            '&.Mui-selected .MuiListItemText-primary': {
              color: '#ffffff',
              fontWeight: 600,
            },
            '& .MuiListItemText-primary': {
              color: '#ffffff',
              fontWeight: 400,
            },
          }}
        >
          <ListItemIcon>{getIcon(item.icon)}</ListItemIcon>
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              variant: 'body2',
            }}
          />
          {item.children && (isOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        {item.children && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          px: 3,
          py: 1,
          display: 'block',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        Main Navigation
      </Typography>
      <List component="nav" sx={{ px: 2 }}>
        {/* Dashboard is available for all roles */}
        <ListItemButton
          selected={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
          sx={{
            borderRadius: 1,
            mb: 1,
            '&.Mui-selected': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.12)',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.04)',
            },
            '& .MuiListItemIcon-root': {
              color: 'inherit',
              minWidth: 40,
            },
            '& .MuiListItemText-primary': {
              color: 'inherit',
              fontWeight: location.pathname === '/dashboard' ? 600 : 400,
            },
          }}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              variant: 'body2',
            }}
          />
        </ListItemButton>

        {navigationConfig[userRole].map(item => renderNavigationItem(item))}
      </List>
    </Box>
  );
}; 