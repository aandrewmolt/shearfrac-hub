import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface SafeWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  fallback?: React.ReactNode;
}

export const SafeWrapper: React.FC<SafeWrapperProps> = ({ 
  children, 
  loading = false, 
  error = null, 
  fallback 
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};