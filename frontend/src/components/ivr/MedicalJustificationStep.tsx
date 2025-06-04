import React from 'react';
import { Editor, IAllProps } from '@tinymce/tinymce-react';

interface MedicalJustificationStepProps {
  medicalJustification: {
    clinicalNotes: string;
    diagnosisCodes: string[];
    treatmentPlan: string;
    expectedOutcomes: string;
  };
  onMedicalJustificationChange: (data: {
    clinicalNotes: string;
    diagnosisCodes: string[];
    treatmentPlan: string;
    expectedOutcomes: string;
  }) => void;
}

const MedicalJustificationStep: React.FC<MedicalJustificationStepProps> = ({
  medicalJustification,
  onMedicalJustificationChange,
}) => {
  const handleDiagnosisCodesChange = (value: string) => {
    const codes = value.split(',').map(code => code.trim()).filter(Boolean);
    onMedicalJustificationChange({
      ...medicalJustification,
      diagnosisCodes: codes,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Justification</h3>

        {/* Clinical Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Notes
          </label>
          <Editor
            apiKey={process.env.REACT_APP_TINYMCE_API_KEY || "no-api-key"}
            value={medicalJustification.clinicalNotes}
            onEditorChange={(content: string) => {
              onMedicalJustificationChange({
                ...medicalJustification,
                clinicalNotes: content,
              });
            }}
            init={{
              height: 300,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar:
                'undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help',
              content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px }'
            }}
          />
        </div>

        {/* Diagnosis Codes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis Codes (ICD-10)
          </label>
          <input
            type="text"
            value={medicalJustification.diagnosisCodes.join(', ')}
            onChange={(e) => handleDiagnosisCodesChange(e.target.value)}
            placeholder="Enter diagnosis codes separated by commas (e.g., L89.004, E11.621)"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter relevant ICD-10 codes separated by commas
          </p>
        </div>

        {/* Treatment Plan */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Plan
          </label>
          <textarea
            value={medicalJustification.treatmentPlan}
            onChange={(e) => {
              onMedicalJustificationChange({
                ...medicalJustification,
                treatmentPlan: e.target.value,
              });
            }}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
            placeholder="Describe the proposed treatment plan and timeline..."
          />
        </div>

        {/* Expected Outcomes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Outcomes
          </label>
          <textarea
            value={medicalJustification.expectedOutcomes}
            onChange={(e) => {
              onMedicalJustificationChange({
                ...medicalJustification,
                expectedOutcomes: e.target.value,
              });
            }}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
            placeholder="Describe the expected outcomes and success criteria..."
          />
        </div>
      </div>

      {/* Guidance Box */}
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Medical Justification Guidelines
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Include detailed wound assessment and measurements</li>
                <li>Document previous treatments and their outcomes</li>
                <li>Specify why the requested products are medically necessary</li>
                <li>Include relevant photos or imaging results in the documentation step</li>
                <li>Use specific ICD-10 codes that support medical necessity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalJustificationStep;