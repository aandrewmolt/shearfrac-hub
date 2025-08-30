// Production Deployment Helper for Offline Testing

export const deploymentHelper = {
  
  // Check if we're in a proper production environment
  isProductionEnvironment(): boolean {
    return (
      location.protocol === 'https:' || 
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'
    );
  },
  
  // Check if service workers are properly supported
  canUseServiceWorkers(): boolean {
    return (
      'serviceWorker' in navigator &&
      this.isProductionEnvironment()
    );
  },
  
  // Check if we can use IndexedDB
  canUseIndexedDB(): boolean {
    return 'indexedDB' in window;
  },
  
  // Get deployment recommendations
  getDeploymentOptions() {
    return {
      vercel: {
        name: 'Vercel (Recommended)',
        command: 'npx vercel',
        description: 'Zero-config deployment with HTTPS',
        pros: ['Automatic HTTPS', 'Fast CDN', 'Easy setup', 'Free tier'],
        url: 'https://vercel.com'
      },
      netlify: {
        name: 'Netlify',
        command: 'npm run build && npx netlify deploy --prod --dir=dist',
        description: 'JAMstack deployment platform',
        pros: ['Drag & drop deploy', 'Form handling', 'Analytics'],
        url: 'https://netlify.com'
      },
      githubPages: {
        name: 'GitHub Pages',
        command: 'npm run build && npx gh-pages -d dist',
        description: 'Free hosting for GitHub repos',
        pros: ['Free', 'GitHub integration', 'Custom domains'],
        url: 'https://pages.github.com'
      },
      localNetwork: {
        name: 'Local Network Testing',
        command: 'npm run build && npx serve dist -s',
        description: 'Test on your local network',
        pros: ['Test on other devices', 'No external dependencies'],
        note: 'Access via your IP address (e.g., http://192.168.1.100:3000)'
      }
    };
  },
  
  // Test offline capabilities (only works in production)
  async testOfflineCapabilities() {
    const results = {
      serviceWorker: false,
      indexedDB: false,
      offlineDetection: false,
      backgroundSync: false
    };
    
    // Test Service Worker
    if (this.canUseServiceWorkers()) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorker = !!registration;
      } catch (error) {
        console.warn('Service Worker test failed:', error);
      }
    }
    
    // Test IndexedDB
    results.indexedDB = this.canUseIndexedDB();
    
    // Test offline detection
    results.offlineDetection = 'onLine' in navigator;
    
    // Test background sync (only available with service worker)
    if (results.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        results.backgroundSync = 'sync' in registration;
      } catch (error) {
        console.warn('Background sync test failed:', error);
      }
    }
    
    return results;
  },
  
  // Get environment info
  getEnvironmentInfo() {
    return {
      protocol: location.protocol,
      hostname: location.hostname,
      port: location.port,
      isHTTPS: location.protocol === 'https:',
      isLocalhost: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      indexedDBSupport: 'indexedDB' in window
    };
  },
  
  // Log deployment status
  logDeploymentStatus() {
    console.group('🚀 RigUp Offline Deployment Status');
    
    const env = this.getEnvironmentInfo();
    console.log('Environment:', env);
    
    const canUseOffline = this.canUseServiceWorkers() && this.canUseIndexedDB();
    console.log('Offline Support Available:', canUseOffline ? '✅ YES' : '❌ NO');
    
    if (!canUseOffline) {
      console.group('❌ Offline Features Disabled');
      if (!env.isHTTPS && !env.isLocalhost) {
        console.log('• HTTPS required for service workers');
      }
      if (!env.serviceWorkerSupport) {
        console.log('• Browser does not support service workers');
      }
      if (!env.indexedDBSupport) {
        console.log('• Browser does not support IndexedDB');
      }
      console.groupEnd();
      
      console.group('🔧 To Enable Offline Features');
      console.log('Deploy to production with HTTPS:');
      const options = this.getDeploymentOptions();
      Object.values(options).forEach(option => {
        console.log(`• ${option.name}: ${option.command}`);
      });
      console.groupEnd();
    } else {
      console.log('✅ All offline features should work!');
    }
    
    console.groupEnd();
  }
};

// Removed auto-log on import to prevent module initialization issues
// Call deploymentHelper.logDeploymentStatus() manually when needed