
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface StoredJob {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
  lastUpdated: Date;
  status: 'active' | 'completed' | 'archived';
  equipmentAllocated: boolean;
  sourceLocationId?: string;
}

export const useJobStorage = () => {
  const [jobs, setJobs] = useState<StoredJob[]>([]);

  const loadJobs = () => {
    try {
      const stored = localStorage.getItem('stored-jobs');
      if (stored) {
        const parsedJobs = JSON.parse(stored) as Array<Record<string, unknown>>;
        const jobsWithDates = parsedJobs.map((job) => ({
          ...job,
          createdAt: new Date(job.createdAt as string),
          lastUpdated: new Date(job.lastUpdated as string),
        }));
        setJobs(jobsWithDates);
        return jobsWithDates;
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
    return [];
  };

  const saveJobs = (jobsToSave: StoredJob[]) => {
    try {
      localStorage.setItem('stored-jobs', JSON.stringify(jobsToSave));
    } catch (error) {
      console.error('Failed to save jobs:', error);
      toast.error('Failed to save jobs');
    }
  };

  const addJob = (job: Omit<StoredJob, 'createdAt' | 'lastUpdated' | 'status' | 'equipmentAllocated'>) => {
    const newJob: StoredJob = {
      ...job,
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: 'active',
      equipmentAllocated: false,
    };
    
    const updatedJobs = [...jobs, newJob];
    setJobs(updatedJobs);
    saveJobs(updatedJobs);
    return newJob;
  };

  const updateJob = (jobId: string, updates: Partial<StoredJob>) => {
    const updatedJobs = jobs.map(job => 
      job.id === jobId 
        ? { ...job, ...updates, lastUpdated: new Date() }
        : job
    );
    setJobs(updatedJobs);
    saveJobs(updatedJobs);
  };

  const deleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    saveJobs(updatedJobs);
  };

  const getActiveJobs = () => jobs.filter(job => job.status === 'active');

  useEffect(() => {
    loadJobs();
  }, []);

  return {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    getActiveJobs,
    loadJobs,
  };
};
