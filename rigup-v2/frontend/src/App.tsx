
import { useEffect } from "react";
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

function App() {
  // Register service worker for offline support
  useEffect(() => {
    // Build version indicator
    console.log('🚀 RigUp Build Version: 2025-01-27-array-fixes');
    console.log('✅ This build includes: Array.from null checks, Symbol.iterator fixes');
    
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
