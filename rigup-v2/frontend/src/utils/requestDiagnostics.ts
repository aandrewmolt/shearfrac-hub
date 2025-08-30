/**
 * Request Diagnostics - Debug why requests are still getting through
 */

export function installRequestDiagnostics() {
  // Track all fetch calls
  let fetchCallCount = 0;
  let fetchCallDetails: any[] = [];
  
  const originalFetch = window.fetch;
  
  // Wrap fetch to track ALL calls
  (window as any).__originalFetch = originalFetch;
  
  window.fetch = function(...args: any[]) {
    fetchCallCount++;
    const url = args[0]?.toString() || 'unknown';
    const stack = new Error().stack;
    
    // Log details
    const detail = {
      count: fetchCallCount,
      url,
      timestamp: new Date().toISOString(),
      stack: stack?.split('\n').slice(2, 5).join(' -> '),
    };
    
    fetchCallDetails.push(detail);
    
    // Only keep last 50 calls
    if (fetchCallDetails.length > 50) {
      fetchCallDetails.shift();
    }
    
    console.log(`[FETCH #${fetchCallCount}] ${url}`);
    
    // Call original
    return originalFetch.apply(window, args as any);
  };
  
  // Global diagnostic function
  (window as any).__getDiagnostics = () => {
    return {
      totalFetchCalls: fetchCallCount,
      recentCalls: fetchCallDetails,
      duplicates: fetchCallDetails.reduce((acc, call) => {
        const url = call.url.split('?')[0];
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  };
  
  console.log('📊 Request diagnostics installed. Use __getDiagnostics() to see details');
}

// Auto-install if in development
if (import.meta.env.DEV) {
  installRequestDiagnostics();
}