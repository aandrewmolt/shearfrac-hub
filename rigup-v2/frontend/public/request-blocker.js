// EMERGENCY REQUEST BLOCKER - Loaded before ANYTHING else
// This runs before React, before any bundled code
(function() {
  'use strict';
  
  console.log('🛡️ EMERGENCY REQUEST BLOCKER ACTIVATED');
  
  const originalFetch = window.fetch;
  const requestMap = new Map();
  const requestCounts = new Map();
  let blockingEnabled = true;
  
  // Override fetch IMMEDIATELY
  window.fetch = function(url, options) {
    // Extract URL string
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Only block API requests
    if (!urlString.includes('/api/') && !urlString.includes('amazonaws.com')) {
      return originalFetch.apply(window, arguments);
    }
    
    // Emergency kill switch - if more than 10 requests to same endpoint in 1 second, block ALL
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
      console.error(`🚨 EMERGENCY BLOCK: ${endpoint} - ${counts.count} requests in 1 second!`);
      
      // Return fake successful response with empty data
      return Promise.resolve(new Response(JSON.stringify([]), {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Blocked-By': 'Emergency-Blocker'
        })
      }));
    }
    
    // Check for duplicate GET requests
    const method = (options?.method || 'GET').toUpperCase();
    if (method === 'GET') {
      const cacheKey = urlString;
      
      // If request already in flight, return it
      if (requestMap.has(cacheKey)) {
        console.warn(`🔄 DUPLICATE BLOCKED: ${endpoint}`);
        return requestMap.get(cacheKey).then(response => response.clone());
      }
      
      // Make request and cache promise
      const promise = originalFetch.apply(window, arguments);
      requestMap.set(cacheKey, promise);
      
      // Clean up after 100ms
      promise.finally(() => {
        setTimeout(() => {
          requestMap.delete(cacheKey);
        }, 100);
      });
      
      return promise;
    }
    
    // Non-GET requests pass through
    return originalFetch.apply(window, arguments);
  };
  
  // Add global function to check status
  window.__checkBlocker = function() {
    return {
      enabled: blockingEnabled,
      inFlight: requestMap.size,
      counts: Array.from(requestCounts.entries()).map(([url, data]) => ({
        url,
        count: data.count,
        window: new Date(data.windowStart).toISOString()
      }))
    };
  };
  
  // Add global function to disable blocker (for debugging)
  window.__disableBlocker = function() {
    blockingEnabled = false;
    console.warn('⚠️ Request blocker DISABLED');
  };
  
  console.log('✅ Request blocker installed. Check status with: __checkBlocker()');
})();