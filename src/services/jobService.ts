/**
 * Job Service - Now using AWS API
 * All job operations go through AWS Lambda/DynamoDB
 */

import awsDatabase from './awsDatabase';

export class JobService {
  // Delegate all operations to AWS database
  async getJobs() {
    return awsDatabase.getJobs();
  }

  async getJob(id: string) {
    return awsDatabase.getJob(id);
  }

  async createJob(job: any) {
    return awsDatabase.createJob(job);
  }

  async updateJob(id: string, updates: any) {
    return awsDatabase.updateJob(id, updates);
  }

  async deleteJob(id: string) {
    return awsDatabase.deleteJob(id);
  }

  async saveDiagram(jobId: string, nodes: any[], edges: any[]) {
    return awsDatabase.saveDiagram(jobId, nodes, edges);
  }

  async getJobPhotos(jobId: string) {
    return awsDatabase.getJobPhotos(jobId);
  }

  async addJobPhoto(photo: any) {
    return awsDatabase.addJobPhoto(photo);
  }

  async updateJobPhoto(id: string, updates: any) {
    return awsDatabase.updateJobPhoto(id, updates);
  }

  async deleteJobPhoto(id: string, jobId: string) {
    return awsDatabase.deleteJobPhoto(id, jobId);
  }
}

// Export singleton instance
export const jobService = new JobService();

// Export factory function for compatibility
export function getJobService() {
  return jobService;
}

export default jobService;