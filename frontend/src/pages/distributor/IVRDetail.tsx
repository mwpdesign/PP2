import React from 'react';
import { useParams } from 'react-router-dom';
import { DoctorIVRDetailPage } from '../doctor/ivr/[id]';

const IVRDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <DoctorIVRDetailPage id={id} readOnly={true} userRole="master_distributor" />;
};

export default IVRDetail;