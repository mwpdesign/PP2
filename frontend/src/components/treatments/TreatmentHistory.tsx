import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, UserIcon, DocumentTextIcon, PhotoIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Treatment, TreatmentHistoryProps, TreatmentDocument } from '../../types/treatments';
import DocumentViewerModal from './DocumentViewerModal';

const TreatmentHistory: React.FC<TreatmentHistoryProps> = ({
  patientId,
  treatments,
  loading = false,
  onRefresh
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<TreatmentDocument | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  const toggleRowExpansion = (treatmentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(treatmentId)) {
      newExpanded.delete(treatmentId);
    } else {
      newExpanded.add(treatmentId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDocumentView = (document: TreatmentDocument) => {
    setSelectedDocument(document);
    setIsDocumentViewerOpen(true);
  };

  const getDocumentTypeLabel = (type: TreatmentDocument['document_type']) => {
    const labels = {
      before_photo: 'Before Photo',
      after_photo: 'After Photo',
      graft_sticker: 'Graft Sticker',
      usage_log: 'Usage Log',
      other: 'Document'
    };
    return labels[type];
  };

  const isImageFile = (fileName: string) => {
    return fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-slate-900">Treatment History</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ClockIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No treatments recorded</h3>
          <p className="mt-1 text-sm text-slate-500">
            Treatment records will appear here once products are applied to the patient.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">Treatment History</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">
              {treatments.length} treatment{treatments.length !== 1 ? 's' : ''}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ClockIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quantity Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Applied By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {treatments.map((treatment, index) => (
              <React.Fragment key={treatment.id}>
                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {formatDate(treatment.date_applied)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{treatment.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {treatment.quantity_used}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-sm text-slate-900">{treatment.applied_by_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <button
                      onClick={() => toggleRowExpansion(treatment.id)}
                      className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {expandedRows.has(treatment.id) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="ml-1">Details</span>
                    </button>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRows.has(treatment.id) && (
                  <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="bg-slate-100 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Diagnosis</h4>
                            <p className="text-sm text-slate-700">
                              {treatment.diagnosis || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Procedure</h4>
                            <p className="text-sm text-slate-700">
                              {treatment.procedure_performed || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Wound Location</h4>
                            <p className="text-sm text-slate-700">
                              {treatment.wound_location || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-slate-900 mb-2">Full Clinical Notes</h4>
                          <p className="text-sm text-slate-700">
                            {treatment.doctor_notes || 'No detailed notes provided'}
                          </p>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                          Recorded on {formatDateTime(treatment.created_at)}
                        </div>

                        {/* Treatment Documents */}
                        {treatment.documents && treatment.documents.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-slate-900 mb-3">Treatment Documents</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {treatment.documents.map((document) => (
                                <div
                                  key={document.id}
                                  className="relative group cursor-pointer"
                                  onClick={() => handleDocumentView(document)}
                                >
                                  <div className="aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                                    {isImageFile(document.file_name) ? (
                                      <img
                                        src={document.file_url}
                                        alt={document.file_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <DocumentTextIcon className="h-8 w-8 text-slate-400" />
                                      </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                      <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>

                                  {/* Document Type Label */}
                                  <div className="mt-1 text-xs text-center">
                                    <div className="font-medium text-slate-700 truncate">
                                      {getDocumentTypeLabel(document.document_type)}
                                    </div>
                                    <div className="text-slate-500 truncate">
                                      {document.file_name}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="divide-y divide-slate-200">
          {treatments.map((treatment, index) => (
            <div key={treatment.id} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-900">
                  {treatment.product_name}
                </div>
                <div className="text-sm text-slate-500">
                  {formatDate(treatment.date_applied)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Quantity Used</div>
                  <div className="text-sm text-slate-900">{treatment.quantity_used}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Applied By</div>
                  <div className="text-sm text-slate-900">{treatment.applied_by_name}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Clinical Notes</div>
                <div className="text-sm text-slate-900">
                  {treatment.doctor_notes || 'No notes provided'}
                </div>
              </div>

              <button
                onClick={() => toggleRowExpansion(treatment.id)}
                className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {expandedRows.has(treatment.id) ? (
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 mr-1" />
                )}
                View Details
              </button>

              {/* Mobile Expanded Details */}
              {expandedRows.has(treatment.id) && (
                <div className="mt-4 bg-slate-100 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Diagnosis</div>
                      <div className="text-sm text-slate-700">
                        {treatment.diagnosis || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Procedure</div>
                      <div className="text-sm text-slate-700">
                        {treatment.procedure_performed || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Wound Location</div>
                      <div className="text-sm text-slate-700">
                        {treatment.wound_location || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    Recorded on {formatDateTime(treatment.created_at)}
                  </div>

                  {/* Mobile Treatment Documents */}
                  {treatment.documents && treatment.documents.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-slate-900 mb-3">Treatment Documents</h5>
                      <div className="grid grid-cols-2 gap-3">
                        {treatment.documents.map((document) => (
                          <div
                            key={document.id}
                            className="relative group cursor-pointer"
                            onClick={() => handleDocumentView(document)}
                          >
                            <div className="aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                              {isImageFile(document.file_name) ? (
                                <img
                                  src={document.file_url}
                                  alt={document.file_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <DocumentTextIcon className="h-8 w-8 text-slate-400" />
                                </div>
                              )}

                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>

                            {/* Document Type Label */}
                            <div className="mt-1 text-xs text-center">
                              <div className="font-medium text-slate-700 truncate">
                                {getDocumentTypeLabel(document.document_type)}
                              </div>
                              <div className="text-slate-500 truncate">
                                {document.file_name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={isDocumentViewerOpen}
        onClose={() => setIsDocumentViewerOpen(false)}
      />
    </div>
  );
};

export default TreatmentHistory;