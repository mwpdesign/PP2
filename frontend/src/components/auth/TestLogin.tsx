import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const TestLogin: React.FC = () => {
  const { login } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Direct API test using fetch
  const testDirectFetch = async () => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'username=admin@healthcare.local&password=admin123'
      });
      const data = await response.json();
      setResult({ directFetch: data });
      setError(null);
    } catch (err) {
      console.error('Direct fetch error:', err);
      setError(`Direct fetch error: ${err}`);
    }
  };

  // Test using AuthContext
  const testAuthContext = async () => {
    try {
      await login('admin@healthcare.local', 'admin123');
      setResult({ authContext: 'Login successful - check localStorage' });
      setError(null);
    } catch (err) {
      console.error('Auth context error:', err);
      setError(`Auth context error: ${err}`);
    }
  };

  // Test Doctor credentials
  const testDoctorAuth = async () => {
    try {
      await login('doctor@healthcare.local', 'doctor123');
      setResult({ doctorAuth: 'Doctor login successful - check localStorage' });
      setError(null);
    } catch (err) {
      console.error('Doctor auth error:', err);
      setError(`Doctor auth error: ${err}`);
    }
  };

  // Test IVR credentials
  const testIvrAuth = async () => {
    try {
      await login('ivr@healthcare.local', 'ivr123');
      setResult({ ivrAuth: 'IVR login successful - check localStorage' });
      setError(null);
    } catch (err) {
      console.error('IVR auth error:', err);
      setError(`IVR auth error: ${err}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Authentication Test Page</h1>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Available Mock Credentials:</h3>
        <ul>
          <li><strong>Admin:</strong> admin@healthcare.local / admin123</li>
          <li><strong>Doctor:</strong> doctor@healthcare.local / doctor123</li>
          <li><strong>IVR:</strong> ivr@healthcare.local / ivr123</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Direct API Call (Admin)</h2>
        <button
          onClick={testDirectFetch}
          style={{ padding: '10px', marginRight: '10px', backgroundColor: '#2E86AB', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Direct Fetch (Admin)
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Auth Context</h2>
        <button
          onClick={testAuthContext}
          style={{ padding: '10px', marginRight: '10px', backgroundColor: '#2E86AB', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Admin Login
        </button>
        <button
          onClick={testDoctorAuth}
          style={{ padding: '10px', marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Doctor Login
        </button>
        <button
          onClick={testIvrAuth}
          style={{ padding: '10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test IVR Login
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #66bb6a',
          borderRadius: '4px'
        }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2>LocalStorage Contents:</h2>
        <pre>
          {JSON.stringify({
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user'),
            refresh_token: localStorage.getItem('refresh_token'),
            authToken: localStorage.getItem('authToken')
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};