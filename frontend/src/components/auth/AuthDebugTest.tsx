import React, { useState, useEffect } from 'react';
import { testCORS, testConnectivity, loginUser, fetchUserProfile, decodeJwt } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: any;
  duration?: number;
}

export const AuthDebugTest: React.FC = () => {
  const { login, logout, isAuthenticated, user, token, isLoading, error } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState({
    email: process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local',
    password: process.env.REACT_APP_TEST_ADMIN_PASSWORD || 'test123'
  });

  const credentials = {
    admin: {
      email: process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local',
      password: process.env.REACT_APP_TEST_ADMIN_PASSWORD || 'test123'
    },
    doctor: {
      email: process.env.REACT_APP_TEST_DOCTOR_EMAIL || 'doctor@healthcare.local',
      password: process.env.REACT_APP_TEST_DOCTOR_PASSWORD || 'test123'
    },
    ivr: {
      email: process.env.REACT_APP_TEST_IVR_EMAIL || 'ivr@healthcare.local',
      password: process.env.REACT_APP_TEST_IVR_PASSWORD || 'test123'
    }
  };

  const updateTestResult = (name: string, status: 'pending' | 'success' | 'error', data?: any, error?: any, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, data, error, duration } : r);
      } else {
        return [...prev, { name, status, data, error, duration }];
      }
    });
  };

  const runConnectivityTest = async () => {
    console.log('[AuthDebugTest] Running connectivity test...');
    const startTime = Date.now();
    updateTestResult('Connectivity Test', 'pending');

    try {
      const result = await testConnectivity();
      const duration = Date.now() - startTime;
      updateTestResult('Connectivity Test', 'success', result, null, duration);
      console.log('[AuthDebugTest] Connectivity test passed:', result);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Connectivity Test', 'error', null, error, duration);
      console.error('[AuthDebugTest] Connectivity test failed:', error);
    }
  };

  const runCORSTest = async () => {
    console.log('[AuthDebugTest] Running CORS test...');
    const startTime = Date.now();
    updateTestResult('CORS Test', 'pending');

    try {
      const result = await testCORS();
      const duration = Date.now() - startTime;
      updateTestResult('CORS Test', 'success', result, null, duration);
      console.log('[AuthDebugTest] CORS test passed:', result);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('CORS Test', 'error', null, error, duration);
      console.error('[AuthDebugTest] CORS test failed:', error);
    }
  };

  const runDirectLoginTest = async () => {
    console.log('[AuthDebugTest] Running direct login test...');
    const startTime = Date.now();
    updateTestResult('Direct Login Test', 'pending');

    try {
      const result = await loginUser(selectedCredentials.email, selectedCredentials.password);
      const duration = Date.now() - startTime;
      updateTestResult('Direct Login Test', 'success', result, null, duration);
      console.log('[AuthDebugTest] Direct login test passed:', result);

      // Test token decoding
      if (result.access_token) {
        const decoded = decodeJwt(result.access_token);
        updateTestResult('JWT Decode Test', 'success', decoded);

        // Test profile fetch
        try {
          const profile = await fetchUserProfile(result.access_token);
          updateTestResult('Profile Fetch Test', 'success', profile);
        } catch (profileError) {
          updateTestResult('Profile Fetch Test', 'error', null, profileError);
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('Direct Login Test', 'error', null, error, duration);
      console.error('[AuthDebugTest] Direct login test failed:', error);
    }
  };

  const runAuthContextTest = async () => {
    console.log('[AuthDebugTest] Running AuthContext login test...');
    const startTime = Date.now();
    updateTestResult('AuthContext Login Test', 'pending');

    try {
      await login(selectedCredentials.email, selectedCredentials.password);
      const duration = Date.now() - startTime;
      updateTestResult('AuthContext Login Test', 'success', { message: 'Login successful via AuthContext' }, null, duration);
      console.log('[AuthDebugTest] AuthContext login test passed');
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult('AuthContext Login Test', 'error', null, error, duration);
      console.error('[AuthDebugTest] AuthContext login test failed:', error);
    }
  };

  const runAllTests = async () => {
    console.log('[AuthDebugTest] ===== RUNNING ALL AUTHENTICATION TESTS =====');
    setIsRunningTests(true);
    setTestResults([]);

    try {
      await runConnectivityTest();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests

      await runCORSTest();
      await new Promise(resolve => setTimeout(resolve, 500));

      await runDirectLoginTest();
      await new Promise(resolve => setTimeout(resolve, 500));

      await runAuthContextTest();
    } catch (error) {
      console.error('[AuthDebugTest] Test suite error:', error);
    } finally {
      setIsRunningTests(false);
      console.log('[AuthDebugTest] ===== ALL TESTS COMPLETED =====');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleLogout = () => {
    logout();
    updateTestResult('Logout Test', 'success', { message: 'Logged out successfully' });
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Flow Debugging</h2>

        {/* Current Auth State */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Current Authentication State</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span>
              <span className={`ml-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Loading:</span>
              <span className={`ml-2 ${isLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
                {isLoading ? '⏳ Yes' : '⚪ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User:</span>
              <span className="ml-2 text-blue-600">{user?.email || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Token:</span>
              <span className="ml-2 text-purple-600">{token ? 'Present' : 'None'}</span>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-red-800 font-medium">Error: </span>
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Test Credentials Selection */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Test Credentials</h3>
          <div className="flex flex-wrap gap-3 mb-3">
            {Object.entries(credentials).map(([type, creds]) => (
              <button
                key={type}
                onClick={() => setSelectedCredentials(creds)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCredentials.email === creds.email
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Selected: <span className="font-mono">{selectedCredentials.email}</span> /
            <span className="font-mono">{selectedCredentials.password}</span>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </button>
          <button
            onClick={runConnectivityTest}
            disabled={isRunningTests}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Test Connectivity
          </button>
          <button
            onClick={runCORSTest}
            disabled={isRunningTests}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            Test CORS
          </button>
          <button
            onClick={runDirectLoginTest}
            disabled={isRunningTests}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Test Direct Login
          </button>
          <button
            onClick={runAuthContextTest}
            disabled={isRunningTests}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Test AuthContext
          </button>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          )}
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No tests run yet. Click "Run All Tests" to begin.</div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-medium">{result.name}</span>
                      <span className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </span>
                      {result.duration && (
                        <span className="text-sm text-gray-500">({result.duration}ms)</span>
                      )}
                    </div>
                  </div>

                  {result.data && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">Success Data:</div>
                      <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">Error Details:</div>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};