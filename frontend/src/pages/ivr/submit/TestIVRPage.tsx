import React from 'react';
import { useParams } from 'react-router-dom';

const TestIVRPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test IVR Page</h1>
      <p className="text-lg">Patient ID: {patientId}</p>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {JSON.stringify({ patientId, currentPath: window.location.pathname }, null, 2)}
      </pre>
    </div>
  );
};

export default TestIVRPage; 