
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SafeInventoryProvider } from "./contexts/SafeInventoryProvider";
import { InventoryMapperProvider } from "./contexts/InventoryMapperContext";
// import { RealtimeConnectionMonitor } from "./components/RealtimeConnectionMonitor";  // Not needed with AWS
// import { LocalModeBanner } from "./components/LocalModeBanner";  // Not needed with AWS
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SafeWrapper } from "./components/SafeWrapper";

// Import pages directly to avoid dynamic import issues in production
import Index from "./pages/Index";
import CableJobs from "./pages/CableJobs";
import Inventory from "./pages/Inventory";
import InventorySettings from "./pages/InventorySettings";
import EquipmentInventory from "./pages/EquipmentInventory";
import MainDashboard from "./pages/MainDashboard";
import NotFound from "./pages/NotFound";
import InitDatabase from "./pages/InitDatabase";
import { ContactsPage } from "./contacts/components/ContactsPage";
// Import these dynamically to avoid module initialization issues
// import { DATABASE_MODE } from "./utils/consolidated/databaseUtils";  // Using AWS API now
// import { logEnvironmentStatus } from "./utils/validateEnvironment";  // Skip Turso validation
import "./App.css";

// Lazy initialization to prevent module initialization issues
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // AGGRESSIVE: Prevent ALL automatic refetching
          staleTime: 1000 * 60 * 5, // 5 minutes - match cache TTL
          gcTime: 1000 * 60 * 10, // 10 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          refetchInterval: false, // Never auto-refetch
          retry: false, // Don't retry failed requests
          retryDelay: 0,
          networkMode: 'offlineFirst', // Use cache first
        },
      },
    });
  }
  return queryClient;
}

// Install request blocker IMMEDIATELY
const installAppRequestBlocker = () => {
  if ((window as any).__appBlocker) return;
  
  console.log('🛡️ Installing request blocker from App.tsx');
  
  const originalFetch = window.fetch;
  const requestMap = new Map<string, Promise<Response>>();
  const requestCounts = new Map<string, { count: number; windowStart: number }>();
  
  window.fetch = function(url: any, options: any): Promise<Response> {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    if (!urlString.includes('/api/') && !urlString.includes('amazonaws.com')) {
      return originalFetch.apply(window, arguments as any);
    }
    
    const endpoint = urlString.split('?')[0];
    const now = Date.now();
    const counts = requestCounts.get(endpoint) || { count: 0, windowStart: now };
    
    if (now - counts.windowStart > 1000) {
      counts.count = 1;
      counts.windowStart = now;
    } else {
      counts.count++;
    }
    requestCounts.set(endpoint, counts);
    
    if (counts.count > 5) {
      console.error(`🚨 APP BLOCKER: ${endpoint} - ${counts.count} requests!`);
      return Promise.resolve(new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    const method = (options?.method || 'GET').toUpperCase();
    if (method === 'GET') {
      const cacheKey = urlString;
      
      if (requestMap.has(cacheKey)) {
        console.warn(`🔄 APP DUPLICATE BLOCKED: ${endpoint}`);
        return requestMap.get(cacheKey)!.then(r => r.clone());
      }
      
      const promise = originalFetch.apply(window, arguments as any) as Promise<Response>;
      requestMap.set(cacheKey, promise);
      
      promise.finally(() => {
        setTimeout(() => requestMap.delete(cacheKey), 100);
      });
      
      return promise;
    }
    
    return originalFetch.apply(window, arguments as any);
  };
  
  (window as any).__appBlocker = true;
  (window as any).__checkBlocker = () => ({
    inFlight: requestMap.size,
    counts: Array.from(requestCounts.entries())
  });
  
  console.log('✅ App request blocker installed');
};

// Install immediately before component renders
installAppRequestBlocker();

function App() {
  const [showVersion, setShowVersion] = useState(true);
  
  // Register service worker for offline support
  useEffect(() => {
    // Double-check blocker is installed
    installAppRequestBlocker();
    
    // Build version indicator with timestamp to force cache refresh
    const buildTime = '2025-01-30T' + new Date().toISOString().split('T')[1];
    console.log('🚀 RigUp Build Version: 2025-01-30-ARCHITECTURE-FIX-V6');
    console.log('🕐 Build deployed at:', buildTime);
    console.log('✅ CRITICAL FIXES APPLIED:');
    console.log('  1. getEquipmentTypes no longer fetches entire inventory');
    console.log('  2. Core hook effect infinite loop fixed');
    console.log('  3. Batch fetching implemented to prevent N+1');
    console.log('  4. All auto-loading queries disabled');
    
    // Force version check
    (window as any).__BUILD_VERSION = 'V5-CACHE-BUST-' + Date.now();
    
    // Hide version after 30 seconds (longer to ensure you see it)
    setTimeout(() => setShowVersion(false), 30000);
    
    // Skip Turso validation - using AWS API now
    // logEnvironmentStatus();
    
    // Use dynamic imports to avoid module initialization issues
    const initializeApp = async () => {
      try {
        // AWS API Mode - skip all Turso/local database initialization
        console.log('🚀 Using AWS Lambda Backend');
        console.log('📡 API URL:', import.meta.env.VITE_API_URL);
        
        // Only import offline helpers if needed
        const { deploymentHelper } = await import("./lib/offline/deploymentHelper");
        const { serviceWorkerManager } = await import("./lib/offline/serviceWorker");
        
        // Check deployment status
        deploymentHelper.logDeploymentStatus();
        
        // Skip database migrations - using AWS DynamoDB
        // if (DATABASE_MODE !== 'local') {
        //   await addClientToJobs();
        // }
        
        // Skip local data initialization - using AWS
        // if (DATABASE_MODE === 'local') {
        //   initializeLocalData();
        // }
        
        // Only register service worker in production-like environments
        if (deploymentHelper.canUseServiceWorkers()) {
          serviceWorkerManager.register().then(success => {
            if (success) {
              console.log('🎉 RigUp is now available offline!');
            }
          });
        } else {
          console.log('ℹ️ Offline features will be available in production deployment');
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      {showVersion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'red',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          zIndex: 9999999,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          V6-ARCH-FIX | REQUEST STORM FIXED | ENV: {import.meta.env.MODE} | {new Date().toISOString()}
        </div>
      )}
      <QueryClientProvider client={getQueryClient()}>
        <AuthProvider>
          <SafeWrapper>
            <SafeInventoryProvider>
              <InventoryMapperProvider>
                <TooltipProvider>
                  <Toaster />
                  <BrowserRouter>
                    <div className="min-h-screen bg-gradient-corporate">
                      {/* AWS API Mode - No Local Mode Banner */}
                      <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<MainDashboard />} />
                  <Route path="/jobs" element={<CableJobs />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/inventory/settings" element={<InventorySettings />} />
                  <Route path="/inventory/equipment" element={<EquipmentInventory />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/init-database" element={<InitDatabase />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                      {/* AWS API Mode - No Realtime Monitor */}
                    </div>
                  </BrowserRouter>
                </TooltipProvider>
              </InventoryMapperProvider>
            </SafeInventoryProvider>
          </SafeWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
);
}

export default App;
