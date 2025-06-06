import React, { useState, useCallback } from 'react';
import {
  CheckSquare,
  Square,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Zap,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ivrService from '../../services/ivrService';
import { IVRBatchAction, IVRBatchResult } from '../../types/ivr';

interface BatchIVRItem {
  id: string;
  patientName: string;
  woundType: string;
  priority: 'urgent' | 'high' | 'medium' | 'routine';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime: number; // in seconds
  progress: number; // 0-100
  error?: string;
  completedAt?: Date;
}

interface BatchProcessorProps {
  onClose: () => void;
  initialItems?: BatchIVRItem[];
}

const MOCK_BATCH_ITEMS: BatchIVRItem[] = [
  {
    id: 'ivr-001',
    patientName: 'John Smith',
    woundType: 'Diabetic foot ulcer',
    priority: 'high',
    status: 'pending',
    estimatedTime: 120,
    progress: 0
  },
  {
    id: 'ivr-002',
    patientName: 'Mary Johnson',
    woundType: 'Pressure ulcer - Stage 2',
    priority: 'high',
    status: 'pending',
    estimatedTime: 90,
    progress: 0
  },
  {
    id: 'ivr-003',
    patientName: 'Robert Davis',
    woundType: 'Venous leg ulcer',
    priority: 'medium',
    status: 'pending',
    estimatedTime: 150,
    progress: 0
  },
  {
    id: 'ivr-004',
    patientName: 'Sarah Wilson',
    woundType: 'Surgical wound dehiscence',
    priority: 'urgent',
    status: 'pending',
    estimatedTime: 75,
    progress: 0
  },
  {
    id: 'ivr-005',
    patientName: 'Michael Brown',
    woundType: 'Acute laceration',
    priority: 'high',
    status: 'pending',
    estimatedTime: 60,
    progress: 0
  }
];

const BatchProcessor: React.FC<BatchProcessorProps> = ({
  onClose,
  initialItems = MOCK_BATCH_ITEMS
}) => {
  const [items, setItems] = useState<BatchIVRItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    completed: 0,
    failed: 0,
    total: 0,
    startTime: null as Date | null,
    estimatedCompletion: null as Date | null
  });

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const pendingItems = items.filter(item => item.status === 'pending');
    setSelectedItems(new Set(pendingItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'routine': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'processing': return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const simulateProcessing = useCallback(async (itemIds: string[]) => {
    setIsProcessing(true);
    setProcessingStats({
      completed: 0,
      failed: 0,
      total: itemIds.length,
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + itemIds.length * 90 * 1000) // 90s average
    });

    for (const itemId of itemIds) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = () => {
            if (!isPaused) {
              resolve(void 0);
            } else {
              setTimeout(checkPause, 100);
            }
          };
          checkPause();
        });
      }

      // Update item to processing
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, status: 'processing' as const, progress: 0 }
          : item
      ));

      // Simulate processing with progress updates
      const processingTime = items.find(item => item.id === itemId)?.estimatedTime || 90;
      const steps = 10;
      const stepTime = (processingTime * 1000) / steps;

      for (let step = 1; step <= steps; step++) {
        if (isPaused) {
          await new Promise(resolve => {
            const checkPause = () => {
              if (!isPaused) {
                resolve(void 0);
              } else {
                setTimeout(checkPause, 100);
              }
            };
            checkPause();
          });
        }

        await new Promise(resolve => setTimeout(resolve, stepTime));

        setItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, progress: (step / steps) * 100 }
            : item
        ));
      }

      // Complete processing (90% success rate)
      const isSuccess = Math.random() > 0.1;
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: isSuccess ? 'completed' as const : 'failed' as const,
              progress: 100,
              completedAt: new Date(),
              error: isSuccess ? undefined : 'Processing failed - please retry'
            }
          : item
      ));

      setProcessingStats(prev => ({
        ...prev,
        completed: prev.completed + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1)
      }));
    }

    setIsProcessing(false);
    setSelectedItems(new Set());
    toast.success(`Batch processing completed! ${processingStats.completed} successful, ${processingStats.failed} failed`);
  }, [isPaused, items, processingStats.completed, processingStats.failed]);

  const startBatchProcessing = async () => {
    if (selectedItems.size === 0) {
      toast.warning('Please select items to process');
      return;
    }

    try {
      await simulateProcessing(Array.from(selectedItems));
    } catch (error) {
      console.error('Batch processing failed:', error);
      toast.error('Batch processing failed');
      setIsProcessing(false);
    }
  };

  const pauseProcessing = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Processing resumed' : 'Processing paused');
  };

  const retryFailed = () => {
    const failedItems = items.filter(item => item.status === 'failed');
    if (failedItems.length === 0) {
      toast.info('No failed items to retry');
      return;
    }

    setItems(prev => prev.map(item =>
      item.status === 'failed'
        ? { ...item, status: 'pending', progress: 0, error: undefined }
        : item
    ));

    setSelectedItems(new Set(failedItems.map(item => item.id)));
    toast.success(`${failedItems.length} failed items reset for retry`);
  };

  const exportResults = () => {
    const completedItems = items.filter(item => item.status === 'completed');
    const csvContent = [
      'Patient Name,Wound Type,Priority,Completion Time,Processing Duration',
      ...completedItems.map(item =>
        `${item.patientName},${item.woundType},${item.priority},${item.completedAt?.toISOString()},${item.estimatedTime}s`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-processing-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Results exported successfully');
  };

  const totalEstimatedTime = Array.from(selectedItems).reduce((total, itemId) => {
    const item = items.find(i => i.id === itemId);
    return total + (item?.estimatedTime || 0);
  }, 0);

  const completedCount = items.filter(item => item.status === 'completed').length;
  const failedCount = items.filter(item => item.status === 'failed').length;
  const pendingCount = items.filter(item => item.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Batch IVR Processor
                </h2>
                <p className="text-sm text-gray-600">
                  Process multiple wound care IVRs simultaneously
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {pendingCount} pending
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {completedCount} completed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">
                  {failedCount} failed
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {selectedItems.size > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedItems.size} selected • Est. {Math.round(totalEstimatedTime / 60)}min
                </span>
              )}
              <button
                onClick={exportResults}
                disabled={completedCount === 0}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAll}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Select All Pending</span>
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <Square className="w-4 h-4" />
                <span>Clear Selection</span>
              </button>
              <button
                onClick={retryFailed}
                disabled={failedCount === 0}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-800 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Failed</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {isProcessing && (
                <button
                  onClick={pauseProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}
              <button
                onClick={startBatchProcessing}
                disabled={selectedItems.size === 0 || isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isProcessing ? 'Processing...' : `Process ${selectedItems.size} Items`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="overflow-y-auto max-h-[50vh]">
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-6 py-4 hover:bg-gray-50 ${
                  selectedItems.has(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    disabled={item.status !== 'pending'}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.patientName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.woundType}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(item.estimatedTime / 60)}min
                        </span>
                      </div>
                    </div>

                    {item.status === 'processing' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(item.progress)}% complete
                        </div>
                      </div>
                    )}

                    {item.error && (
                      <div className="mt-2 text-sm text-red-600">
                        {item.error}
                      </div>
                    )}

                    {item.completedAt && (
                      <div className="mt-2 text-sm text-green-600">
                        Completed at {item.completedAt.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {items.length} total items • Batch processing reduces completion time by 60-70%
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchProcessor;