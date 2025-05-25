import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  styled,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Assessment as AnalyticsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

interface DashboardShellProps {
  children: React.ReactNode;
}

const StyledDrawer = styled(Drawer)({
  width: 280,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
    backgroundColor: '#2C3E50',
    color: 'white',
    borderRight: 'none',
    boxShadow: '4px 0 8px rgba(0, 0, 0, 0.1)',
  },
});

const LogoContainer = styled(Box)({
  padding: '64px 32px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  '& img': {
    height: '40px',
    width: 'auto',
  },
});

const StyledListItemButton = styled(ListItemButton)({
  borderRadius: '8px',
  marginBottom: '8px',
  padding: '12px 16px',
  transition: 'all 0.2s ease-in-out',
  '&.Mui-selected': {
    backgroundColor: '#375788',
    '&:hover': {
      backgroundColor: '#375788',
    },
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 56,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  '&.Mui-selected .MuiListItemIcon-root': {
    color: '#ffffff',
  },
  '&.Mui-selected .MuiListItemText-root .MuiTypography-root': {
    fontWeight: 600,
    color: '#ffffff',
  },
  '& .MuiListItemText-root .MuiTypography-root': {
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

const MainContent = styled(Box)({
  flexGrow: 1,
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  marginLeft: '280px',
  padding: 0,
});

const ContentContainer = styled(Box)({
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '32px',
  '@media (min-width: 1920px)': {
    maxWidth: '1400px',
  },
});

const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Patient Intake', icon: <PersonIcon />, path: '/patients' },
    { text: 'IVR Management', icon: <PhoneIcon />, path: '/ivr' },
    { text: 'Order Management', icon: <CartIcon />, path: '/orders' },
    { text: 'Shipping & Logistics', icon: <ShippingIcon />, path: '/shipping' },
    { text: 'Analytics & Reports', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledDrawer variant="permanent">
        <LogoContainer>
          <img src="/logo2.png" alt="Healthcare IVR" />
        </LogoContainer>
        
        <Box sx={{ mt: 4, px: 5 }}>
          {menuItems.map((item) => (
            <StyledListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </StyledListItemButton>
          ))}
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ px: 5, pb: 4 }}>
          <Divider sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            my: 2 
          }} />
          <StyledListItemButton>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </StyledListItemButton>
        </Box>
      </StyledDrawer>

      <MainContent>
        <ContentContainer>
          {children}
        </ContentContainer>
      </MainContent>
    </Box>
  );
};

export default DashboardShell; 