import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface HealthStatus {
  status: string;
  database: string;
  environment: string;
  version: string;
}

interface ConnectivityTestProps {
  onStatusChange?: (isConnected: boolean) => void;
}

const ConnectivityTest: React.FC<ConnectivityTestProps> = ({ onStatusChange }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get<HealthStatus>(
          'http://localhost:8000/health'
        );
        
        setHealth(response.data);
        onStatusChange?.(response.data.status === 'healthy');
      } catch (err) {
        setError('Failed to connect to backend API');
        onStatusChange?.(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [onStatusChange]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Checking API connectivity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 rounded-lg">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          Please ensure the backend server is running on port 8000
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Backend Connectivity Status</h3>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium mr-2">Status:</span>
          <span className={`px-2 py-1 rounded ${
            health?.status === 'healthy' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {health?.status || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Database:</span>
          <span className={`px-2 py-1 rounded ${
            health?.database === 'connected'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {health?.database || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Environment:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {health?.environment || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Version:</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
            {health?.version || 'Unknown'}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
};

export default ConnectivityTest; 