import React from 'react';
import { useRouter } from 'next/router';
import IVRDetailsView from '../../../components/ivr/IVRDetailsView';

const IVRDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Invalid IVR ID</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <IVRDetailsView ivrId={id} />
    </div>
  );
};

export default IVRDetailsPage; 