import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';

import {
  IVRRequest,
  IVRStatus,
  IVRPriority,
  IVRQueueParams,
} from '../../types/ivr';
import ivrService from '../../services/ivrService';

interface IVRSearchProps {
  onResultSelect?: (request: IVRRequest) => void;
  initialFilters?: Partial<IVRQueueParams>;
}

const IVRSearch: React.FC<IVRSearchProps> = ({
  onResultSelect,
  initialFilters = {},
}) => {
  // State
  const [searchResults, setSearchResults] = useState<IVRRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Form handling
  const { control, watch, reset } = useForm<IVRQueueParams>({
    defaultValues: {
      page: 1,
      size: 10,
      ...initialFilters,
    },
  });

  const formValues = watch();

  // Perform search
  const performSearch = useCallback(async (params: IVRQueueParams) => {
    try {
      setLoading(true);
      const response = await ivrService.getReviewQueue(params);
      setSearchResults(response.items);
      setTotalResults(response.total);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  // Trigger search on form value changes
  useEffect(() => {
    debouncedSearch(formValues);
    return () => {
      debouncedSearch.cancel();
    };
  }, [formValues, debouncedSearch]);

  // Reset search
  const handleReset = useCallback(() => {
    reset(initialFilters);
  }, [reset, initialFilters]);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select w-full rounded-md border-gray-300"
                >
                  <option value="">All Statuses</option>
                  {Object.values(IVRStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select w-full rounded-md border-gray-300"
                >
                  <option value="">All Priorities</option>
                  {Object.values(IVRPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex space-x-2">
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="form-input w-full rounded-md border-gray-300"
                  />
                )}
              />
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="form-input w-full rounded-md border-gray-300"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <Controller
              name="patientName"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  {...field}
                  placeholder="Search by patient name"
                  className="form-input w-full rounded-md border-gray-300"
                />
              )}
            />
          </div>

          {/* Provider Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Name
            </label>
            <Controller
              name="providerName"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  {...field}
                  placeholder="Search by provider name"
                  className="form-input w-full rounded-md border-gray-300"
                />
              )}
            />
          </div>

          {/* Request ID Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request ID
            </label>
            <Controller
              name="requestId"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  {...field}
                  placeholder="Search by request ID"
                  className="form-input w-full rounded-md border-gray-300"
                />
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResults.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onResultSelect?.(request)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.patient?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.provider?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === IVRStatus.APPROVED
                            ? 'bg-green-100 text-green-800'
                            : request.status === IVRStatus.REJECTED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.priority === IVRPriority.HIGH
                            ? 'bg-red-100 text-red-800'
                            : request.priority === IVRPriority.MEDIUM
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResultSelect?.(request);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    debouncedSearch({ ...formValues, page: (formValues.page || 1) - 1 })
                  }
                  disabled={formValues.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    debouncedSearch({ ...formValues, page: (formValues.page || 1) + 1 })
                  }
                  disabled={
                    (formValues.page || 1) * (formValues.size || 10) >= totalResults
                  }
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((formValues.page || 1) - 1) * (formValues.size || 10) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(
                        (formValues.page || 1) * (formValues.size || 10),
                        totalResults
                      )}
                    </span>{' '}
                    of <span className="font-medium">{totalResults}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        debouncedSearch({ ...formValues, page: (formValues.page || 1) - 1 })
                      }
                      disabled={formValues.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        debouncedSearch({ ...formValues, page: (formValues.page || 1) + 1 })
                      }
                      disabled={
                        (formValues.page || 1) * (formValues.size || 10) >= totalResults
                      }
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IVRSearch; 