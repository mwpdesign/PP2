import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Document as DocumentType } from '../../types/ivr';

interface DocumentPreviewModalProps {
  document: DocumentType | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (documentId: string) => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: documentProp,
  isOpen,
  onClose,
  onDownload
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (documentProp && isOpen) {
      generatePreviewUrl();
    }
  }, [documentProp, isOpen]);

  const generatePreviewUrl = async () => {
    if (!documentProp) return;

    setIsLoading(true);
    setError(null);

    try {
      // For mock documents, create a mock preview URL
      if (documentProp.id.startsWith('doc-')) {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (documentProp.type === 'medical' || documentProp.name.toLowerCase().includes('pdf')) {
          setPreviewUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        } else if (documentProp.type === 'insurance' || isImageFile(documentProp.name)) {
          setPreviewUrl('https://via.placeholder.com/800x600/f1f5f9/64748b?text=Insurance+Card');
        } else {
          setPreviewUrl(null);
        }
      } else {
        // For real documents, use the document URL or generate one
        setPreviewUrl(documentProp.url || null);
      }
    } catch (err) {
      setError('Failed to load document preview');
    } finally {
      setIsLoading(false);
    }
  };

  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const isTextFile = (filename: string) => {
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    if (documentProp) {
      onDownload(documentProp.id);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-500">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={handleDownload}
            className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Download File
          </button>
        </div>
      );
    }

    if (!documentProp || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-500">
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm mt-2">This file type cannot be previewed</p>
          <button
            onClick={handleDownload}
            className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Download File
          </button>
        </div>
      );
    }

    if (isPdfFile(documentProp.name)) {
      return (
        <div className="w-full h-full" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={`Preview of ${documentProp.name}`}
          />
        </div>
      );
    }

    if (isImageFile(documentProp.name)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={previewUrl}
            alt={documentProp.name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    if (isTextFile(documentProp.name)) {
      return (
        <div className="p-6 bg-slate-50 h-full overflow-auto">
          <pre
            className="whitespace-pre-wrap text-sm text-slate-800 font-mono"
            style={{ fontSize: `${zoom / 100}rem` }}
          >
            {/* Mock text content for demonstration */}
            {documentProp.name.includes('medical') ?
              'MEDICAL RECORD\n\nPatient: John Smith\nDate: 2024-03-15\n\nChief Complaint: Chronic wound care\n\nHistory of Present Illness:\nPatient presents with ongoing wound management needs...' :
              'Sample document content would appear here...'
            }
          </pre>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <p className="text-lg font-medium">Unsupported file type</p>
        <p className="text-sm mt-2">This file type cannot be previewed</p>
        <button
          onClick={handleDownload}
          className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Download File
        </button>
      </div>
    );
  };

  if (!isOpen || !documentProp) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isFullscreen ? 'bg-black' : 'bg-black bg-opacity-50'} flex items-center justify-center p-4`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 truncate">{documentProp.name}</h3>
            <p className="text-sm text-slate-500">
              {documentProp.type} • {documentProp.size ? `${Math.round(documentProp.size / 1024)} KB` : 'Unknown size'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Zoom Out"
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5" />
            </button>

            <span className="text-sm text-slate-600 min-w-[3rem] text-center">{zoom}%</span>

            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Zoom In"
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-slate-300 mx-2" />

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-5 w-5" />
              ) : (
                <ArrowsPointingOutIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Download"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;