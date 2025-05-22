import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import { toast } from 'react-toastify';

import { IVRDocument } from '../../types/ivr';
import ivrService from '../../services/ivrService';

// Set up PDF.js worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
} catch (error) {
  console.error('Failed to initialize PDF.js worker:', error);
  toast.error('Failed to initialize document viewer');
}

interface Annotation {
  id: string;
  type: 'highlight' | 'text' | 'drawing';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: number[];
  color: string;
}

interface DocumentViewerProps {
  document: IVRDocument;
  onAnnotationChange?: (annotations: Annotation[]) => void;
  readOnly?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onAnnotationChange,
  readOnly = false,
}) => {
  // State
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(
    null
  );
  const [tool, setTool] = useState<'highlight' | 'text' | 'drawing'>('highlight');
  const [isDrawing, setIsDrawing] = useState(false);

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load document and annotations
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const data = await ivrService.getDocumentAnnotations(document.id);
        setAnnotations(data);
      } catch (error) {
        console.error('Failed to load annotations:', error);
        toast.error('Failed to load annotations');
      }
    };

    loadAnnotations();
  }, [document.id]);

  // Handle document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Failed to load document:', error);
    toast.error('Failed to load document');
  };

  // Handle stage mouse events
  const handleMouseDown = (e: any) => {
    if (readOnly) return;

    const pos = e.target.getStage().getPointerPosition();
    const { x, y } = pos;
    const id = Math.random().toString(36).substr(2, 9);

    if (tool === 'drawing') {
      setIsDrawing(true);
      setCurrentAnnotation({
        id,
        type: 'drawing',
        points: [x, y],
        color: '#ff0000',
      });
    } else if (tool === 'highlight') {
      setCurrentAnnotation({
        id,
        type: 'highlight',
        x,
        y,
        width: 0,
        height: 0,
        color: '#ffeb3b',
      });
    } else if (tool === 'text') {
      const annotation: Annotation = {
        id,
        type: 'text',
        x,
        y,
        text: '',
        color: '#000000',
      };
      setAnnotations([...annotations, annotation]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (readOnly || !currentAnnotation) return;

    const pos = e.target.getStage().getPointerPosition();
    const { x, y } = pos;

    if (tool === 'drawing' && isDrawing) {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), x, y],
      });
    } else if (tool === 'highlight') {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: x - (currentAnnotation.x || 0),
        height: y - (currentAnnotation.y || 0),
      });
    }
  };

  const handleMouseUp = () => {
    if (readOnly || !currentAnnotation) return;

    if (currentAnnotation.type === 'drawing' && currentAnnotation.points?.length === 2) {
      // Ignore single clicks for drawing
      setCurrentAnnotation(null);
      setIsDrawing(false);
      return;
    }

    const annotation: Annotation = {
      ...currentAnnotation as Annotation,
    };

    setAnnotations([...annotations, annotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);

    // Notify parent of annotation changes
    onAnnotationChange?.(annotations);
  };

  // Handle text annotation changes
  const handleTextChange = async (id: string, text: string) => {
    try {
      const updatedAnnotations = annotations.map((ann) =>
        ann.id === id ? { ...ann, text } : ann
      );
      setAnnotations(updatedAnnotations);
      
      // Save annotation to backend
      await ivrService.updateDocumentAnnotation(document.id, id, { text });
      onAnnotationChange?.(updatedAnnotations);
    } catch (error) {
      console.error('Failed to update annotation:', error);
      toast.error('Failed to update annotation');
    }
  };

  // Add text editing component
  const TextEditor = ({ annotation }: { annotation: Annotation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(annotation.text || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    const handleBlur = () => {
      setIsEditing(false);
      if (text !== annotation.text) {
        handleTextChange(annotation.id, text);
      }
    };

    if (isEditing && !readOnly) {
      return (
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleBlur();
            }
          }}
          className="absolute p-1 border rounded"
          style={{
            left: annotation.x,
            top: annotation.y,
            zIndex: 1000,
          }}
        />
      );
    }

    return (
      <Text
        x={annotation.x}
        y={annotation.y}
        text={text}
        fontSize={16}
        fill={annotation.color}
        onClick={() => !readOnly && setIsEditing(true)}
        onTap={() => !readOnly && setIsEditing(true)}
        draggable={!readOnly}
      />
    );
  };

  // Handle zoom
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex space-x-2">
          {!readOnly && (
            <>
              <button
                onClick={() => setTool('highlight')}
                className={`px-3 py-1 rounded ${
                  tool === 'highlight' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Highlight
              </button>
              <button
                onClick={() => setTool('text')}
                className={`px-3 py-1 rounded ${
                  tool === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setTool('drawing')}
                className={`px-3 py-1 rounded ${
                  tool === 'drawing' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Draw
              </button>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-gray-200"
              disabled={scale <= 0.5}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-gray-200"
              disabled={scale >= 3}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-gray-200"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          <Document
            file={document.url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={null}
            >
              <Stage
                ref={stageRef}
                width={containerRef.current?.clientWidth || 800}
                height={containerRef.current?.clientHeight || 1100}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: readOnly ? 'none' : 'auto',
                }}
              >
                <Layer>
                  {/* Render existing annotations */}
                  {annotations.map((annotation) => {
                    if (annotation.type === 'highlight') {
                      return (
                        <Rect
                          key={annotation.id}
                          x={annotation.x}
                          y={annotation.y}
                          width={annotation.width || 0}
                          height={annotation.height || 0}
                          fill={annotation.color}
                          opacity={0.3}
                        />
                      );
                    } else if (annotation.type === 'text') {
                      return <TextEditor key={annotation.id} annotation={annotation} />;
                    } else if (annotation.type === 'drawing') {
                      return (
                        <Line
                          key={annotation.id}
                          points={annotation.points || []}
                          stroke={annotation.color}
                          strokeWidth={2}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Render current annotation */}
                  {currentAnnotation && (
                    <>
                      {currentAnnotation.type === 'highlight' && (
                        <Rect
                          x={currentAnnotation.x}
                          y={currentAnnotation.y}
                          width={currentAnnotation.width || 0}
                          height={currentAnnotation.height || 0}
                          fill={currentAnnotation.color}
                          opacity={0.3}
                        />
                      )}
                      {currentAnnotation.type === 'drawing' && (
                        <Line
                          points={currentAnnotation.points || []}
                          stroke={currentAnnotation.color}
                          strokeWidth={2}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                        />
                      )}
                    </>
                  )}
                </Layer>
              </Stage>
            </Page>
          </Document>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, numPages))}
            disabled={currentPage === numPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 