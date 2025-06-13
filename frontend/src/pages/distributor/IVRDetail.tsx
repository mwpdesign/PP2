import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DoctorIVRDetailPage from '../doctor/ivr/[id]';

const IVRDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();

  // Determine user role based on current path and user data
  const getUserRole = () => {
    if (location.pathname.includes('/distributor-regional/')) {
      return 'distributor'; // Regional Distributor
    }
    if (location.pathname.includes('/distributor/')) {
      return 'master_distributor'; // Master Distributor
    }
    return user?.role || 'distributor';
  };

  const userRole = getUserRole();

  console.log('🔍 DistributorIVRDetail Component Loaded');
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Location pathname:', location.pathname);
  console.log('🆔 IVR ID from params:', id);
  console.log('👤 Detected user role:', userRole);
  console.log('🔐 Auth token present:', !!localStorage.getItem('authToken'));

  return (
    <div>
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>DEBUG: Distributor IVR Detail Component Loaded Successfully!</strong>
        <br />IVR ID: {id}
        <br />URL: {window.location.href}
        <br />User Role: {userRole}
        <br />Context: {location.pathname.includes('/distributor-regional/') ? 'Regional Distributor' : 'Master Distributor'}
      </div>
      <DoctorIVRDetailPage id={id} readOnly={true} userRole={userRole} />
    </div>
  );
};

export default IVRDetail;