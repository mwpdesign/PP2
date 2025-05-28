import React from 'react';
import type { IVRCommunication } from '../../types/order';
import { format } from 'date-fns';

interface IVRCommunicationThreadProps {
  ivrData: IVRCommunication;
}

const IVRCommunicationThread: React.FC<IVRCommunicationThreadProps> = ({ ivrData }) => {
  return (
    <div className="mb-8">
      {/* IVR Status Banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        ivrData.status === 'approved' ? 'bg-green-50 border border-green-200' :
        ivrData.status === 'needs_info' ? 'bg-yellow-50 border border-yellow-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">IVR #{ivrData.ivrId}</h2>
            <p className={`text-sm mt-1 ${
              ivrData.status === 'approved' ? 'text-green-700' :
              ivrData.status === 'needs_info' ? 'text-yellow-700' :
              'text-gray-700'
            }`}>
              Status: {ivrData.status.charAt(0).toUpperCase() + ivrData.status.slice(1)}
            </p>
          </div>
          {ivrData.approvalDate && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Approved on</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(ivrData.approvalDate), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Documents</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ivrData.documents.map((doc) => (
            <div
              key={doc.id}
              className="relative rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    doc.category === 'insurance_approval' ? 'bg-green-100' :
                    doc.category === 'medical_documentation' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(doc.timestamp), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#2E86AB] hover:text-[#247297]"
                >
                  View
                </a>
              </div>
              <span className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-medium ${
                doc.category === 'insurance_approval' ? 'bg-green-100 text-green-800' :
                doc.category === 'medical_documentation' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {doc.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Thread */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Communication History</h3>
        <div className="space-y-4">
          {ivrData.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-lg rounded-lg p-4 ${
                message.sender === 'doctor' 
                  ? 'bg-[#2E86AB] text-white ml-8'
                  : 'bg-gray-100 text-gray-900 mr-8'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.sender === 'doctor' ? 'Doctor' : 'IVR Specialist'}
                  </span>
                  <span className="text-xs opacity-75">
                    {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-xs ${
                          message.sender === 'doctor'
                            ? 'text-white hover:underline'
                            : 'text-[#2E86AB] hover:text-[#247297]'
                        }`}
                      >
                        📎 {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IVRCommunicationThread; 