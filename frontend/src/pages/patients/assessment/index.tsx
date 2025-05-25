import React from 'react';
import { Box } from '@mui/material';
import WoundAssessmentForm from '../../../components/patients/WoundAssessmentForm';

const WoundAssessmentPage: React.FC = () => {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // TODO: Implement form submission
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <Box sx={{ p: 3 }}>
      <WoundAssessmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Box>
  );
};

export default WoundAssessmentPage; 