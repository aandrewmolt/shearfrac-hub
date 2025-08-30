import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobs } from '@/hooks/useJobs';
import type { 
  EquipmentLifecycle, 
  JobEquipmentUsage,
  EquipmentUsageStats,
  EquipmentUsageSession 
} from '@/types/equipment-usage';

/**
 * Focused manager for equipment statistics and lifecycle analysis
 * Extracted from useEquipmentUsageTracking monolith
 */
export const useEquipmentStatsManager = (usageSessions: EquipmentUsageSession[]) => {
  const { data: inventoryData } = useInventory();
  const { jobs } = useJobs();

  // Calculate hours between two dates
  const calculateHours = (start: Date | string, end?: Date | string | null): number => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = end ? (typeof end === 'string' ? new Date(end) : end) : new Date();
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.round(hours * 10) / 10);
  };

  // Get equipment lifecycle data
  const getEquipmentLifecycle = useCallback((equipmentId: string): EquipmentLifecycle | null => {
    const equipment = inventoryData.individualEquipment.find(
      eq => eq.id === equipmentId || eq.equipmentId === equipmentId
    );
    
    if (!equipment) return null;

    const equipmentSessions = usageSessions.filter(s => s.equipmentId === equipmentId);
    const totalHours = equipmentSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + session.totalHours;
      } else {
        return sum + calculateHours(session.startTime);
      }
    }, 0);

    const deploymentCount = equipmentSessions.filter(s => s.sessionType === 'deployment').length;
    const maintenanceCount = equipmentSessions.filter(s => s.sessionType === 'maintenance').length;

    return {
      equipmentId,
      equipmentName: equipment.name,
      totalHours,
      deploymentCount,
      maintenanceCount,
      currentStatus: equipment.status,
      createdDate: equipment.createdAt ? new Date(equipment.createdAt) : new Date(),
      lastUsed: equipmentSessions.length > 0 
        ? Math.max(...equipmentSessions.map(s => s.startTime.getTime()))
        : null
    };
  }, [inventoryData, usageSessions, calculateHours]);

  // Get job usage statistics
  const getJobUsageStats = useCallback((jobId: string): JobEquipmentUsage | null => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    const jobSessions = usageSessions.filter(s => s.jobId === jobId);
    
    if (jobSessions.length === 0) return null;

    const equipmentUsed = Array.from(new Set(jobSessions.map(s => s.equipmentId)));
    const totalHours = jobSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + session.totalHours;
      } else {
        return sum + calculateHours(session.startTime);
      }
    }, 0);

    const activeSessions = jobSessions.filter(s => !s.endTime).length;
    const completedSessions = jobSessions.filter(s => s.endTime).length;

    // Calculate equipment breakdown by type
    const equipmentBreakdown: Record<string, number> = {};
    equipmentUsed.forEach(equipmentId => {
      const equipment = inventoryData.individualEquipment.find(
        eq => eq.id === equipmentId || eq.equipmentId === equipmentId
      );
      if (equipment) {
        const type = inventoryData.equipmentTypes.find(t => t.id === equipment.typeId);
        const category = type?.category || 'other';
        equipmentBreakdown[category] = (equipmentBreakdown[category] || 0) + 1;
      }
    });

    return {
      jobId,
      jobName: job.name || `Job ${jobId}`,
      equipmentCount: equipmentUsed.length,
      totalHours,
      activeSessions,
      completedSessions,
      equipmentBreakdown,
      startDate: Math.min(...jobSessions.map(s => s.startTime.getTime())),
      endDate: completedSessions > 0 
        ? Math.max(...jobSessions.filter(s => s.endTime).map(s => s.endTime!.getTime()))
        : null
    };
  }, [jobs, usageSessions, inventoryData, calculateHours]);

  // Get detailed equipment statistics
  const getEquipmentStats = useCallback((equipmentId: string): EquipmentUsageStats | null => {
    const equipment = inventoryData.individualEquipment.find(
      eq => eq.id === equipmentId || eq.equipmentId === equipmentId
    );
    
    if (!equipment) return null;

    const equipmentSessions = usageSessions.filter(s => s.equipmentId === equipmentId);
    
    if (equipmentSessions.length === 0) return null;

    const totalHours = equipmentSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + session.totalHours;
      } else {
        return sum + calculateHours(session.startTime);
      }
    }, 0);

    const deploymentSessions = equipmentSessions.filter(s => s.sessionType === 'deployment');
    const maintenanceSessions = equipmentSessions.filter(s => s.sessionType === 'maintenance');
    
    // Calculate usage by job
    const jobUsage: Record<string, { jobName: string; hours: number; sessions: number }> = {};
    equipmentSessions.forEach(session => {
      if (!jobUsage[session.jobId]) {
        jobUsage[session.jobId] = {
          jobName: session.jobName,
          hours: 0,
          sessions: 0
        };
      }
      
      const sessionHours = session.endTime 
        ? session.totalHours 
        : calculateHours(session.startTime);
      
      jobUsage[session.jobId].hours += sessionHours;
      jobUsage[session.jobId].sessions += 1;
    });

    // Calculate average session length
    const completedSessions = equipmentSessions.filter(s => s.endTime);
    const averageSessionHours = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.totalHours, 0) / completedSessions.length
      : 0;

    return {
      equipmentId,
      equipmentName: equipment.name,
      totalHours,
      totalSessions: equipmentSessions.length,
      deploymentHours: deploymentSessions.reduce((sum, s) => 
        sum + (s.endTime ? s.totalHours : calculateHours(s.startTime)), 0
      ),
      maintenanceHours: maintenanceSessions.reduce((sum, s) => 
        sum + (s.endTime ? s.totalHours : calculateHours(s.startTime)), 0
      ),
      averageSessionHours,
      jobUsage,
      currentStatus: equipment.status,
      isCurrentlyInUse: equipmentSessions.some(s => !s.endTime),
      lastUsed: Math.max(...equipmentSessions.map(s => s.startTime.getTime())),
      utilizationRate: totalHours > 0 ? Math.round((deploymentSessions.length / equipmentSessions.length) * 100) : 0
    };
  }, [inventoryData, usageSessions, calculateHours]);

  // Get equipment performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const allEquipmentIds = Array.from(new Set(usageSessions.map(s => s.equipmentId)));
    
    const metrics = allEquipmentIds.map(equipmentId => {
      const stats = getEquipmentStats(equipmentId);
      return stats ? {
        equipmentId,
        name: stats.equipmentName,
        totalHours: stats.totalHours,
        utilizationRate: stats.utilizationRate,
        sessionCount: stats.totalSessions
      } : null;
    }).filter(Boolean);

    return {
      totalEquipment: allEquipmentIds.length,
      totalHours: metrics.reduce((sum, m) => sum + (m?.totalHours || 0), 0),
      averageUtilization: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m?.utilizationRate || 0), 0) / metrics.length
        : 0,
      mostUsedEquipment: metrics.sort((a, b) => (b?.totalHours || 0) - (a?.totalHours || 0)).slice(0, 5),
      leastUsedEquipment: metrics.sort((a, b) => (a?.totalHours || 0) - (b?.totalHours || 0)).slice(0, 5)
    };
  }, [usageSessions, getEquipmentStats]);

  return {
    // Lifecycle analysis
    getEquipmentLifecycle,
    
    // Job statistics
    getJobUsageStats,
    
    // Equipment statistics
    getEquipmentStats,
    
    // Performance metrics
    getPerformanceMetrics,
    
    // Utilities
    calculateHours
  };
};