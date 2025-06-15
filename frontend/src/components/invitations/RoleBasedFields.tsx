import React from 'react';
import { InvitationType } from '../../types/invitation';

interface RoleBasedFieldsProps {
  invitationType: InvitationType;
  formData: any;
  fieldErrors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
}

const RoleBasedFields: React.FC<RoleBasedFieldsProps> = ({
  invitationType,
  formData,
  fieldErrors,
  onFieldChange
}) => {
  // Don't render anything if no invitation type
  if (!invitationType) {
    return null;
  }

  // Doctor-specific fields
  if (invitationType === 'doctor') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Professional Information</h3>

        <div>
          <label htmlFor="npi" className="block text-sm font-medium text-slate-700">
            NPI Number *
          </label>
          <input
            type="text"
            id="npi"
            value={formData.npi || ''}
            onChange={(e) => onFieldChange('npi', e.target.value)}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
              fieldErrors.npi ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter NPI number"
          />
          {fieldErrors.npi && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.npi}</p>
          )}
        </div>

        <div>
          <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-700">
            Medical License Number *
          </label>
          <input
            type="text"
            id="licenseNumber"
            value={formData.licenseNumber || ''}
            onChange={(e) => onFieldChange('licenseNumber', e.target.value)}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
              fieldErrors.licenseNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter license number"
          />
          {fieldErrors.licenseNumber && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.licenseNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="practiceName" className="block text-sm font-medium text-slate-700">
            Practice Name *
          </label>
          <input
            type="text"
            id="practiceName"
            value={formData.practiceName || ''}
            onChange={(e) => onFieldChange('practiceName', e.target.value)}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
              fieldErrors.practiceName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter practice name"
          />
          {fieldErrors.practiceName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.practiceName}</p>
          )}
        </div>
      </div>
    );
  }

  // IVR Company and Shipping Logistics fields
  if (['ivr_company', 'shipping_logistics'].includes(invitationType)) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Company Information</h3>

        <div>
          <label htmlFor="companyAffiliation" className="block text-sm font-medium text-slate-700">
            Company Affiliation *
          </label>
          <input
            type="text"
            id="companyAffiliation"
            value={formData.companyAffiliation || ''}
            onChange={(e) => onFieldChange('companyAffiliation', e.target.value)}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
              fieldErrors.companyAffiliation ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter company name"
          />
          {fieldErrors.companyAffiliation && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.companyAffiliation}</p>
          )}
        </div>
      </div>
    );
  }

  // Sales and Distributor fields
  if (['sales', 'distributor', 'master_distributor'].includes(invitationType)) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Territory Information</h3>

        <div>
          <label htmlFor="territory" className="block text-sm font-medium text-slate-700">
            Territory/Region *
          </label>
          <input
            type="text"
            id="territory"
            value={formData.territory || ''}
            onChange={(e) => onFieldChange('territory', e.target.value)}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
              fieldErrors.territory ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter territory or region"
          />
          {fieldErrors.territory && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.territory}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Specify the geographic area or region you will be responsible for
          </p>
        </div>
      </div>
    );
  }

  // Office Admin and Medical Staff don't need additional fields
  if (['office_admin', 'medical_staff'].includes(invitationType)) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm">
          <p className="text-blue-800 font-medium">
            {invitationType === 'office_admin' ? 'Office Administrator' : 'Medical Staff'} Role
          </p>
          <p className="text-blue-600 mt-1">
            No additional information required. You'll be associated with your practice upon activation.
          </p>
        </div>
      </div>
    );
  }

  // Admin roles don't need additional fields
  if (['admin', 'chp_admin'].includes(invitationType)) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="text-sm">
          <p className="text-purple-800 font-medium">
            {invitationType === 'admin' ? 'System Administrator' : 'CHP Administrator'} Role
          </p>
          <p className="text-purple-600 mt-1">
            Administrative privileges will be configured upon account activation.
          </p>
        </div>
      </div>
    );
  }

  // Default case - no additional fields
  return null;
};

export default RoleBasedFields;