import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tursoDb } from '@/services/tursoDb';
import { saveLock } from '@/utils/saveLock';
import type { Node, Edge } from '@xyflow/react';

export interface JobDiagram {
  id: string;
  name: string;
  client?: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  nodes: Node[];
  edges: Edge[];
  companyComputerNames: Record<string, string>;
  equipmentAssignment: Record<string, unknown>;
  equipmentAllocated: boolean;
  mainBoxName?: string;
  satelliteName?: string;
  wellsideGaugeName?: string;
  selectedCableType?: string;
  fracBaudRate?: string;
  gaugeBaudRate?: string;
  fracComPort?: string;
  gaugeComPort?: string;
  enhancedConfig?: Record<string, unknown>;
  status?: 'pending' | 'active' | 'completed';
  start_date?: string | null;
  end_date?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Throttle success toasts to prevent spam
let lastToastTime = 0;

export const useJobs = () => {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    enabled: false, // DISABLED - Manual load only to prevent request storm
    queryFn: async () => {
      const data = await tursoDb.getJobs();
      return (data || []).map(job => ({
        id: job.id || job.cloudId,
        name: job.name,
        client: job.client || '',
        wellCount: job.wellCount || job.well_count || 0,
        hasWellsideGauge: job.hasWellsideGauge || job.has_wellside_gauge || false,
        nodes: job.nodes || [],
        edges: job.edges || [],
        companyComputerNames: job.companyComputerNames || job.company_computer_names || {},
        equipmentAssignment: job.equipmentAssignment || job.equipment_assignment || {},
        equipmentAllocated: job.equipmentAllocated || job.equipment_allocated || false,
        mainBoxName: job.mainBoxName || job.main_box_name || '',
        satelliteName: job.satelliteName || job.satellite_name || '',
        wellsideGaugeName: job.wellsideGaugeName || job.wellside_gauge_name || '',
        selectedCableType: job.selectedCableType || job.selected_cable_type || 'default_cable',
        fracBaudRate: job.fracBaudRate || job.frac_baud_rate || 'RS485-19200',
        gaugeBaudRate: job.gaugeBaudRate || job.gauge_baud_rate || 'RS232-38400',
        fracComPort: job.fracComPort || job.frac_com_port || 'COM1',
        gaugeComPort: job.gaugeComPort || job.gauge_com_port || 'COM2',
        enhancedConfig: job.enhancedConfig || job.enhanced_config || {
          fracChartConfig: {},
          flowmeterConfig: [],
          pumperConfig: [],
          wellheadGaugeConfig: {},
          wellheadModbusMonitoringConfig: {},
        },
        status: job.status || 'pending',
        start_date: job.start_date || null,
        end_date: job.end_date || null,
        createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        updatedAt: job.updatedAt ? new Date(job.updatedAt) : new Date(),
      })) as JobDiagram[];
    },
  });

  const saveJobMutation = useMutation({
    mutationFn: async (jobData: Partial<JobDiagram>) => {
      // Use save lock to prevent concurrent saves
      const lockId = jobData.id || 'new-job';
      
      return await saveLock.withLock(lockId, async () => {
        // Prevent creating jobs without an ID
        if (!jobData.id) {
          jobData.id = crypto.randomUUID();
        }
        
        // Check for existing job by ID or name
        const existingJobs = await tursoDb.getJobs();
        const existingJob = existingJobs.find(j => 
          j.id === jobData.id || 
          j.cloudId === jobData.id ||
          (j.name === jobData.name && jobData.name !== 'Untitled Job')
        );
        
        if (existingJob) {
          console.log('Updating existing job:', existingJob.id, jobData.name);
          return await tursoDb.updateJob(existingJob.id || existingJob.cloudId, jobData);
        } else {
          console.log('Creating new job:', jobData.id, jobData.name);
          return await tursoDb.createJob(jobData);
        }
      }) || null; // Return null if lock couldn't be acquired
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      
      // Throttle success toasts to prevent spam (max one every 3 seconds)
      const now = Date.now();
      if (now - lastToastTime > 3000) {
        toast.success('Job saved successfully');
        lastToastTime = now;
      }
    },
    onError: (error) => {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await tursoDb.deleteJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  });

  const saveJob = (jobData: Partial<JobDiagram>) => {
    saveJobMutation.mutate(jobData);
  };

  const deleteJob = (jobId: string) => {
    deleteJobMutation.mutate(jobId);
  };

  const getJobById = (jobId: string): JobDiagram | undefined => {
    return jobs.find(job => job.id === jobId);
  };

  return {
    jobs,
    isLoading,
    saveJob,
    deleteJob,
    getJobById,
  };
};