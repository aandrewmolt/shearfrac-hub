/**
 * AWS Connection Status Component
 * Shows the current connection status to AWS API Gateway
 */

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatus {
  connected: boolean;
  checking: boolean;
  lastCheck: Date | null;
  error: string | null;
}

export function AwsConnectionStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    checking: true,
    lastCheck: null,
    error: null,
  });

  // Check AWS API connection
  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, checking: true, error: null }));
    
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // If no API URL configured, show as disconnected
    if (!apiUrl || apiUrl.includes('your-api-gateway-id')) {
      setStatus({
        connected: false,
        checking: false,
        lastCheck: new Date(),
        error: 'AWS API not configured',
      });
      return;
    }

    try {
      // Try to fetch from the health check endpoint
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatus({
          connected: true,
          checking: false,
          lastCheck: new Date(),
          error: null,
        });
      } else {
        // If health endpoint doesn't exist, try the jobs endpoint
        const jobsResponse = await fetch(`${apiUrl}/jobs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        setStatus({
          connected: jobsResponse.ok || jobsResponse.status === 401, // 401 means API is working but needs auth
          checking: false,
          lastCheck: new Date(),
          error: jobsResponse.ok ? null : `API returned ${jobsResponse.status}`,
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        checking: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Determine the display based on status
  const getStatusDisplay = () => {
    if (status.checking) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Checking AWS...',
        className: 'text-muted-foreground',
      };
    }

    if (status.connected) {
      return {
        icon: <Cloud className="h-4 w-4" />,
        text: 'AWS Connected',
        className: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: <CloudOff className="h-4 w-4" />,
      text: status.error || 'AWS Disconnected',
      className: 'text-amber-600 dark:text-amber-400',
    };
  };

  const displayStatus = getStatusDisplay();

  return (
    <div 
      className={cn(
        'flex items-center gap-2 text-sm',
        displayStatus.className,
        className
      )}
      title={status.lastCheck ? `Last checked: ${status.lastCheck.toLocaleTimeString()}` : undefined}
    >
      {displayStatus.icon}
      <span className="hidden sm:inline">{displayStatus.text}</span>
    </div>
  );
}

export default AwsConnectionStatus;