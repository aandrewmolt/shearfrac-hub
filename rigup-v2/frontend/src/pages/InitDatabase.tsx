import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initializeTursoDatabase } from '@/scripts/initializeTursoDatabase';
import { useNavigate } from 'react-router-dom';

export default function InitDatabase() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  // Log component mount
  console.log('InitDatabase component mounted');

  const handleInitialize = async () => {
    setIsInitializing(true);
    setStatus('idle');
    
    try {
      await initializeTursoDatabase();
      setStatus('success');
      setMessage('Database initialized successfully! Redirecting to inventory...');
      
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to initialize database');
      console.error('Initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">Initialize Turso Database</CardTitle>
            <CardDescription className="text-muted-foreground">
              This will create all the default equipment types and inventory items in your Turso database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-center text-foreground">This will create:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Equipment Types: ShearStream Box, Starlink, Customer Computer/Tablet, Cables, Y-Adapter, Pressure Gauge</li>
                <li>Storage Locations: Midland Office (default), Houston Warehouse</li>
                <li>Individual Equipment: SS001-SS015, SL01-SL15, CT01-CT10, CC01-CC15</li>
                <li>Cable Inventory: 10 units each of 100ft, 200ft, 300ft (old/new)</li>
                <li>Y-Adapters: 10 units</li>
                <li>Pressure Gauges: 20 units</li>
              </ul>
            </div>

            {status === 'success' && (
              <Alert className="bg-green-500/20 border-green-500">
                <AlertDescription className="text-green-500 text-center">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert className="bg-destructive/20 border-destructive">
                <AlertDescription className="text-destructive text-center">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleInitialize} 
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Database'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Note: This is safe to run multiple times. Existing items will be skipped.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Build: {new Date().toISOString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
