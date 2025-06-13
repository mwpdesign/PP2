import React, { useState, useRef } from 'react';
import {
  EyeIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon,
  DocumentIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface SharedMedicalViewProps {
  pageType: 'ivr' | 'orders' | 'shipping';
  userRole: string;
  title: string;
  subtitle: string;
  canUploadDocs: boolean;
  canParticipateInChat: boolean;
  data: any[];
  columns: TableColumn[];
}

interface UploadedDocument {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  type: string;
  canDelete: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  senderRole: string;
}

export const SharedMedicalView: React.FC<SharedMedicalViewProps> = ({
  pageType,
  userRole,
  title,
  subtitle,
  canUploadDocs,
  canParticipateInChat,
  data,
  columns
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Document upload state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([
    {
      id: '1',
      name: 'insurance_verification_docs.pdf',
      uploadedBy: 'Regional Manager',
      uploadedAt: '2025-01-10 14:30',
      size: '2.4 MB',
      type: 'pdf',
      canDelete: false
    },
    {
      id: '2',
      name: 'shipping_manifest.xlsx',
      uploadedBy: 'You',
      uploadedAt: '2025-01-10 16:15',
      size: '1.2 MB',
      type: 'excel',
      canDelete: true
    }
  ]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Dr. Sarah Johnson',
      message: 'Need urgent approval for patient wound care supplies',
      timestamp: '2025-01-10 09:15',
      senderRole: 'doctor'
    },
    {
      id: '2',
      sender: 'IVR Specialist',
      message: 'Documentation received. Processing verification now.',
      timestamp: '2025-01-10 09:45',
      senderRole: 'ivr_specialist'
    },
    {
      id: '3',
      sender: 'Regional Manager',
      message: 'Approved for expedited processing',
      timestamp: '2025-01-10 10:30',
      senderRole: 'regional_distributor'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Get status options based on page type
  const getStatusOptions = () => {
    switch (pageType) {
      case 'ivr':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'in_review', label: 'In Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' }
        ];
      case 'orders':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'processing', label: 'Processing' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' }
        ];
      case 'shipping':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'preparing', label: 'Preparing' },
          { value: 'in_transit', label: 'In Transit' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'exception', label: 'Exception' }
        ];
      default:
        return [{ value: 'all', label: 'All Status' }];
    }
  };

  // Filter and sort data
  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === '' ||
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    const matchesDateRange = !dateRange.start || !dateRange.end ||
      (item.date >= dateRange.start && item.date <= dateRange.end);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        uploadedBy: 'You',
        uploadedAt: new Date().toLocaleString(),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type.includes('pdf') ? 'pdf' : 'excel',
        canDelete: true
      };
      setUploadedDocs(prev => [...prev, newDoc]);
    });
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle chat message send
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date().toLocaleString(),
      senderRole: userRole
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
  };

  // Export functions
  const exportToPDF = () => {
    console.log('Exporting to PDF...');
    // Mock export functionality
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
    // Mock export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header with View Only Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <EyeIcon className="h-4 w-4 mr-1" />
            View Only
          </span>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <TableCellsIcon className="h-4 w-4 mr-2" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                placeholder={`Search ${pageType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md"
                >
                  {getStatusOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Table - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {title} ({filteredData.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        style={{ width: column.width }}
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && sortColumn === column.key && (
                            <span className="text-slate-500">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          style={{ width: column.width }}
                          className="px-4 py-3 text-sm text-gray-900 overflow-hidden"
                        >
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">No {pageType} found</p>
                  <p className="mt-1">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Document Upload Section */}
          {canUploadDocs && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  isDragOver ? 'border-slate-400 bg-slate-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    Upload Files
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    or drag and drop files here
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Uploaded Documents List */}
              <div className="mt-4 space-y-2">
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.uploadedBy} • {doc.uploadedAt} • {doc.size}
                        </p>
                      </div>
                    </div>
                    {doc.canDelete && (
                      <button
                        onClick={() => setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {canParticipateInChat && pageType === 'ivr' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Communication</h3>
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
              </div>

              {/* Messages */}
              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">
                          {message.sender.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{message.sender}</p>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};