import React from 'react';
import type { IVRCommunication } from '../../types/order';
import { format } from 'date-fns';

interface ApprovedIVRListProps {
  approvedIVRs: IVRCommunication[];
  onSelect: (ivr: IVRCommunication) => void;
}

const ApprovedIVRList: React.FC<ApprovedIVRListProps> = ({ approvedIVRs, onSelect }) => {
  if (approvedIVRs.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No approved IVRs available for ordering.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IVR ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Approval Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Approved By
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documents
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {approvedIVRs.map((ivr) => (
            <tr key={ivr.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {ivr.ivrId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {ivr.patientId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {ivr.approvalDate && format(new Date(ivr.approvalDate), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {ivr.approvedBy}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  {ivr.documents.map((doc) => (
                    <span
                      key={doc.id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${doc.category === 'insurance_approval' ? 'bg-green-100 text-green-800' :
                        doc.category === 'medical_documentation' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {doc.category === 'insurance_approval' ? 'Insurance' :
                       doc.category === 'medical_documentation' ? 'Medical' :
                       'Other'}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => onSelect(ivr)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Place Order
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApprovedIVRList; 