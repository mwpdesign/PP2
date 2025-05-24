import React, { useState, FormEvent } from 'react';

interface PatientData {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  insurance_provider: string;
  insurance_id: string;
}

function App() {
  const [formData, setFormData] = useState<PatientData>({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    insurance_provider: '',
    insurance_id: '',
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Convert date string to ISO format for backend
      const formattedData = {
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).toISOString(),
      };

      const response = await fetch('http://localhost:8000/api/v1/patients/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register patient');
      }

      setStatus({
        type: 'success',
        message: 'Patient registered successfully!',
      });
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        date_of_birth: '',
        insurance_provider: '',
        insurance_id: '',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to register patient. Please try again.',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formStyles = {
    container: {
      maxWidth: '600px',
      margin: '40px auto',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    title: {
      textAlign: 'center' as const,
      color: '#2c3e50',
      marginBottom: '30px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '5px',
    },
    label: {
      fontSize: '14px',
      color: '#34495e',
      fontWeight: '500',
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
    },
    button: {
      padding: '12px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '10px',
    },
    message: {
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '20px',
      textAlign: 'center' as const,
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
  };

  return (
    <div style={formStyles.container}>
      <h1 style={formStyles.title}>Patient Registration</h1>

      {status.type && (
        <div
          style={{
            ...formStyles.message,
            ...(status.type === 'success'
              ? formStyles.successMessage
              : formStyles.errorMessage),
          }}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyles.form}>
        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>Insurance Provider</label>
          <input
            type="text"
            name="insurance_provider"
            value={formData.insurance_provider}
            onChange={handleChange}
            style={formStyles.input}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label style={formStyles.label}>Insurance ID</label>
          <input
            type="text"
            name="insurance_id"
            value={formData.insurance_id}
            onChange={handleChange}
            style={formStyles.input}
          />
        </div>

        <button type="submit" style={formStyles.button}>
          Register Patient
        </button>
      </form>
    </div>
  );
}

export default App;
