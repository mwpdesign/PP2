/**
 * Formats a phone number string to (xxx) xxx-xxxx format
 * @param phone - The phone number string to format
 * @returns The formatted phone number string
 */
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different lengths
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if not a valid phone number
  return phone;
};

/**
 * Removes all formatting from a phone number string, leaving only digits
 * @param phone - The formatted phone number string
 * @returns The unformatted phone number string (digits only)
 */
export const unformatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Formats a phone number as the user types
 * @param value - The current input value
 * @returns The formatted phone number string
 */
export const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 3) {
    return digits.length === 0 ? '' : `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

/**
 * Validates if a phone number string is in a valid format
 * @param phone - The phone number string to validate
 * @returns boolean indicating if the phone number is valid
 */
export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}; 