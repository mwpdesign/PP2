import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Container,
  Breadcrumbs,
  Link,
  SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled components for medical-grade UI
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  overflow: 'visible',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #2C3E50 0%, #3498db 100%)',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
}));

const StyledFormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:not(:last-child)': {
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  },
}));

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  insuranceProvider: string;
  insuranceNumber: string;
}

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const insuranceProviders = [
  'Aetna',
  'Blue Cross Blue Shield',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'Medicaid',
  'UnitedHealthcare',
  'Other'
];

const SimplePatientForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    insuranceProvider: '',
    insuranceNumber: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to register patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          color="inherit"
          onClick={() => navigate('/dashboard')}
          sx={{ textDecoration: 'none', color: '#2C3E50' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">New Patient</Typography>
      </Breadcrumbs>

      <StyledCard>
        <CardContent sx={{ p: 0 }}>
          <StyledFormSection>
            <Typography variant="h5" component="h1" gutterBottom sx={{ color: '#2C3E50', fontWeight: 600 }}>
              Patient Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter the patient's information below
            </Typography>
          </StyledFormSection>

          {error && (
            <StyledFormSection>
              <Alert severity="error">{error}</Alert>
            </StyledFormSection>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <StyledFormSection>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                Personal Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleTextChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleTextChange}
                  />
                </Grid>
              </Grid>
            </StyledFormSection>

            {/* Address Information */}
            <StyledFormSection>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                Address Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="address"
                    value={formData.address}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={formData.state}
                      onChange={handleSelectChange}
                      label="State"
                    >
                      {states.map(state => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleTextChange}
                  />
                </Grid>
              </Grid>
            </StyledFormSection>

            {/* Insurance Information */}
            <StyledFormSection>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', fontWeight: 500 }}>
                Insurance Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Insurance Provider</InputLabel>
                    <Select
                      name="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleSelectChange}
                      label="Insurance Provider"
                    >
                      {insuranceProviders.map(provider => (
                        <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Insurance Number"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleTextChange}
                  />
                </Grid>
              </Grid>
            </StyledFormSection>

            {/* Form Actions */}
            <StyledFormSection sx={{ bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{
                    color: '#2C3E50',
                    borderColor: '#2C3E50',
                    '&:hover': {
                      borderColor: '#3498db',
                      backgroundColor: 'rgba(44, 62, 80, 0.04)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: '#2C3E50',
                    '&:hover': {
                      bgcolor: '#34495E',
                    },
                    '&:disabled': {
                      bgcolor: '#2C3E50',
                      opacity: 0.7,
                    },
                  }}
                >
                  {isSubmitting ? 'Registering...' : 'Register Patient'}
                </Button>
              </Box>
            </StyledFormSection>
          </form>
        </CardContent>
      </StyledCard>
    </Container>
  );
};

export default SimplePatientForm; 