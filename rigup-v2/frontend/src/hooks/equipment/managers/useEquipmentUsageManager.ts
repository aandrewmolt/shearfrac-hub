import { useState, useEffect, useCallback } from 'react';
import type { EquipmentUsageSession } from '@/types/equipment-usage';

/**
 * Focused manager for equipment usage sessions - handles start/stop/tracking
 * Extracted from useEquipmentUsageTracking monolith
 */
export const useEquipmentUsageManager = () => {
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

  // Start a new usage session
  const startUsageSession = useCallback(async (
    equipmentId: string,
    jobId: string,
    jobName: string,
    sessionType: 'deployment' | 'maintenance' | 'testing' = 'deployment',
    notes?: string
  ): Promise<string> => {
    setIsLoading(true);
    
    try {
      // End any existing active session for this equipment
      const currentSessions = [...usageSessions];
      const activeSessionIndex = currentSessions.findIndex(
        s => s.equipmentId === equipmentId && !s.endTime
      );
      
      if (activeSessionIndex !== -1) {
        currentSessions[activeSessionIndex].endTime = new Date();
        console.log(`Auto-ended previous session for equipment ${equipmentId}`);
      }

      // Create new session
      const newSession: EquipmentUsageSession = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        equipmentId,
        jobId,
        jobName,
        startTime: new Date(),
        sessionType,
        notes,
        totalHours: 0
      };

      const updatedSessions = [...currentSessions, newSession];
      saveUsageSessions(updatedSessions);
      
      return newSession.id;
    } catch (error) {
      console.error('Failed to start usage session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [usageSessions, saveUsageSessions]);

  // End a usage session
  const endUsageSession = useCallback(async (
    sessionId: string,
    endNotes?: string
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      const updatedSessions = usageSessions.map(session => {
        if (session.id === sessionId && !session.endTime) {
          const endTime = new Date();
          const totalHours = calculateHours(session.startTime, endTime);
          
          return {
            ...session,
            endTime,
            totalHours,
            endNotes
          };
        }
        return session;
      });

      saveUsageSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to end usage session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [usageSessions, saveUsageSessions, calculateHours]);

  // Get total hours for equipment
  const getEquipmentTotalHours = useCallback((equipmentId: string): number => {
    return usageSessions
      .filter(s => s.equipmentId === equipmentId)
      .reduce((total, session) => {
        if (session.endTime) {
          return total + session.totalHours;
        } else {
          // Calculate current hours for active session
          return total + calculateHours(session.startTime);
        }
      }, 0);
  }, [usageSessions, calculateHours]);

  // Get active session for equipment
  const getActiveSession = useCallback((equipmentId: string): EquipmentUsageSession | null => {
    return usageSessions.find(s => s.equipmentId === equipmentId && !s.endTime) || null;
  }, [usageSessions]);

  // Get all sessions for equipment
  const getEquipmentSessions = useCallback((equipmentId: string): EquipmentUsageSession[] => {
    return usageSessions.filter(s => s.equipmentId === equipmentId);
  }, [usageSessions]);

  return {
    // State
    usageSessions,
    isLoading,
    
    // Core operations
    startUsageSession,
    endUsageSession,
    
    // Query functions
    getEquipmentTotalHours,
    getActiveSession,
    getEquipmentSessions,
    
    // Utilities
    calculateHours
  };
};