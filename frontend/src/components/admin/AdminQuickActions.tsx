import React from 'react';
import { Box, Button, Typography, Divider } from '@mui/material';
import {
  UserPlus,
  Settings,
  Download,
  AlertTriangle,
  RefreshCw,
  Shield
} from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'warning';
}

export const AdminQuickActions: React.FC = () => {
  const handleAction = (action: string) => {
    // Implement action handlers
    console.log(`Executing action: ${action}`);
  };

  const quickActions: QuickAction[] = [
    {
      icon: <UserPlus className="w-5 h-5" />,
      label: 'Add New User',
      onClick: () => handleAction('add_user'),
      variant: 'primary'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'System Settings',
      onClick: () => handleAction('system_settings'),
      variant: 'secondary'
    },
    {
      icon: <Download className="w-5 h-5" />,
      label: 'Export Reports',
      onClick: () => handleAction('export_reports'),
      variant: 'secondary'
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'View Alerts',
      onClick: () => handleAction('view_alerts'),
      variant: 'warning'
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      label: 'Sync Data',
      onClick: () => handleAction('sync_data'),
      variant: 'secondary'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Security Audit',
      onClick: () => handleAction('security_audit'),
      variant: 'primary'
    }
  ];

  const getButtonStyles = (variant: QuickAction['variant']) => {
    const baseStyles = {
      width: '100%',
      justifyContent: 'flex-start',
      py: 1.5,
      px: 2,
      mb: 1,
      '&:last-child': { mb: 0 },
      textTransform: 'none',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          bgcolor: '#2E86AB',
          color: 'white',
          '&:hover': {
            bgcolor: '#247297'
          }
        };
      case 'warning':
        return {
          ...baseStyles,
          bgcolor: '#FFA726',
          color: 'white',
          '&:hover': {
            bgcolor: '#FB8C00'
          }
        };
      default:
        return {
          ...baseStyles,
          bgcolor: 'background.default',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        };
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Quick Actions
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          User Management
        </Typography>
        {quickActions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={getButtonStyles(action.variant)}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          System Tools
        </Typography>
        {quickActions.slice(2, 4).map((action, index) => (
          <Button
            key={index}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={getButtonStyles(action.variant)}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Maintenance
        </Typography>
        {quickActions.slice(4).map((action, index) => (
          <Button
            key={index}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={getButtonStyles(action.variant)}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}; 