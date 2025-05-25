import React from 'react';
import PatientIntakeForm from '../../../components/patients/PatientIntakeForm';
import PageHeader from '../../../components/shared/layout/PageHeader';

const PatientIntakePage: React.FC = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="New Patient Intake"
        subtitle="Enter new patient information and medical history"
      />
      <PatientIntakeForm />
    </div>
  );
};

export default PatientIntakePage; 