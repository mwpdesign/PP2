/**
 * Utility functions for formatting numbers and dates
 */

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Formats a date string or Date object into a readable format
 * Handles null, undefined, and invalid dates gracefully
 * @param dateInput - Date string, Date object, or null/undefined
 * @param format - Format type: 'full' (default), 'date', 'time', 'short'
 * @returns Formatted date string or fallback text
 */
export const formatDate = (
  dateInput: string | Date | null | undefined,
  format: 'full' | 'date' | 'time' | 'short' = 'full'
): string => {
  // Handle null, undefined, or empty string
  if (!dateInput) {
    return 'Not available';
  }

  try {
    // Convert to Date object if it's a string
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Format based on the requested format
    switch (format) {
      case 'date':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });

      case 'full':
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
    }
  } catch (error) {
    console.warn('Date formatting error:', error, 'Input:', dateInput);
    return 'Invalid date';
  }
};

/**
 * Formats a timestamp specifically for communication messages
 * Returns format like "Jun 10, 2025 3:30 PM"
 * Handles the specific API timestamp format: "2025-06-11T00:24:15.612510+00:00Z"
 */
export const formatMessageTimestamp = (timestamp: string | Date | null | undefined): string => {
  // Handle null, undefined, or empty string
  if (!timestamp) {
    return 'Not available';
  }

  try {
    let dateString = timestamp;

    // If it's a string, clean up the format
    if (typeof timestamp === 'string') {
      // Remove trailing Z if there's already a timezone offset
      if (timestamp.includes('+') && timestamp.endsWith('Z')) {
        dateString = timestamp.slice(0, -1);
      }
      // Handle the specific API format
      dateString = dateString.replace(/\+00:00$/, 'Z');
    }

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp format:', timestamp);
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Date formatting error:', error, 'Input:', timestamp);
    return 'Invalid date';
  }
};

/**
 * Formats a date for simple date display (no time)
 * Returns format like "Jun 10, 2025"
 */
export const formatDateOnly = (dateInput: string | Date | null | undefined): string => {
  return formatDate(dateInput, 'date');
};

/**
 * Formats a date for short display
 * Returns format like "6/10/2025"
 */
export const formatDateShort = (dateInput: string | Date | null | undefined): string => {
  return formatDate(dateInput, 'short');
};