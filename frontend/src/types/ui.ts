/**
 * Common variant types for UI components
 */
export type ColorVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

/**
 * Size variants for UI components
 */
export type SizeVariant = 'sm' | 'md' | 'lg';

/**
 * Status variants for indicators
 */
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';

/**
 * Padding variants for containers
 */
export type PaddingVariant = 'none' | 'sm' | 'md' | 'lg';

/**
 * Base props interface for UI components
 */
export interface BaseComponentProps {
  className?: string;
  id?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Loading state props interface
 */
export interface LoadingStateProps {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Button component props interface
 */
export interface ButtonProps extends 
  BaseComponentProps,
  LoadingStateProps,
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   */
  variant?: ColorVariant;
  
  /**
   * The size variant of the button
   */
  size?: SizeVariant;
  
  /**
   * The content to be rendered inside the button
   */
  children: React.ReactNode;
  
  /**
   * Optional icon to be rendered before the button content
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Optional icon to be rendered after the button content
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Whether the button should take up the full width of its container
   */
  fullWidth?: boolean;
}

/**
 * Card component props interface
 */
export interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: PaddingVariant;
}

/**
 * Input component props interface
 */
export interface InputProps extends 
  BaseComponentProps,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  helperText?: string;
  size?: SizeVariant;
  fullWidth?: boolean;
}

/**
 * Loading spinner props interface
 */
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: SizeVariant;
  color?: string;
}

/**
 * Status indicator props interface
 */
export interface StatusIndicatorProps extends BaseComponentProps {
  status: StatusVariant;
  children?: React.ReactNode;
  size?: SizeVariant;
  showIcon?: boolean;
}

/**
 * Label props interface
 */
export interface LabelProps extends 
  BaseComponentProps,
  Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'className'> {
  required?: boolean;
  children: React.ReactNode;
} 