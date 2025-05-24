import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation';
import { Header } from '.';

export const DashboardLayout: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#2C3E50', // Dark blue background
      }}
    >
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Header />
        <Box
          component="main"
          sx={{
            flex: 1,
            py: 4,
            px: 4,
            bgcolor: 'background.default',
            borderTopLeftRadius: '24px',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              height: '100%',
            }}
          >
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}; 