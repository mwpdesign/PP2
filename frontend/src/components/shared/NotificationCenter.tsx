import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { UserRole, Notification } from '../../types/auth';
import { HIPAAIndicator } from '../ui/HIPAAIndicator';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

// Mock notifications - replace with actual data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Patient Registration',
    message: 'A new patient has been registered and requires review.',
    type: 'info',
    isRead: false,
    createdAt: new Date().toISOString(),
    roles: ['doctor', 'admin'],
    containsPHI: true,
  },
  {
    id: '2',
    title: 'IVR Submission Approved',
    message: 'Your IVR submission has been approved and is ready for processing.',
    type: 'success',
    isRead: false,
    createdAt: new Date().toISOString(),
    roles: ['doctor'],
    containsPHI: false,
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2 AM EST.',
    type: 'warning',
    isRead: true,
    createdAt: new Date().toISOString(),
    roles: ['admin', 'doctor', 'ivr_company', 'logistics'],
    containsPHI: false,
  },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
  userRole,
}) => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState(mockNotifications);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <CircleIcon />;
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.roles.includes(userRole)
  );

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" component="h2">
            Notifications
            {unreadCount > 0 && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                }}
              >
                {unreadCount} New
              </Typography>
            )}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <HIPAAIndicator
            type="section"
            message="Some notifications may contain Protected Health Information (PHI)"
          />
        </Box>

        {/* Notifications List */}
        <List sx={{ flex: 1, overflow: 'auto', px: 2 }}>
          {filteredNotifications.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography>No notifications</Typography>
            </Box>
          ) : (
            filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.isRead
                      ? 'transparent'
                      : 'rgba(46, 134, 171, 0.04)',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            color: 'text.primary',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.containsPHI && (
                          <HIPAAIndicator type="field" encrypted={false} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  {!notification.isRead && (
                    <Button
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                      sx={{ ml: 2 }}
                    >
                      Mark as read
                    </Button>
                  )}
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Box>
    </Drawer>
  );
}; 