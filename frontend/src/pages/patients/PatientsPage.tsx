import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewPatientForm } from '../../components/patients/NewPatientForm';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSave = async (patientData: any) => {
    try {
      // TODO: Implement save logic with proper API integration
      console.log('Saving patient data:', patientData);
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Patient Management</h1>
      <NewPatientForm
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
};

export default PatientsPage; 