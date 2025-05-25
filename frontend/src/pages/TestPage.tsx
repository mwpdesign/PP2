import React, { useEffect } from 'react';

const TestPage: React.FC = () => {
  useEffect(() => {
    console.log('TestPage component mounted');
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800">Test Page Works!</h1>
      <p className="mt-2 text-gray-600">This is a simple test page to verify routing.</p>
    </div>
  );
};

export default TestPage; 