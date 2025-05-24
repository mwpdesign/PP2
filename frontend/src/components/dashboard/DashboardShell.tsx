import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  styled,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

interface StyledListItemProps {
  $active?: boolean;
}

// Custom styled components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
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
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  '& img': {
    height: '50px',
    width: 'auto',
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
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
    minWidth: 40,
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
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  marginLeft: '280px',
  padding: 0,
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  maxWidth: '1280px !important',
  margin: '0 auto',
  padding: theme.spacing(3),
  [theme.breakpoints.up('xl')]: {
    maxWidth: '1400px !important',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#375788',
  color: 'white',
  padding: theme.spacing(1, 3),
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#2C4A76',
  },
}));

const DashboardShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { text: 'Medical Records', icon: <HospitalIcon />, path: '/records' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleNewPatient = React.useCallback(() => {
    navigate('/patients/new');
  }, [navigate]);

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#f8fafc' }}>
      <StyledDrawer variant="permanent">
        <LogoContainer>
          <img src="/logo2.png" alt="Healthcare IVR" />
        </LogoContainer>
        
        <List sx={{ mt: 3, px: 2 }}>
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
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <List sx={{ px: 2, pb: 2 }}>
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
        </List>
      </StyledDrawer>

      <MainContent>
        <ContentContainer>
          {/* Header */}
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <Typography variant="h4" component="h1" sx={{ color: '#2C3E50', fontWeight: 600 }}>
              Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            mb: 6 
          }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Total Patients
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#2C3E50' }}>1,234</Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Today's Appointments
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#2C3E50' }}>28</Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Pending Records
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#2C3E50' }}>15</Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Active Cases
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#2C3E50' }}>156</Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ 
            maxWidth: '1000px', 
            margin: '0 auto',
            mb: 6,
            textAlign: 'center'
          }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <StyledButton
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleNewPatient}
                >
                  New Patient
                </StyledButton>
              </Grid>
            </Grid>
          </Box>

          {/* Recent Activity */}
          <Box sx={{ 
            maxWidth: '1200px', 
            margin: '0 auto' 
          }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={8}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Recent Patients
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No recent patients to display.
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                      Upcoming Appointments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming appointments.
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>
        </ContentContainer>
      </MainContent>
    </Box>
  );
};

export default DashboardShell; 