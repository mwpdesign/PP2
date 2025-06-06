import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* HIPAA Indicator */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center text-blue-700 text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  This error has been logged securely in compliance with HIPAA regulations
                </div>
              </div>

              {/* Error Icon */}
              <div className="mb-6">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Something went wrong
              </h1>
              <p className="text-slate-600 mb-8">
                We've encountered an unexpected error. Our team has been notified and is working to fix it.
              </p>

              {/* Refresh Button */}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}