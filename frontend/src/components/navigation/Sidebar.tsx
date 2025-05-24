import React from 'react';
import { Box, Drawer, useTheme } from '@mui/material';
import { RoleBasedNavigation } from './RoleBasedNavigation';
import { useAuth } from '../../hooks/useAuth';

const SIDEBAR_WIDTH = 280;

export const Sidebar: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#2C3E50', // Dark background
          color: 'white',
          borderRight: 'none',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
          }}
        >
          <Box
            component="img"
            src="/logo2.png"
            alt="Healthcare IVR Platform"
            sx={{
              height: 128, // h-32 equivalent
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1 }}>
          <RoleBasedNavigation userRole={user.role} />
        </Box>
      </Box>
    </Drawer>
  );
}; 