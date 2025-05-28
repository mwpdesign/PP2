import React from 'react';
import { useNavigate } from 'react-router-dom';
import IVRSubmission from '../../../components/ivr/IVRSubmission';

const IVRSubmissionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Implement submission logic with proper API integration
      console.log('Submitting IVR request:', data);
      navigate('/ivr-management');
    } catch (error) {
      console.error('Error submitting IVR request:', error);
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      // TODO: Implement draft saving logic
      console.log('Saving IVR draft:', data);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Submit IVR Request</h1>
      <IVRSubmission
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
};

export default IVRSubmissionPage; 