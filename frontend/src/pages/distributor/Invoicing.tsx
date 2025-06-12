import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Invoice {
  id: string;
  invoiceNumber: string;
  distributorName: string;
  distributorId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  paidDate?: string;
  items: InvoiceItem[];
  notes?: string;
  distributorAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceSummary {
  totalRevenue: number;
  outstandingAmount: number;
  paidThisMonth: number;
  overdueCount: number;
  overdueAmount: number;
}

const Invoicing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalRevenue: 0,
    outstandingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0,
    overdueAmount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distributorFilter, setDistributorFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Mock data generation
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        distributorName: 'Regional Medical Supply Co.',
        distributorId: 'DIST-001',
        invoiceDate: '2025-01-15',
        dueDate: '2025-02-14',
        amount: 45000.00,
        status: 'paid',
        paymentMethod: 'Wire Transfer',
        paidDate: '2025-02-10',
        items: [
          { id: '1', description: 'Wound Care Products - Q4 2024', quantity: 1, rate: 35000, amount: 35000 },
          { id: '2', description: 'Distribution Fee', quantity: 1, rate: 10000, amount: 10000 }
        ],
        distributorAddress: {
          street: '123 Medical Plaza Dr',
          city: 'Chicago',
          state: 'IL',
          zip: '60601'
        }
      },
      {
        id: '2',
        invoiceNumber: 'INV-2025-002',
        distributorName: 'Southwest Healthcare Distribution',
        distributorId: 'DIST-002',
        invoiceDate: '2025-01-20',
        dueDate: '2025-02-19',
        amount: 32500.00,
        status: 'pending',
        items: [
          { id: '1', description: 'Medical Supplies - January 2025', quantity: 1, rate: 28000, amount: 28000 },
          { id: '2', description: 'Shipping & Handling', quantity: 1, rate: 4500, amount: 4500 }
        ],
        distributorAddress: {
          street: '456 Healthcare Blvd',
          city: 'Phoenix',
          state: 'AZ',
          zip: '85001'
        }
      },
      {
        id: '3',
        invoiceNumber: 'INV-2025-003',
        distributorName: 'East Coast Medical Partners',
        distributorId: 'DIST-003',
        invoiceDate: '2024-12-15',
        dueDate: '2025-01-14',
        amount: 28750.00,
        status: 'overdue',
        items: [
          { id: '1', description: 'Skin Graft Products - December 2024', quantity: 1, rate: 25000, amount: 25000 },
          { id: '2', description: 'Training & Support', quantity: 1, rate: 3750, amount: 3750 }
        ],
        distributorAddress: {
          street: '789 Medical Center Way',
          city: 'Boston',
          state: 'MA',
          zip: '02101'
        }
      },
      {
        id: '4',
        invoiceNumber: 'INV-2025-004',
        distributorName: 'Pacific Northwest Supply',
        distributorId: 'DIST-004',
        invoiceDate: '2025-01-25',
        dueDate: '2025-02-24',
        amount: 18900.00,
        status: 'pending',
        items: [
          { id: '1', description: 'Wound Care Starter Kit', quantity: 3, rate: 5500, amount: 16500 },
          { id: '2', description: 'Documentation Package', quantity: 1, rate: 2400, amount: 2400 }
        ],
        distributorAddress: {
          street: '321 Healthcare Ave',
          city: 'Seattle',
          state: 'WA',
          zip: '98101'
        }
      },
      {
        id: '5',
        invoiceNumber: 'INV-2025-005',
        distributorName: 'Mountain States Medical',
        distributorId: 'DIST-005',
        invoiceDate: '2025-01-10',
        dueDate: '2025-02-09',
        amount: 41200.00,
        status: 'paid',
        paymentMethod: 'ACH Transfer',
        paidDate: '2025-02-05',
        items: [
          { id: '1', description: 'Advanced Wound Care Products', quantity: 1, rate: 38000, amount: 38000 },
          { id: '2', description: 'Territory Expansion Fee', quantity: 1, rate: 3200, amount: 3200 }
        ],
        distributorAddress: {
          street: '654 Mountain View Dr',
          city: 'Denver',
          state: 'CO',
          zip: '80201'
        }
      },
      {
        id: '6',
        invoiceNumber: 'INV-2025-006',
        distributorName: 'Gulf Coast Healthcare',
        distributorId: 'DIST-006',
        invoiceDate: '2024-12-20',
        dueDate: '2025-01-19',
        amount: 15600.00,
        status: 'overdue',
        items: [
          { id: '1', description: 'Basic Wound Care Supplies', quantity: 2, rate: 7000, amount: 14000 },
          { id: '2', description: 'Setup & Training', quantity: 1, rate: 1600, amount: 1600 }
        ],
        distributorAddress: {
          street: '987 Gulf Shore Blvd',
          city: 'Houston',
          state: 'TX',
          zip: '77001'
        }
      },
      {
        id: '7',
        invoiceNumber: 'INV-2025-007',
        distributorName: 'Midwest Medical Solutions',
        distributorId: 'DIST-007',
        invoiceDate: '2025-01-30',
        dueDate: '2025-03-01',
        amount: 36800.00,
        status: 'pending',
        items: [
          { id: '1', description: 'Comprehensive Product Line', quantity: 1, rate: 32000, amount: 32000 },
          { id: '2', description: 'Marketing Support', quantity: 1, rate: 4800, amount: 4800 }
        ],
        distributorAddress: {
          street: '147 Commerce St',
          city: 'Kansas City',
          state: 'MO',
          zip: '64101'
        }
      },
      {
        id: '8',
        invoiceNumber: 'INV-2025-008',
        distributorName: 'Atlantic Medical Group',
        distributorId: 'DIST-008',
        invoiceDate: '2025-01-05',
        dueDate: '2025-02-04',
        amount: 22400.00,
        status: 'paid',
        paymentMethod: 'Check',
        paidDate: '2025-01-28',
        items: [
          { id: '1', description: 'Specialty Wound Products', quantity: 1, rate: 20000, amount: 20000 },
          { id: '2', description: 'Expedited Shipping', quantity: 1, rate: 2400, amount: 2400 }
        ],
        distributorAddress: {
          street: '258 Atlantic Ave',
          city: 'Miami',
          state: 'FL',
          zip: '33101'
        }
      }
    ];

    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);

    // Calculate summary
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalRevenue = mockInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const outstandingAmount = mockInvoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const paidThisMonth = mockInvoices
      .filter(inv => {
        if (inv.status !== 'paid' || !inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueInvoices = mockInvoices.filter(inv => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    setSummary({
      totalRevenue,
      outstandingAmount,
      paidThisMonth,
      overdueCount: overdueInvoices.length,
      overdueAmount
    });
  }, []);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.distributorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (distributorFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.distributorId === distributorFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, distributorFilter]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowCreateModal(true);
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'paid' as const, paymentMethod: 'Manual Entry', paidDate: new Date().toISOString().split('T')[0] }
        : inv
    ));
  };

  const uniqueDistributors = Array.from(new Set(invoices.map(inv => inv.distributorName)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-600 mr-3" />
                  Invoicing & Billing
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage invoices, payments, and financial reporting
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Current Month</option>
                    <option>Last Month</option>
                    <option>Last 3 Months</option>
                    <option>Custom Range</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateInvoice}
                  className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalRevenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Outstanding Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.outstandingAmount)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paid This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.paidThisMonth)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.overdueCount} ({formatCurrency(summary.overdueAmount)})
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={distributorFilter}
                  onChange={(e) => setDistributorFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="all">All Distributors</option>
                  {uniqueDistributors.map(distributor => (
                    <option key={distributor} value={distributor}>{distributor}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Export
                </button>
                <button className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Bulk Actions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distributor/Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{invoice.distributorName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.paymentMethod || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-slate-600 hover:text-slate-900"
                          title="View Invoice"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-slate-600 hover:text-slate-900"
                          title="Download PDF"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Send Reminder"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Invoice Modal */}
        {showViewModal && selectedInvoice && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Invoice Header */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="bg-slate-100 w-24 h-12 rounded flex items-center justify-center mb-4">
                      <span className="text-slate-600 font-bold text-sm">LOGO</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                    <p className="text-gray-600">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.invoiceDate)}</p>
                    <p className="text-sm text-gray-600 mt-2">Due Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bill To:</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedInvoice.distributorName}</p>
                    <p>{selectedInvoice.distributorAddress.street}</p>
                    <p>{selectedInvoice.distributorAddress.city}, {selectedInvoice.distributorAddress.state} {selectedInvoice.distributorAddress.zip}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status:</h4>
                  <span className={getStatusBadge(selectedInvoice.status)}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                  {selectedInvoice.paymentMethod && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Payment Method:</p>
                      <p className="font-medium">{selectedInvoice.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-900">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Rate</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">{formatCurrency(item.rate)}</td>
                        <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedInvoice.amount * 0.9)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Tax (10%):</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedInvoice.amount * 0.1)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="font-medium">Total Due:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Download PDF
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  Email Invoice
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id);
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                    <input
                      type="text"
                      defaultValue={editingInvoice?.invoiceNumber || `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                    <input
                      type="date"
                      defaultValue={editingInvoice?.invoiceDate || new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      defaultValue={editingInvoice?.dueDate}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      defaultValue={editingInvoice?.status || 'pending'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Billing To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bill To</label>
                  <select className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500">
                    <option>Select Distributor...</option>
                    {uniqueDistributors.map(distributor => (
                      <option key={distributor} value={distributor}>{distributor}</option>
                    ))}
                  </select>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Line Items</label>
                    <button className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                      + Add Item
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-md">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              placeholder="Product/Service description"
                              className="w-full border-0 focus:ring-0 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              placeholder="1"
                              className="w-full border-0 focus:ring-0 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              placeholder="0.00"
                              className="w-full border-0 focus:ring-0 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-900">$0.00</span>
                          </td>
                          <td className="px-4 py-2">
                            <button className="text-red-600 hover:text-red-900">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax:</span>
                      <span className="text-sm font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Payment terms, special instructions..."
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700">
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoicing;
