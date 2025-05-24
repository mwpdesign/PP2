import React from 'react';
import {
  Box,
  Card,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { LoginForm } from './LoginForm';
import { TrustIndicators } from './TrustIndicators';

export const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(45deg, rgba(46, 134, 171, 0.05) 0%, rgba(168, 218, 220, 0.05) 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Left side - Branding and Trust Indicators */}
          <Box
            sx={{
              flex: { xs: '1', md: '0 0 45%' },
              textAlign: { xs: 'center', md: 'left' },
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Box
              component="img"
              src="/logo2.png"
              alt="Healthcare IVR Platform"
              sx={{
                width: 180,
                height: 'auto',
                mb: 4,
              }}
            />
            <Typography variant="h3" component="h1" gutterBottom color="primary">
              Healthcare IVR Platform
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Secure, HIPAA-compliant healthcare communication platform
            </Typography>
            <TrustIndicators />
          </Box>

          {/* Right side - Login Form */}
          <Card
            sx={{
              flex: { xs: '1', md: '0 0 45%' },
              p: 4,
              maxWidth: { xs: '100%', sm: 480 },
              position: 'relative',
              overflow: 'visible',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderTopLeftRadius: theme.shape.borderRadius,
                borderTopRightRadius: theme.shape.borderRadius,
              },
            }}
          >
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src="/logo2.png"
                alt="Healthcare IVR Platform"
                sx={{
                  width: 120,
                  height: 'auto',
                  mb: 2,
                }}
              />
              <Typography variant="h5" component="h1" gutterBottom color="primary">
                Healthcare IVR Platform
              </Typography>
            </Box>
            <LoginForm />
          </Card>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Healthcare IVR Platform. All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          HIPAA Compliant • SOC 2 Type II Certified • 256-bit Encryption
        </Typography>
      </Box>
    </Box>
  );
}; 