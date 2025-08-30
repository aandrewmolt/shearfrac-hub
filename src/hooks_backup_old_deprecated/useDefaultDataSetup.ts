
export const useDefaultDataSetup = () => {
  // Completely disabled - no default data loading
  return {
    isInitializing: false,
    hasInitialized: true,
    needsInitialization: false
  };
};
