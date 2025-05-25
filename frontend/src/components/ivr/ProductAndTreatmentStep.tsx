import React from 'react';
import { TreatmentInfo, QCodeOptions, FrequencyOptions } from '../../types/ivr';

interface ProductAndTreatmentStepProps {
  treatmentInfo: TreatmentInfo;
  onTreatmentInfoChange: (info: TreatmentInfo) => void;
}

const ProductAndTreatmentStep: React.FC<ProductAndTreatmentStepProps> = ({
  treatmentInfo,
  onTreatmentInfoChange
}) => {
  const handleInputChange = (field: keyof TreatmentInfo, value: any) => {
    onTreatmentInfoChange({
      ...treatmentInfo,
      [field]: value
    });
  };

  const handleDiagnosisCodeChange = (index: number, field: 'code' | 'description', value: string) => {
    const updatedCodes = [...treatmentInfo.diagnosisCodes];
    updatedCodes[index] = {
      ...updatedCodes[index],
      [field]: value
    };
    handleInputChange('diagnosisCodes', updatedCodes);
  };

  const addDiagnosisCode = () => {
    handleInputChange('diagnosisCodes', [
      ...treatmentInfo.diagnosisCodes,
      { code: '', description: '', isPrimary: false }
    ]);
  };

  return (
    <div className="space-y-8 bg-white rounded-lg border border-gray-200 p-6">
      {/* Skin Substitute Acknowledgment */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="skinSubstituteAcknowledged"
              type="checkbox"
              checked={treatmentInfo.skinSubstituteAcknowledged}
              onChange={(e) => handleInputChange('skinSubstituteAcknowledged', e.target.checked)}
              className="h-4 w-4 text-[#2C3E50] border-gray-300 rounded focus:ring-[#2C3E50]"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="skinSubstituteAcknowledged" className="text-sm font-medium text-gray-700">
              15271-15278 for skin substitute application
            </label>
            <p className="text-sm text-gray-500">
              I acknowledge that these codes are appropriate for the planned treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Treatment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="qCode" className="block text-sm font-medium text-gray-700">
            Q Code Selection *
          </label>
          <select
            id="qCode"
            value={treatmentInfo.qCode}
            onChange={(e) => handleInputChange('qCode', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          >
            <option value="">Select Q Code</option>
            {QCodeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Treatment Est. Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={treatmentInfo.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="numberOfApplications" className="block text-sm font-medium text-gray-700">
            Number of Applications *
          </label>
          <input
            type="number"
            id="numberOfApplications"
            min="1"
            value={treatmentInfo.numberOfApplications}
            onChange={(e) => handleInputChange('numberOfApplications', parseInt(e.target.value))}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
            Frequency *
          </label>
          <select
            id="frequency"
            value={treatmentInfo.frequency}
            onChange={(e) => handleInputChange('frequency', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          >
            <option value="">Select Frequency</option>
            {FrequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="totalSurfaceArea" className="block text-sm font-medium text-gray-700">
            Total Surface Area (cm²) *
          </label>
          <input
            type="number"
            id="totalSurfaceArea"
            min="0"
            step="0.1"
            value={treatmentInfo.totalSurfaceArea}
            onChange={(e) => handleInputChange('totalSurfaceArea', parseFloat(e.target.value))}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          />
        </div>
      </div>

      {/* Diagnosis Codes */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnosis Codes</h3>
        <div className="space-y-4">
          {treatmentInfo.diagnosisCodes.map((diagnosis, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {index === 0 ? 'Primary Diagnosis Code *' : `Additional Diagnosis Code ${index}`}
                </label>
                <input
                  type="text"
                  value={diagnosis.code}
                  onChange={(e) => handleDiagnosisCodeChange(index, 'code', e.target.value)}
                  required={index === 0}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                  placeholder="Enter ICD-10 code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={diagnosis.description}
                  onChange={(e) => handleDiagnosisCodeChange(index, 'description', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                  placeholder="Enter diagnosis description"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDiagnosisCode}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50]"
          >
            + Add More Diagnosis Codes
          </button>
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="border-t border-gray-200 pt-6">
        <label htmlFor="clinicalNotes" className="block text-sm font-medium text-gray-700">
          Clinical Notes
        </label>
        <textarea
          id="clinicalNotes"
          rows={4}
          value={treatmentInfo.clinicalNotes}
          onChange={(e) => handleInputChange('clinicalNotes', e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          placeholder="Enter any additional clinical notes or observations"
        />
      </div>
    </div>
  );
};

export default ProductAndTreatmentStep; 