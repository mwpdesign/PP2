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

    try {
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
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
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
        Sign in to your account
      </Typography>

      {(error || authError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || authError}
        </Alert>
      )}

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
    </Box>
  );
}; 