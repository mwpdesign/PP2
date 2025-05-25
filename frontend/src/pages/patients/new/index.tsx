import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewPatientForm } from '../../../components/patients/NewPatientForm';

const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/patients');
  };

  const handleSave = (patientData: any) => {
    // TODO: Implement save logic
    console.log('Saving patient data:', patientData);
    navigate('/patients');
  };

  return (
    <NewPatientForm
      onClose={handleClose}
      onSave={handleSave}
    />
  );
};

export default NewPatientPage; 