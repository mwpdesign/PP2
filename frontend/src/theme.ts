import { createTheme } from '@mui/material/styles';

// Healthcare-specific color palette
const colors = {
  medical: {
    primary: '#375788',    // Michael's premium blue
    secondary: '#2C3E50',  // Sophisticated dark background
    success: '#4CAF50',    // Healing green
    warning: '#FFA726',    // Alert orange
    error: '#EF5350',      // Medical red
    info: '#64B5F6',       // Info blue
    background: '#F5F7FA', // Clean background
    surface: '#FFFFFF',    // Pure white
    border: '#E1E8ED',     // Soft border
  },
  text: {
    primary: '#2C3E50',    // Medical dark
    secondary: '#546E7A',  // Professional gray
    disabled: '#90A4AE',   // Muted text
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.medical.primary,
      light: '#4A6FA5',
      dark: '#2C4A76',
    },
    secondary: {
      main: colors.medical.secondary,
      light: '#3C526A',
      dark: '#1C2A36',
    },
    success: {
      main: colors.medical.success,
    },
    warning: {
      main: colors.medical.warning,
    },
    error: {
      main: colors.medical.error,
    },
    info: {
      main: colors.medical.info,
    },
    background: {
      default: colors.medical.background,
      paper: colors.medical.surface,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: colors.text.primary,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.text.primary,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: colors.medical.primary,
          '&:hover': {
            backgroundColor: '#2C4A76',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${colors.medical.border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.medical.secondary,
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.medical.surface,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: colors.medical.border,
            },
            '&:hover fieldset': {
              borderColor: colors.medical.primary,
            },
          },
        },
      },
    },
  },
}); 