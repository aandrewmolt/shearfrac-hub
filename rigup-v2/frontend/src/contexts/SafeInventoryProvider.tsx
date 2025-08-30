import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InventoryProvider } from './InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SafeInventoryProviderProps {
  children: ReactNode;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading Inventory...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Initializing inventory data and setting up real-time connections...
        </p>
      </CardContent>
    </Card>
  </div>
);

const ErrorFallback = () => (
  <Card className="max-w-2xl mx-auto my-8">
    <CardHeader>
      <CardTitle className="text-destructive">
        Inventory System Error
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        There was an error loading the inventory system. This might be due to:
      </p>
      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
        <li>• Network connectivity issues</li>
        <li>• Database connection problems</li>
        <li>• Data initialization errors</li>
      </ul>
      <p className="text-sm">
        Please try refreshing the page or contact support if the issue persists.
      </p>
    </CardContent>
  </Card>
);

/**
 * SafeInventoryProvider wraps the InventoryProvider with error boundaries
 * and loading states to prevent runtime errors from crashing the app.
 * 
 * This specifically addresses the production errors:
 * - "Cannot read properties of undefined (reading 'forEach')"
 * - "Cannot read properties of undefined (reading 'filter')"
 * - "Cannot access 'B' before initialization"
 */
export const SafeInventoryProvider: React.FC<SafeInventoryProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <InventoryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </InventoryProvider>
      </Suspense>
    </ErrorBoundary>
  );
};

export default SafeInventoryProvider;