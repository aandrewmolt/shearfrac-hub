import { useEquipmentUsageManager } from './useEquipmentUsageManager';
import { useEquipmentStatsManager } from './useEquipmentStatsManager';
import { useEquipmentRedTagManager } from './useEquipmentRedTagManager';

/**
 * Unified Equipment Usage Tracking - Version 2
 * 
 * Replaces the monolithic useEquipmentUsageTracking (370 lines) with focused managers:
 * - Usage session management (start/stop/track)
 * - Statistics and lifecycle analysis  
 * - Red-tagging functionality
 * 
 * Benefits:
 * - Smaller, focused responsibilities
 * - Better testability
 * - Easier maintenance
 * - Reusable components
 */
export const useEquipmentUsageTrackingV2 = () => {
  // Core usage session management
  const usageManager = useEquipmentUsageManager();
  
  // Statistics and lifecycle analysis (depends on usage sessions)
  const statsManager = useEquipmentStatsManager(usageManager.usageSessions);
  
  // Red-tagging functionality
  const redTagManager = useEquipmentRedTagManager();

  return {
    // Usage session management
    ...usageManager,
    
    // Statistics and lifecycle analysis
    ...statsManager,
    
    // Red-tagging functionality
    ...redTagManager,
    
    // Combined loading state
    isLoading: usageManager.isLoading || redTagManager.isLoading
  };
};