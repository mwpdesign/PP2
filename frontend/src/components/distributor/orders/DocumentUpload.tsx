import React, { useState, useRef, useCallback } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

interface DocumentUploadProps {
  orderId: string;
  onDocumentUpload: (document: Document) => void;
  existingDocuments: Document[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  orderId, 
  onDocumentUpload, 
  existingDocuments 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentTypes = [
    'Skin Graph Bar Codes',
    'Shipping Label',
    'Packing Slip',
    'Invoice',
    'Certificate of Analysis',
    'Temperature Log',
    'Chain of Custody',
    'Product Insert',
    'Photo Documentation',
    'Damage Report',
    'Other'
  ];

  // Check if device has camera capability
  const hasCamera = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files, true); // Mark as camera capture
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      setIsCameraMode(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `camera-capture-${timestamp}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            handleFiles([file], true);
          }
        }, 'image/jpeg', 0.8);
      }
      
      stopCamera();
    }
  };

  const handleFiles = async (files: File[], fromCamera = false) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadingFiles(prev => [...prev, fileId]);

      try {
        // Simulate file upload - in real app, this would upload to your server/cloud storage
        await simulateUpload(file);
        
        const newDocument: Document = {
          id: fileId,
          name: customName || (fromCamera ? `Camera Capture - ${file.name}` : file.name),
          type: documentType || (fromCamera ? 'Photo Documentation' : getFileType(file.name)),
          url: URL.createObjectURL(file), // In real app, this would be the uploaded file URL
          uploadedAt: new Date().toISOString(),
          size: file.size
        };

        onDocumentUpload(newDocument);
        setCustomName('');
        setDocumentType('');
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== fileId));
      }
    }
  };

  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Document';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleString();
  };

  const handleRemoveDocument = (documentId: string) => {
    if (confirm('Are you sure you want to remove this document?')) {
      // In real app, you would make an API call to delete the document
      console.log('Removing document:', documentId);
    }
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isCameraMode && stream) {
    return (
      <div className="space-y-6">
        {/* Camera Interface */}
        <div className="bg-black rounded-xl overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-h-96 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 hover:border-slate-400 transition-colors flex items-center justify-center"
            >
              <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-400"></div>
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Camera Ready</h3>
          <p className="text-slate-600">
            Position your document or barcode in the frame and tap the capture button
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Document Type and Name Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
          >
            <option value="">Auto-detect from file</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Custom Document Name (Optional)
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter custom name for uploaded files"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Special Notice for Skin Graph Bar Codes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-800 mb-2">Skin Graph Bar Codes - Critical Requirement</h4>
            <p className="text-sm text-blue-700">
              Please upload clear, high-resolution images of all skin graph bar codes. These are critical for patient safety and tracking. 
              Use the camera feature for best quality when capturing barcodes on mobile devices.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Camera Capture (Mobile Priority) */}
        {hasCamera() && (
          <button
            onClick={startCamera}
            className="border-2 border-green-600 text-green-600 bg-white hover:bg-green-50 font-bold py-6 px-4 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md flex flex-col items-center space-y-3"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-center">
              <div className="font-bold">Use Camera</div>
              <div className="text-xs">Capture photos</div>
            </div>
          </button>
        )}

        {/* File Selection */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-bold py-6 px-4 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md flex flex-col items-center space-y-3"
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
          </svg>
          <div className="text-center">
            <div className="font-bold">Choose Files</div>
            <div className="text-xs">Browse device</div>
          </div>
        </button>

        {/* Camera Upload Input (Alternative for older browsers) */}
        {isMobile && (
          <label className="border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 font-bold py-6 px-4 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md flex flex-col items-center space-y-3 cursor-pointer">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <div className="font-bold">Take Photo</div>
              <div className="text-xs">Quick capture</div>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
              multiple
            />
          </label>
        )}
      </div>

      {/* Traditional Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-slate-500 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Drag & Drop Files</h3>
            <p className="text-slate-600 text-sm">
              Or use the buttons above for mobile-optimized upload options
            </p>
          </div>
          
          <p className="text-xs text-slate-500">
            Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB per file)
          </p>
        </div>
      </div>

      {/* Uploading Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-slate-800">Uploading...</h4>
          {uploadingFiles.map((fileId) => (
            <div key={fileId} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
              <span className="text-base font-medium text-slate-700">Uploading file...</span>
            </div>
          ))}
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-slate-800">Uploaded Documents</h4>
          <div className="space-y-4">
            {existingDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {doc.type.includes('Image') || doc.type.includes('Photo') || doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-800 truncate">{doc.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                      <span className="font-medium">{doc.type}</span>
                      {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button
                    onClick={() => window.open(doc.url, '_blank')}
                    className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions for Common Documents */}
      <div className="border-t border-slate-200 pt-8">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Skin Graph Bar Codes', 'Shipping Label', 'Packing Slip', 'Temperature Log'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setDocumentType(type);
                if (hasCamera() && type === 'Skin Graph Bar Codes') {
                  startCamera();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="text-sm px-4 py-3 border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
            >
              {type === 'Skin Graph Bar Codes' && hasCamera() ? '📷 ' : ''}
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 