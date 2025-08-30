import { useState, useEffect, useCallback } from 'react';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import type { RedTagEvent } from '@/types/equipment-usage';

/**
 * Focused manager for equipment red-tagging functionality
 * Extracted from useEquipmentUsageTracking monolith
 */
export const useEquipmentRedTagManager = () => {
  const [redTagEvents, setRedTagEvents] = useState<RedTagEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load red tag events from localStorage (temporary storage)
  useEffect(() => {
    const stored = localStorage.getItem('equipment-red-tag-events');
    if (stored) {
      try {
        const events = JSON.parse(stored);
        setRedTagEvents(events.map((event: Omit<RedTagEvent, 'eventDate'> & { eventDate: string }) => ({
          ...event,
          eventDate: new Date(event.eventDate)
        })));
      } catch (error) {
        console.error('Failed to parse stored red tag events:', error);
      }
    }
  }, []);

  // Save red tag events to localStorage
  const saveRedTagEvents = useCallback((events: RedTagEvent[]) => {
    localStorage.setItem('equipment-red-tag-events', JSON.stringify(events));
    setRedTagEvents(events);
  }, []);

  // Create a new red tag event
  const createRedTagEvent = useCallback(async (
    equipmentId: string,
    equipmentName: string,
    reason: string,
    description: string,
    reportedBy: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      const newEvent: RedTagEvent = {
        id: `redtag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        equipmentId,
        equipmentName,
        reason,
        description,
        severity,
        reportedBy,
        eventDate: new Date(),
        status: 'active',
        resolved: false
      };

      const updatedEvents = [...redTagEvents, newEvent];
      saveRedTagEvents(updatedEvents);

      // Try to update equipment status in database
      try {
        const result = await tursoDb.updateEquipmentStatus(equipmentId, 'red-tagged');
        if (result.success) {
          console.log(`Updated equipment ${equipmentId} status to red-tagged`);
        }
      } catch (dbError) {
        console.warn('Could not update equipment status in database:', dbError);
        // Continue with localStorage update
      }

      toast({
        title: "Equipment Red Tagged",
        description: `${equipmentName} has been red tagged for: ${reason}`,
        variant: "destructive"
      });

    } catch (error) {
      console.error('Failed to create red tag event:', error);
      toast({
        title: "Error",
        description: "Failed to create red tag event",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [redTagEvents, saveRedTagEvents]);

  // Resolve a red tag event
  const resolveRedTagEvent = useCallback(async (
    eventId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      const updatedEvents = redTagEvents.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            status: 'resolved' as const,
            resolved: true,
            resolvedBy,
            resolvedDate: new Date(),
            resolutionNotes
          };
        }
        return event;
      });

      saveRedTagEvents(updatedEvents);

      // Try to update equipment status back to available
      const event = redTagEvents.find(e => e.id === eventId);
      if (event) {
        try {
          const result = await tursoDb.updateEquipmentStatus(event.equipmentId, 'available');
          if (result.success) {
            console.log(`Updated equipment ${event.equipmentId} status to available`);
          }
        } catch (dbError) {
          console.warn('Could not update equipment status in database:', dbError);
        }

        toast({
          title: "Red Tag Resolved",
          description: `${event.equipmentName} red tag has been resolved`,
        });
      }

    } catch (error) {
      console.error('Failed to resolve red tag event:', error);
      toast({
        title: "Error",
        description: "Failed to resolve red tag event",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [redTagEvents, saveRedTagEvents]);

  // Get red tag events for specific equipment
  const getEquipmentRedTags = useCallback((equipmentId: string): RedTagEvent[] => {
    return redTagEvents.filter(event => event.equipmentId === equipmentId);
  }, [redTagEvents]);

  // Get active red tag events
  const getActiveRedTags = useCallback((): RedTagEvent[] => {
    return redTagEvents.filter(event => event.status === 'active' && !event.resolved);
  }, [redTagEvents]);

  // Get red tag events by severity
  const getRedTagsBySeverity = useCallback((severity: 'low' | 'medium' | 'high' | 'critical'): RedTagEvent[] => {
    return redTagEvents.filter(event => event.severity === severity);
  }, [redTagEvents]);

  // Check if equipment is red tagged
  const isEquipmentRedTagged = useCallback((equipmentId: string): boolean => {
    return redTagEvents.some(event => 
      event.equipmentId === equipmentId && 
      event.status === 'active' && 
      !event.resolved
    );
  }, [redTagEvents]);

  // Get red tag statistics
  const getRedTagStats = useCallback(() => {
    const total = redTagEvents.length;
    const active = redTagEvents.filter(e => e.status === 'active').length;
    const resolved = redTagEvents.filter(e => e.resolved).length;
    const critical = redTagEvents.filter(e => e.severity === 'critical').length;
    const high = redTagEvents.filter(e => e.severity === 'high').length;
    
    return {
      total,
      active,
      resolved,
      critical,
      high,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  }, [redTagEvents]);

  return {
    // State
    redTagEvents,
    isLoading,
    
    // Core operations
    createRedTagEvent,
    resolveRedTagEvent,
    
    // Query functions
    getEquipmentRedTags,
    getActiveRedTags,
    getRedTagsBySeverity,
    isEquipmentRedTagged,
    getRedTagStats
  };
};