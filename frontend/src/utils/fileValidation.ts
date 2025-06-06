export interface FileValidationOptions {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  allowedMimeTypes?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Common file type configurations
export const FILE_TYPE_CONFIGS = {
  MEDICAL_DOCUMENTS: {
    acceptedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff'
    ],
    maxSizeMB: 10
  },
  INSURANCE_CARDS: {
    acceptedFileTypes: ['.jpg', '.jpeg', '.png'],
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    maxSizeMB: 5
  },
  GENERAL_DOCUMENTS: {
    acceptedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    maxSizeMB: 15
  }
};

/**
 * Validates a file against specified criteria
 */
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult => {
  const {
    maxSizeMB = 10,
    acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
    allowedMimeTypes = []
  } = options;

  const warnings: string[] = [];

  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }

  // Warn if file is very small (might be corrupted)
  if (file.size < 1024) { // Less than 1KB
    warnings.push('File size is very small. Please verify the file is not corrupted.');
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!acceptedFileTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type "${fileExtension}" is not supported. Accepted types: ${acceptedFileTypes.join(', ')}`
    };
  }

  // Check MIME type if specified
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File MIME type "${file.type}" is not allowed`
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|vbs|js)$/i,
    /^\./, // Hidden files
    /[<>:"|?*]/ // Invalid characters
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return {
        isValid: false,
        error: 'File name contains invalid or suspicious characters'
      };
    }
  }

  // Warn about very long file names
  if (file.name.length > 100) {
    warnings.push('File name is very long. Consider using a shorter name.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Validates multiple files
 */
export const validateFiles = (
  files: File[],
  options: FileValidationOptions = {}
): { validFiles: File[]; invalidFiles: { file: File; error: string }[] } => {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];

  files.forEach(file => {
    const result = validateFile(file, options);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, error: result.error || 'Unknown validation error' });
    }
  });

  return { validFiles, invalidFiles };
};

/**
 * Gets human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Gets file type category for display
 */
export const getFileTypeCategory = (file: File): string => {
  if (isImageFile(file)) return 'Image';
  if (isPDFFile(file)) return 'PDF Document';
  if (file.type.includes('word')) return 'Word Document';
  if (file.type.includes('excel')) return 'Excel Spreadsheet';
  return 'Document';
};

/**
 * Sanitizes file name for safe storage
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
};