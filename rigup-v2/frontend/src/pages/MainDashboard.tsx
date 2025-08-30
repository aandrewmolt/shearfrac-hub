import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cable, Package, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';

// Install request blocker when dashboard loads
const installRequestBlocker = () => {
  if ((window as any).__checkBlocker) {
    console.log('Request blocker already installed');
    return;
  }
  
  console.log('🛡️ Installing request blocker from MainDashboard');
  
  const originalFetch = window.fetch;
  const requestMap = new Map();
  const requestCounts = new Map();
  
  window.fetch = function(url: any, options: any) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Only intercept API calls
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
    
    // Block if too many requests
    if (counts.count > 5) {
      console.error(`🚨 BLOCKED: ${endpoint} - ${counts.count} requests in 1 second!`);
      return Promise.resolve(new Response(JSON.stringify([]), {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' })
      }));
    }
    
    // Check for duplicate GET requests
    const method = (options?.method || 'GET').toUpperCase();
    if (method === 'GET') {
      const cacheKey = urlString;
      
      if (requestMap.has(cacheKey)) {
        console.warn(`🔄 DUPLICATE BLOCKED: ${endpoint}`);
        return requestMap.get(cacheKey)!.then((r: Response) => r.clone());
      }
      
      const promise = originalFetch.apply(window, arguments as any);
      requestMap.set(cacheKey, promise);
      
      promise.finally(() => {
        setTimeout(() => requestMap.delete(cacheKey), 100);
      });
      
      return promise;
    }
    
    return originalFetch.apply(window, arguments as any);
  };
  
  // Add debug functions
  (window as any).__checkBlocker = () => ({
    inFlight: requestMap.size,
    counts: Array.from(requestCounts.entries())
  });
  
  console.log('✅ Request blocker installed from MainDashboard');
};

const MainDashboard = () => {
  const navigate = useNavigate();
  
  // Install blocker on mount
  useEffect(() => {
    installRequestBlocker();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-corporate">
      <AppHeader />
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-corporate-light uppercase tracking-wider mb-4">Rig-Up Management</h1>
            <p className="text-xl text-corporate-silver mb-6">
              Manage your jobs, equipment inventory, and contacts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/jobs')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-accent-gold/20 rounded-full w-fit">
                  <Cable className="h-12 w-12 text-accent-gold" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Job Mapper</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Create visual diagrams for your well configurations
                </p>
                <Button className="w-full bg-accent-gold hover:bg-accent-gold-dark text-corporate-dark">
                  Open Job Mapper
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/inventory/equipment')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-status-success/20 rounded-full w-fit">
                  <Package className="h-12 w-12 text-status-success" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Equipment Inventory</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Track equipment across storage locations and job sites
                </p>
                <Button className="w-full bg-status-success hover:bg-green-700 text-white">
                  Open Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/contacts')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-status-info/20 rounded-full w-fit">
                  <Users className="h-12 w-12 text-status-info" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Contacts</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Manage client, frac, and custom contacts
                </p>
                <Button className="w-full bg-status-info hover:bg-blue-700 text-white">
                  Open Contacts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;