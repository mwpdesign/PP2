import React from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  NotificationsOutlined as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        borderBottom: 'none',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'flex-end',
          gap: 2,
          px: 4,
          py: 2,
        }}
      >
        <IconButton
          size="large"
          sx={{
            color: '#375788',
            '&:hover': {
              bgcolor: 'rgba(55, 87, 136, 0.08)',
            },
          }}
        >
          <NotificationsIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: '#375788',
          }}
        >
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.role}
            </Typography>
          </Box>
          <IconButton
            size="large"
            sx={{
              color: '#375788',
              '&:hover': {
                bgcolor: 'rgba(55, 87, 136, 0.08)',
              },
            }}
          >
            <AccountIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 