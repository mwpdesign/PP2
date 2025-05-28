import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error: authError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by AuthContext
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      transition: 'all 0.15s ease-in-out',
      '& fieldset': {
        borderColor: 'rgb(209 213 219)',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: 'rgb(156 163 175)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#375788',
        borderWidth: '1px',
        boxShadow: '0 0 0 4px rgb(55 87 136 / 0.1)',
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgb(107 114 128)',
      fontSize: '0.875rem',
      '&.Mui-focused': {
        color: '#375788'
      }
    },
    '& .MuiInputBase-input': {
      fontSize: '0.875rem',
      '&::placeholder': {
        color: 'rgb(156 163 175)',
        opacity: 1
      }
    }
  };

  return (
    <Box component={Paper} elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
        Sign in to your account
      </Typography>

      {/* Demo account information */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Available Demo Accounts:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>doctor@test.com / demo123 (Doctor role)</li>
          <li>admin@test.com / demo123 (Admin role)</li>
          <li>ivr@test.com / demo123 (IVR Company role)</li>
          <li>logistics@test.com / demo123 (Logistics role)</li>
          <li>sales@test.com / demo123 (Sales role)</li>
        </Box>
      </Alert>

      {(error || authError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
          placeholder="Enter your email"
          helperText="Use one of the demo accounts above"
          sx={{ 
            mb: 2,
            ...inputStyles
          }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="small"
          placeholder="Enter your password"
          helperText="Default password: demo123"
          sx={inputStyles}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  sx={{ 
                    color: 'rgb(107 114 128)',
                    '&:hover': {
                      backgroundColor: 'rgb(243 244 246)'
                    }
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                size="small"
                sx={{
                  color: 'rgb(156 163 175)',
                  padding: '2px',
                  '&.Mui-checked': {
                    color: '#375788'
                  },
                  '&:hover': {
                    backgroundColor: 'rgb(243 244 246)'
                  }
                }}
              />
            }
            label={<Typography variant="body2" sx={{ color: 'rgb(75 85 99)', fontSize: '0.875rem' }}>Remember this device</Typography>}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ 
            mt: 3,
            textTransform: 'none',
            backgroundColor: '#375788',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#2c466d',
              boxShadow: 'none'
            }
          }}
          disabled={isLoading}
          size="large"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Box>
  );
}; 