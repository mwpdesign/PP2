import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { ClockIcon, ChatBubbleLeftIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DocumentsView from './DocumentsView';
import AdditionalDocumentsSection from './AdditionalDocumentsSection';

interface IVRDetailsViewProps {
  ivrId: string;
}

interface IVRDetails {
  id: string;
  status: string;
  patientName: string;
  providerName: string;
  submittedAt: string;
  lastUpdated: string;
  documents: {
    original: Document[];
    additional: Document[];
  };
  timeline: TimelineEvent[];
  communication: CommunicationThread[];
  reviewNotes?: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  actor: string;
}

interface CommunicationThread {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  attachments?: Document[];
}

interface Document {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  type: string;
  url: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

const IVRDetailsView: React.FC<IVRDetailsViewProps> = ({ ivrId }) => {
  console.log('🔍 DEBUG: IVRDetailsView rendering with ID:', ivrId);

  const [ivrDetails, setIvrDetails] = useState<IVRDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const fetchIVRDetails = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 DEBUG: Fetching IVR details for ID:', ivrId);
        // TODO: Replace with actual API call
        const response = await fetch(`/api/v1/ivr/${ivrId}`);
        const data = await response.json();
        console.log('🔍 DEBUG: Received IVR details:', data);
        setIvrDetails(data);
      } catch (error) {
        console.error('Failed to fetch IVR details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIVRDetails();
  }, [ivrId]);

  const handleDocumentsChange = async (newDocuments: Document[]) => {
    if (!ivrDetails) return;

    try {
      // TODO: Replace with actual API call
      await fetch(`/api/v1/ivr/${ivrId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: newDocuments }),
      });

      setIvrDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: {
            ...prev.documents,
            additional: newDocuments,
          },
        };
      });
    } catch (error) {
      console.error('Failed to update documents:', error);
    }
  };

  const renderTimeline = () => (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {ivrDetails?.timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== ivrDetails.timeline.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    <ClockIcon className="h-5 w-5 text-gray-500" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">{event.description}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-4">
      {ivrDetails?.communication.map(thread => (
        <div
          key={thread.id}
          className={`flex ${
            thread.sender === 'provider' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`rounded-lg p-4 max-w-md ${
              thread.sender === 'provider'
                ? 'bg-blue-50 text-blue-900'
                : 'bg-gray-50 text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{thread.sender}</span>
              <span className="text-xs text-gray-500">
                {new Date(thread.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{thread.message}</p>
            {thread.attachments && thread.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {thread.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <DocumentIcon className="h-4 w-4" />
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      {attachment.name}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Determine if we should show the upload alert
  const showUploadAlert = ivrDetails?.reviewNotes?.toLowerCase().includes('additional') ||
    ivrDetails?.reviewNotes?.toLowerCase().includes('documentation') ||
    ivrDetails?.reviewNotes?.toLowerCase().includes('photos');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!ivrDetails) {
    return <div>Failed to load IVR details</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Debug Information */}
      <div className="p-4 bg-blue-50 text-blue-700 text-sm">
        DEBUG: IVR Details View Loaded
        <br />
        Status: {ivrDetails?.status}
        <br />
        Has Review Notes: {ivrDetails?.reviewNotes ? 'Yes' : 'No'}
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              IVR Request #{ivrId}
            </h2>
            <p className="text-sm text-gray-500">
              Submitted by {ivrDetails.providerName} for {ivrDetails.patientName}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              ivrDetails.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : ivrDetails.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {ivrDetails.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Upload Alert - Always visible if documents are requested */}
      {showUploadAlert && (
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                Additional Documentation Requested
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {ivrDetails.reviewNotes}
              </p>
              <button
                onClick={() => setSelectedTab(0)} // Switch to Documents tab
                className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Upload Documents →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="border-b border-gray-200">
          <div className="px-6">
            <nav className="-mb-px flex space-x-8">
              <Tab
                className={({ selected }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                Documents
              </Tab>
              <Tab
                className={({ selected }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                Communication
              </Tab>
              <Tab
                className={({ selected }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                Timeline
              </Tab>
            </nav>
          </div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel className="p-6">
            <DocumentsView
              ivrStatus={ivrDetails.status}
              originalDocuments={ivrDetails.documents.original}
              additionalDocuments={ivrDetails.documents.additional}
              onDocumentsChange={handleDocumentsChange}
              reviewNotes={ivrDetails.reviewNotes}
            />
          </Tab.Panel>
          <Tab.Panel className="divide-y divide-gray-200">
            {/* Communication Section */}
            <div className="p-6">
              {renderCommunication()}
            </div>
            
            {/* Additional Documents Section - Always visible in Communication tab */}
            <div className="p-6 bg-gray-50">
              <AdditionalDocumentsSection
                ivrStatus={ivrDetails.status}
                documents={ivrDetails.documents.additional}
                onDocumentsChange={handleDocumentsChange}
                reviewNotes={ivrDetails.reviewNotes}
              />
            </div>
          </Tab.Panel>
          <Tab.Panel className="p-6">
            {renderTimeline()}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default IVRDetailsView; 