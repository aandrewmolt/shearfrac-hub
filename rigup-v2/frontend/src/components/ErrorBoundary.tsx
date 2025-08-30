import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level } = this.props;
    
    console.error(`Error caught by ${level || 'component'} boundary:`, error, errorInfo);
    
    // Log specific error patterns that might be causing production issues
    if (error.message.includes('Cannot read properties of undefined')) {
      console.error('🔴 PRODUCTION ERROR: Undefined property access detected');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    if (error.message.includes('Cannot access') && error.message.includes('before initialization')) {
      console.error('🔴 PRODUCTION ERROR: Initialization order issue detected');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error boundary when resetKeys change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== this.previousResetKeys[idx])) {
        this.handleRetry();
      }
    }
    
    if (resetKeys) {
      this.previousResetKeys = [...resetKeys];
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', isolate } = this.props;
      const errorMessage = this.state.error?.message || 'Unknown error occurred';
      const isDataAccessError = errorMessage.includes('Cannot read properties of undefined');
      const isInitializationError = errorMessage.includes('Cannot access') && errorMessage.includes('before initialization');

      // For isolated errors, show a more compact error UI
      if (isolate && level === 'component') {
        return (
          <div className="p-4 border border-red-200 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Component Error</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{errorMessage}</p>
            <Button size="sm" onClick={this.handleRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        );
      }

      return (
        <Card className="max-w-2xl mx-auto my-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {level === 'page' ? 'Page Error' : level === 'section' ? 'Section Error' : 'Application Error'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isDataAccessError && (
                  <div>
                    <strong>Data Access Error:</strong> A component tried to access data before it was loaded.
                    <br />
                    <span className="text-sm">This might be caused by components rendering before the inventory context is ready.</span>
                  </div>
                )}
                {isInitializationError && (
                  <div>
                    <strong>Initialization Error:</strong> A variable or function was accessed before it was initialized.
                    <br />
                    <span className="text-sm">This might be caused by circular dependencies or module loading order issues.</span>
                  </div>
                )}
                {!isDataAccessError && !isInitializationError && (
                  <div>
                    <strong>Error:</strong> {errorMessage}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Technical Details:</h4>
              <div className="text-sm font-mono bg-card p-2 rounded border overflow-x-auto">
                {errorMessage}
              </div>
              {this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-card rounded border overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <h4 className="font-medium mb-2">Troubleshooting:</h4>
              <ul className="space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
                <li>• Clear your browser cache</li>
                <li>• If the issue persists, contact support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;