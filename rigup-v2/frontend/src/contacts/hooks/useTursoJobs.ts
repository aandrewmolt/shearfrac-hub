import { useState, useEffect } from 'react';
import { tursoDb } from '@/services/tursoDb';

export interface TursoJob {
  id: string;
  name: string;
  client: string;
}

export function useTursoJobs() {
  const [jobs, setJobs] = useState<TursoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const jobsData = await tursoDb.getJobs();
      
      const jobsList = jobsData.map(job => ({
        id: job.id as string,
        name: job.name as string,
        client: job.client as string || '',
      }));
      
      console.log('Loaded jobs in useTursoJobs:', jobsList);
      setJobs(jobsList);
    } catch (err) {
      console.error('Error loading jobs from Turso:', err);
      setError(err instanceof Error ? err : new Error('Failed to load jobs'));
      setJobs([]); // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getJobsByClient = (client: string): string[] => {
    if (!jobs || !Array.isArray(jobs)) return [];
    return jobs
      .filter(job => job.client === client)
      .map(job => job.name);
  };

  const getClients = (): string[] => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const clientSet = new Set(jobs.map(job => job.client).filter(Boolean));
    return clientSet.size > 0 ? [...clientSet].sort() : [];
  };

  const getJobDisplayName = (jobId: string): string => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return jobId;
    return job.client ? `${job.client} - ${job.name}` : job.name;
  };

  return {
    jobs,
    loading,
    error,
    getJobsByClient,
    getClients,
    getJobDisplayName,
    reload: loadJobs,
  };
}