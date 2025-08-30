import { useState, useEffect, useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobs } from '@/hooks/useJobs';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import type { 
  EquipmentUsageSession, 
  EquipmentLifecycle, 
  JobEquipmentUsage,
  RedTagEvent,
  EquipmentUsageStats 
} from '@/types/equipment-usage';

export const useEquipmentUsageTracking = () => {
  const { data: inventoryData } = useInventory();
  const { jobs } = useJobs();
  const [usageSessions, setUsageSessions] = useState<EquipmentUsageSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate hours between two dates
  const calculateHours = (start: Date | string, end?: Date | string | null): number => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = end ? (typeof end === 'string' ? new Date(end) : end) : new Date();
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.round(hours * 10) / 10); // Round to 1 decimal place
  };

  // Load usage sessions from localStorage (temporary storage)
  useEffect(() => {
    const stored = localStorage.getItem('equipment-usage-sessions');
    if (stored) {
      try {
        const sessions = JSON.parse(stored);
        setUsageSessions(sessions.map((s: Omit<EquipmentUsageSession, 'startTime' | 'endTime'> & { startTime: string; endTime?: string }) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        })));
      } catch (error) {
        console.error('Failed to parse stored usage sessions:', error);
      }
    }
  }, []);

  // Save usage sessions to localStorage
  const saveUsageSessions = useCallback((sessions: EquipmentUsageSession[]) => {
    localStorage.setItem('equipment-usage-sessions', JSON.stringify(sessions));
    setUsageSessions(sessions);
  }, []);

  // Start tracking equipment usage when deployed to a job
  const startUsageSession = useCallback(async (
    equipmentId: string, 
    jobId: string,
    startTime?: Date
  ) => {
    const job = jobs.find(j => j.id === jobId);
    const equipment = inventoryData.individualEquipment.find(e => e.id === equipmentId);
    
    if (!job || !equipment) {
      toast({
        title: "Error",
        description: "Equipment or job not found",
        variant: "destructive"
      });
      return;
    }

    const session: EquipmentUsageSession = {
      id: `session-${Date.now()}`,
      equipmentId: equipment.id,
      jobId: job.id,
      jobName: job.name,
      startTime: startTime || new Date(),
      hoursUsed: 0,
      status: 'active',
      notes: `Deployed to ${job.name}`
    };

    const newSessions = [...usageSessions, session];
    saveUsageSessions(newSessions);

    toast({
      title: "Usage Tracking Started",
      description: `Started tracking ${equipment.equipmentId} on ${job.name}`,
    });

    return session;
  }, [jobs, inventoryData, usageSessions, saveUsageSessions]);

  // End usage session when equipment is returned
  const endUsageSession = useCallback(async (
    equipmentId: string,
    endTime?: Date,
    notes?: string
  ) => {
    const activeSession = usageSessions.find(
      s => s.equipmentId === equipmentId && s.status === 'active'
    );

    if (!activeSession) {
      return null;
    }

    const end = endTime || new Date();
    const hoursUsed = calculateHours(activeSession.startTime, end);

    const updatedSession: EquipmentUsageSession = {
      ...activeSession,
      endTime: end,
      hoursUsed,
      status: 'completed',
      notes: notes || activeSession.notes
    };

    const newSessions = usageSessions.map(s => 
      s.id === activeSession.id ? updatedSession : s
    );
    saveUsageSessions(newSessions);

    toast({
      title: "Usage Session Ended",
      description: `Equipment used for ${hoursUsed} hours`,
    });

    return updatedSession;
  }, [usageSessions, saveUsageSessions]);

  // Get total usage hours for an equipment
  const getEquipmentTotalHours = useCallback((equipmentId: string): number => {
    const sessions = usageSessions.filter(s => s.equipmentId === equipmentId);
    
    return sessions.reduce((total, session) => {
      if (session.status === 'completed') {
        return total + session.hoursUsed;
      } else if (session.status === 'active') {
        // Calculate current hours for active sessions
        return total + calculateHours(session.startTime);
      }
      return total;
    }, 0);
  }, [usageSessions]);

  // Get equipment lifecycle data
  const getEquipmentLifecycle = useCallback((equipmentId: string): EquipmentLifecycle | null => {
    const equipment = inventoryData.individualEquipment.find(e => e.id === equipmentId);
    if (!equipment) return null;

    const equipmentSessions = usageSessions.filter(s => s.equipmentId === equipmentId);
    const totalHours = getEquipmentTotalHours(equipmentId);
    const uniqueJobs = new Set(equipmentSessions.map(s => s.jobId)).size;

    const sortedSessions = [...equipmentSessions].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      typeId: equipment.typeId,
      purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate) : undefined,
      firstUseDate: sortedSessions[0]?.startTime,
      lastUseDate: sortedSessions[sortedSessions.length - 1]?.endTime || 
                   sortedSessions[sortedSessions.length - 1]?.startTime,
      totalHoursUsed: totalHours,
      totalJobsUsed: uniqueJobs,
      currentStatus: equipment.status,
      redTaggedDate: equipment.status === 'red-tagged' ? new Date(equipment.lastUpdated) : undefined,
      maintenanceHistory: [], // Would need separate tracking
      usageSessions: equipmentSessions
    };
  }, [inventoryData, usageSessions, getEquipmentTotalHours]);

  // Get usage statistics for a job
  const getJobUsageStats = useCallback((jobId: string): JobEquipmentUsage | null => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    const jobSessions = usageSessions.filter(s => s.jobId === jobId);
    const equipmentMap = new Map<string, { 
      equipmentId: string; 
      equipmentName: string; 
      type: string; 
      hoursUsed: number; 
      status: string; 
    }>();

    jobSessions.forEach(session => {
      const equipment = inventoryData.individualEquipment.find(e => e.id === session.equipmentId);
      if (!equipment) return;

      if (!equipmentMap.has(session.equipmentId)) {
        equipmentMap.set(session.equipmentId, {
          equipmentId: session.equipmentId,
          equipmentName: equipment.name,
          type: inventoryData.equipmentTypes.find(t => t.id === equipment.typeId)?.name || 'Unknown',
          hoursUsed: 0,
          status: session.status === 'active' ? 'active' : 'returned'
        });
      }

      const current = equipmentMap.get(session.equipmentId);
      current.hoursUsed += session.status === 'completed' 
        ? session.hoursUsed 
        : calculateHours(session.startTime);
    });

    const startDate = job.start_date ? new Date(job.start_date) : new Date();
    const endDate = job.end_date ? new Date(job.end_date) : undefined;
    const totalHours = endDate ? calculateHours(startDate, endDate) : calculateHours(startDate);

    return {
      jobId: job.id,
      jobName: job.name,
      startDate,
      endDate,
      totalHours,
      equipment: Array.from(equipmentMap.values())
    };
  }, [jobs, inventoryData, usageSessions]);

  // Calculate equipment usage statistics
  const getEquipmentStats = useCallback((equipmentId: string): EquipmentUsageStats | null => {
    const equipment = inventoryData.individualEquipment.find(e => e.id === equipmentId);
    if (!equipment) return null;

    const sessions = usageSessions.filter(s => s.equipmentId === equipmentId);
    if (sessions.length === 0) {
      return {
        equipmentId,
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        peakUsagePeriod: { start: new Date(), end: new Date(), hours: 0 },
        utilizationRate: 0,
        availability: 100
      };
    }

    // Calculate time spans
    const sortedSessions = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const firstUse = sortedSessions[0].startTime;
    const lastUse = sortedSessions[sortedSessions.length - 1].endTime || new Date();
    const totalDays = Math.max(1, calculateHours(firstUse, lastUse) / 24);

    const totalHours = getEquipmentTotalHours(equipmentId);
    
    // Find peak usage period (consecutive sessions)
    let peakHours = 0;
    let peakStart = firstUse;
    let peakEnd = firstUse;

    sessions.forEach(session => {
      const hours = session.status === 'completed' 
        ? session.hoursUsed 
        : calculateHours(session.startTime);
      
      if (hours > peakHours) {
        peakHours = hours;
        peakStart = session.startTime;
        peakEnd = session.endTime || new Date();
      }
    });

    // Calculate utilization (hours used / total available hours)
    const totalAvailableHours = totalDays * 24;
    const utilizationRate = (totalHours / totalAvailableHours) * 100;

    // Calculate availability (time not in maintenance or red-tagged)
    const maintenanceHours = equipment.status === 'maintenance' 
      ? calculateHours(equipment.lastUpdated) 
      : 0;
    const availability = ((totalAvailableHours - maintenanceHours) / totalAvailableHours) * 100;

    return {
      equipmentId,
      dailyAverage: totalHours / totalDays,
      weeklyAverage: (totalHours / totalDays) * 7,
      monthlyAverage: (totalHours / totalDays) * 30,
      peakUsagePeriod: {
        start: peakStart,
        end: peakEnd,
        hours: peakHours
      },
      utilizationRate: Math.min(100, Math.round(utilizationRate * 10) / 10),
      availability: Math.min(100, Math.round(availability * 10) / 10)
    };
  }, [inventoryData, usageSessions, getEquipmentTotalHours]);

  // Track red tag event
  const createRedTagEvent = useCallback(async (
    equipmentId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    taggedBy: string = 'System'
  ) => {
    const equipment = inventoryData.individualEquipment.find(e => e.id === equipmentId);
    if (!equipment) return null;

    // End any active usage session
    await endUsageSession(equipmentId, new Date(), `Red tagged: ${reason}`);

    const totalHours = getEquipmentTotalHours(equipmentId);
    const activeSession = usageSessions.find(
      s => s.equipmentId === equipmentId && s.status === 'active'
    );

    const redTagEvent: RedTagEvent = {
      id: `redtag-${Date.now()}`,
      equipmentId,
      taggedDate: new Date(),
      taggedBy,
      reason,
      severity,
      hoursAtFailure: totalHours,
      jobIdAtFailure: activeSession?.jobId
    };

    // Store red tag events
    const storedEvents = localStorage.getItem('red-tag-events');
    const events = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(redTagEvent);
    localStorage.setItem('red-tag-events', JSON.stringify(events));

    // Update equipment status
    await tursoDb.updateIndividualEquipment(equipmentId, {
      status: 'red-tagged',
      notes: `Red Tagged: ${reason} (${severity} severity)`
    });

    toast({
      title: "Equipment Red Tagged",
      description: `${equipment.equipmentId} marked as red-tagged after ${totalHours} hours of use`,
      variant: "destructive"
    });

    return redTagEvent;
  }, [inventoryData, usageSessions, endUsageSession, getEquipmentTotalHours]);

  // Get all red tag events
  const getRedTagEvents = useCallback((): RedTagEvent[] => {
    const stored = localStorage.getItem('red-tag-events');
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((e: unknown) => ({
        ...e,
        taggedDate: new Date(e.taggedDate),
        resolvedDate: e.resolvedDate ? new Date(e.resolvedDate) : undefined
      }));
    } catch {
      return [];
    }
  }, []);

  return {
    usageSessions,
    startUsageSession,
    endUsageSession,
    getEquipmentTotalHours,
    getEquipmentLifecycle,
    getJobUsageStats,
    getEquipmentStats,
    createRedTagEvent,
    getRedTagEvents,
    calculateHours,
    isLoading
  };
};