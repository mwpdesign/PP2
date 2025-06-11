import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterState {
  statuses: string[];
  startDate: string;
  endDate: string;
  doctorSearch: string;
}

interface ShippingQueueFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const ShippingQueueFilters: React.FC<ShippingQueueFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status);

    onFiltersChange({
      ...filters,
      statuses: newStatuses
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleDoctorSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      doctorSearch: value
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      statuses: ['Created', 'Processing'], // Default to Created and Processing
      startDate: '',
      endDate: '',
      doctorSearch: ''
    });
  };

  const hasActiveFilters =
    filters.statuses.length !== 2 ||
    !filters.statuses.includes('Created') ||
    !filters.statuses.includes('Processing') ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.doctorSearch !== '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">

        {/* Status Filter */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-4">
            {['Created', 'Processing', 'Shipped'].map((status) => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                  checked={filters.statuses.includes(status)}
                  onChange={(e) => handleStatusChange(status, e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Date Range
          </label>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="date"
              className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
              value={filters.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              placeholder="Start date"
            />
            <input
              type="date"
              className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
              value={filters.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              placeholder="End date"
            />
          </div>
        </div>

        {/* Doctor/Facility Search */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor or Facility
          </label>
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
            placeholder="Search doctor name or facility..."
            value={filters.doctorSearch}
            onChange={(e) => handleDoctorSearchChange(e.target.value)}
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2 opacity-0">
            Clear
          </label>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
                : 'text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>

            {/* Status filters */}
            {filters.statuses.length > 0 && filters.statuses.length < 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.statuses.join(', ')}
              </span>
            )}

            {/* Date range */}
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Date: {filters.startDate || 'Any'} to {filters.endDate || 'Any'}
              </span>
            )}

            {/* Doctor search */}
            {filters.doctorSearch && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Search: "{filters.doctorSearch}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingQueueFilters;