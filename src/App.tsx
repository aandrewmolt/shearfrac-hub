
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SafeInventoryProvider } from "./contexts/SafeInventoryProvider";
import { InventoryMapperProvider } from "./contexts/InventoryMapperContext";
import Index from "./pages/Index";
import CableJobs from "./pages/CableJobs";
import Inventory from "./pages/Inventory";
import InventorySettings from "./pages/InventorySettings";
import EquipmentInventory from "./pages/EquipmentInventory";
import MainDashboard from "./pages/MainDashboard";
import NotFound from "./pages/NotFound";
import InitDatabase from "./pages/InitDatabase";
import { RealtimeConnectionMonitor } from "./components/RealtimeConnectionMonitor";
import { LocalModeBanner } from "./components/LocalModeBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SafeWrapper } from "./components/SafeWrapper";
import { ContactsPage } from "./contacts/components/ContactsPage";
// Import these dynamically to avoid module initialization issues
import { DATABASE_MODE } from "./utils/consolidated/databaseUtils";
import { logEnvironmentStatus } from "./utils/validateEnvironment";
import "./App.css";

// Lazy initialization to prevent module initialization issues
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient();
  }
  return queryClient;
}

function App() {
  // Register service worker for offline support
  useEffect(() => {
    // Build version indicator
    console.log('🚀 RigUp Build Version: 2025-01-27-array-fixes');
    console.log('✅ This build includes: Array.from null checks, Symbol.iterator fixes');
    
    // Validate environment configuration
    logEnvironmentStatus();
    
    // Use dynamic imports to avoid module initialization issues
    const initializeApp = async () => {
      try {
        // Dynamically import modules to ensure proper initialization order
        const { deploymentHelper } = await import("./lib/offline/deploymentHelper");
        const { initializeLocalData } = await import("./lib/offline/initializeLocalData");
        const { serviceWorkerManager } = await import("./lib/offline/serviceWorker");
        const { addClientToJobs } = await import("./lib/turso/migrations/addClientToJobs");
        
        // Check deployment status
        deploymentHelper.logDeploymentStatus();
        
        // Run database migrations
        if (DATABASE_MODE !== 'local') {
          await addClientToJobs();
        }
        
        // Initialize local data if in local mode
        if (DATABASE_MODE === 'local') {
          initializeLocalData();
        }
        
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
                    <LocalModeBanner />
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
                <RealtimeConnectionMonitor />
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
