import React, { useState, useEffect, useCallback } from 'react';
import {
  useTable,
  useSortBy,
  useRowSelect,
  Column,
  TableState,
  Row,
  HeaderGroup,
} from 'react-table';
import { toast } from 'react-toastify';

import {
  IVRRequest,
  IVRStatus,
  IVRPriority,
  IVRQueueParams,
} from '../../types/ivr';
import ivrService from '../../services/ivrService';
import websocketService from '../../services/websocket';

interface IVRReviewProps {
  territoryId?: string;
}

interface TableStateWithSelection extends TableState<IVRRequest> {
  selectedRowIds: Record<string, boolean>;
}

interface RowWithToggle extends Row<IVRRequest> {
  getToggleRowSelectedProps: () => any;
}

interface HeaderGroupWithSort extends HeaderGroup<IVRRequest> {
  getSortByToggleProps: () => any;
  isSorted: boolean;
  isSortedDesc: boolean;
}

const IVRReview: React.FC<IVRReviewProps> = ({ territoryId }) => {
  // State
  const [requests, setRequests] = useState<IVRRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueParams, setQueueParams] = useState<IVRQueueParams>({
    territoryId,
    page: 1,
    size: 20,
  });
  const [totalItems, setTotalItems] = useState(0);

  // Load queue data
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ivrService.getReviewQueue(queueParams);
      setRequests(response.items);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Failed to load queue:', error);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [queueParams]);

  // Handlers
  const handleViewDetails = useCallback((id: string) => {
    // Implement view details logic
    console.log('View details:', id);
  }, []);

  const handleApprove = useCallback(async (id: string) => {
    try {
      await ivrService.approveIVRRequest(id, {
        decision: 'approved',
        approvalLevel: 1,
      });
      toast.success('Request approved successfully');
      loadQueue();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve request');
    }
  }, [loadQueue]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await ivrService.rejectIVRRequest(id, {
        decision: 'rejected',
        approvalLevel: 1,
        reason: 'Rejected by reviewer', // Add rejection reason modal
      });
      toast.success('Request rejected successfully');
      loadQueue();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('Failed to reject request');
    }
  }, [loadQueue]);

  // Table columns
  const columns = React.useMemo<Column<IVRRequest>[]>(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Patient',
        accessor: (row: IVRRequest) => row.patient?.name,
      },
      {
        Header: 'Provider',
        accessor: (row: IVRRequest) => row.provider?.name,
      },
      {
        Header: 'Service Type',
        accessor: 'serviceType',
      },
      {
        Header: 'Priority',
        accessor: 'priority',
        Cell: ({ value }: { value: IVRPriority }) => (
          <span className={`priority-${value.toLowerCase()}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: IVRStatus }) => (
          <span className={`status-${value.toLowerCase()}`}>
            {value.replace('_', ' ').charAt(0).toUpperCase() + value.slice(1)}
          </span>
        ),
      },
      {
        Header: 'Actions',
        accessor: 'id',
        Cell: ({ row }: { row: any }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewDetails(row.original.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              View
            </button>
            <button
              onClick={() => handleApprove(row.original.id)}
              className="text-green-600 hover:text-green-800"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(row.original.id)}
              className="text-red-600 hover:text-red-800"
            >
              Reject
            </button>
          </div>
        ),
      },
    ],
    [handleApprove, handleReject, handleViewDetails]
  );

  // Table instance
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
  } = useTable(
    {
      columns,
      data: requests,
    },
    useSortBy,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: 'selection',
          Header: ({ getToggleAllRowsSelectedProps }: any) => (
            <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
          ),
          Cell: ({ row }: { row: RowWithToggle }) => (
            <input type="checkbox" {...row.getToggleRowSelectedProps()} />
          ),
        },
        ...columns,
      ]);
    }
  );

  const tableState = state as TableStateWithSelection;

  // Update selected requests when rows are selected
  useEffect(() => {
    const selectedIds = Object.keys(tableState.selectedRowIds || {}).map(
      (index) => requests[parseInt(index)].id
    );
    setSelectedRequests(selectedIds);
  }, [tableState.selectedRowIds, requests]);

  // Load queue on params change
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // WebSocket subscription
  useEffect(() => {
    const unsubscribe = websocketService.subscribe('status_update', (data) => {
      setRequests((prev) =>
        prev.map((request) =>
          request.id === data.id ? { ...request, ...data } : request
        )
      );
    });

    return () => unsubscribe();
  }, []);

  // Batch action handler
  const handleBatchAction = async (action: 'approve' | 'reject') => {
    if (selectedRequests.length === 0) {
      toast.warning('No requests selected');
      return;
    }

    try {
      const result = await ivrService.processBatch(action, selectedRequests);

      if (result.success.length > 0) {
        toast.success(
          `Successfully ${action}ed ${result.success.length} requests`
        );
      }

      if (Object.keys(result.failed).length > 0) {
        toast.error(
          `Failed to ${action} ${Object.keys(result.failed).length} requests`
        );
      }

      loadQueue();
    } catch (error) {
      console.error('Batch action failed:', error);
      toast.error(`Failed to ${action} requests`);
    }
  };

  // Filter handlers
  const handleFilterChange = (filters: Partial<IVRQueueParams>) => {
    setQueueParams((prev) => ({
      ...prev,
      ...filters,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setQueueParams((prev) => ({
      ...prev,
      page,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-4 gap-4">
          <select
            onChange={(e) =>
              handleFilterChange({ status: e.target.value as IVRStatus })
            }
            className="form-select"
          >
            <option value="">All Statuses</option>
            {Object.values(IVRStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            onChange={(e) =>
              handleFilterChange({ priority: e.target.value as IVRPriority })
            }
            className="form-select"
          >
            <option value="">All Priorities</option>
            {Object.values(IVRPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedRequests.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span>
              {selectedRequests.length} request
              {selectedRequests.length === 1 ? '' : 's'} selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBatchAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve Selected
              </button>
              <button
                onClick={() => handleBatchAction('reject')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table {...getTableProps()} className="min-w-full">
          <thead>
            {headerGroups.map((headerGroup) => {
              const typedHeaderGroup = headerGroup as HeaderGroupWithSort;
              return (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(typedHeaderGroup.getSortByToggleProps())}
                      className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.render('Header')}
                      <span>
                        {typedHeaderGroup.isSorted
                          ? typedHeaderGroup.isSortedDesc
                            ? ' ↓'
                            : ' ↑'
                          : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      className="px-6 py-4 whitespace-no-wrap border-b border-gray-200"
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div>
          Showing {((queueParams.page || 1) - 1) * (queueParams.size || 20) + 1} to{' '}
          {Math.min((queueParams.page || 1) * (queueParams.size || 20), totalItems)} of{' '}
          {totalItems} results
        </div>
        <div className="space-x-2">
          <button
            onClick={() => handlePageChange((queueParams.page || 1) - 1)}
            disabled={queueParams.page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange((queueParams.page || 1) + 1)}
            disabled={(queueParams.page || 1) * (queueParams.size || 20) >= totalItems}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVRReview; 