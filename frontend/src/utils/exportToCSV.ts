interface CSVExportData {
  [key: string]: string | number | boolean | null | undefined;
}

interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
}

/**
 * Exports data to CSV format and triggers download
 * @param data Array of objects to export
 * @param options Export configuration options
 */
export const exportToCSV = (
  data: CSVExportData[],
  options: CSVExportOptions = {}
): void => {
  const {
    filename = `export-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    delimiter = ','
  } = options;

  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Escape CSV values that contain commas, quotes, or newlines
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
    if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  // Create CSV content
  const csvContent = [
    // Header row
    csvHeaders.map(header => escapeCSVValue(header)).join(delimiter),
    // Data rows
    ...data.map(row =>
      csvHeaders.map(header => escapeCSVValue(row[header])).join(delimiter)
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Converts shipping orders to CSV-friendly format
 */
export const formatShippingOrdersForCSV = (orders: any[]) => {
  return orders.map(order => ({
    'Order ID': order.orderNumber,
    'Doctor Name': order.doctor.name,
    'Facility': order.doctor.facility,
    'Products': `${order.productCount} items`,
    'Status': order.status,
    'Priority': order.priority,
    'Order Date': new Date(order.orderDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    'Shipping Address': `${order.shipTo.city}, ${order.shipTo.state}`
  }));
};

/**
 * Export shipping orders specifically
 */
export const exportShippingOrdersToCSV = (orders: any[], filename?: string) => {
  const formattedData = formatShippingOrdersForCSV(orders);
  exportToCSV(formattedData, {
    filename: filename || `shipping-queue-${new Date().toISOString().split('T')[0]}.csv`
  });
};