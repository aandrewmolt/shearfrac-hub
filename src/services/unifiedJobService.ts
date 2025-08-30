/**
 * Unified Job Service
 * Automatically uses AWS API when configured, falls back to Turso
 */

import { useAwsApi } from '@/config/apiMode';
import { jobService } from './jobService';
import awsApi from './awsApiService';

class UnifiedJobService {
  // Get all jobs
  async getJobs() {
    if (useAwsApi()) {
      try {
        const jobs = await awsApi.jobs.list();
        // Transform AWS response to match Turso format if needed
        return jobs.map(this.transformAwsJob);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        // Fallback to Turso if AWS fails
        return jobService.getJobs();
      }
    }
    return jobService.getJobs();
  }

  // Get single job
  async getJob(id: string) {
    if (useAwsApi()) {
      try {
        const job = await awsApi.jobs.get(id);
        return this.transformAwsJob(job);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.getJob(id);
      }
    }
    return jobService.getJob(id);
  }

  // Create job
  async createJob(job: any) {
    if (useAwsApi()) {
      try {
        const newJob = await awsApi.jobs.create(this.transformToAwsFormat(job));
        return this.transformAwsJob(newJob);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.createJob(job);
      }
    }
    return jobService.createJob(job);
  }

  // Update job
  async updateJob(id: string, updates: any) {
    if (useAwsApi()) {
      try {
        const updated = await awsApi.jobs.update(id, this.transformToAwsFormat(updates));
        return this.transformAwsJob(updated);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.updateJob(id, updates);
      }
    }
    return jobService.updateJob(id, updates);
  }

  // Delete/archive job
  async deleteJob(id: string) {
    if (useAwsApi()) {
      try {
        await awsApi.jobs.delete(id);
        return { success: true };
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.deleteJob(id);
      }
    }
    return jobService.deleteJob(id);
  }

  // Save diagram
  async saveDiagram(jobId: string, nodes: any[], edges: any[]) {
    if (useAwsApi()) {
      try {
        const diagram = await awsApi.jobs.updateDiagram(jobId, { nodes, edges });
        return diagram;
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.saveDiagram(jobId, nodes, edges);
      }
    }
    return jobService.saveDiagram(jobId, nodes, edges);
  }

  // Get job photos
  async getJobPhotos(jobId: string) {
    if (useAwsApi()) {
      try {
        const job = await awsApi.jobs.get(jobId);
        return job.photos || [];
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.getJobPhotos(jobId);
      }
    }
    return jobService.getJobPhotos(jobId);
  }

  // Add job photo
  async addJobPhoto(photo: any) {
    if (useAwsApi()) {
      try {
        const job = await awsApi.jobs.get(photo.job_id);
        const photos = job.photos || [];
        photos.push(photo);
        await awsApi.jobs.update(photo.job_id, { photos });
        return photo;
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return jobService.addJobPhoto(photo);
      }
    }
    return jobService.addJobPhoto(photo);
  }

  // Transform AWS job to Turso format
  private transformAwsJob(awsJob: any) {
    if (!awsJob) return null;
    
    // AWS and Turso formats should be similar, but ensure compatibility
    return {
      ...awsJob,
      // Ensure boolean fields
      has_wellside_gauge: Boolean(awsJob.has_wellside_gauge),
      equipment_allocated: Boolean(awsJob.equipment_allocated),
      // Ensure arrays
      nodes: awsJob.nodes || [],
      edges: awsJob.edges || [],
      photos: awsJob.photos || [],
      // Ensure objects
      company_computer_names: awsJob.company_computer_names || {},
      equipment_assignment: awsJob.equipment_assignment || {},
      enhanced_config: awsJob.enhanced_config || {},
      // Dates
      created_at: awsJob.created_at || new Date().toISOString(),
      updated_at: awsJob.updated_at || new Date().toISOString(),
    };
  }

  // Transform to AWS format
  private transformToAwsFormat(job: any) {
    // Clean up any Turso-specific fields
    const { 
      wellCount, 
      hasWellsideGauge,
      companyComputerNames,
      equipmentAssignment,
      equipmentAllocated,
      mainBoxName,
      satelliteName,
      wellsideGaugeName,
      selectedCableType,
      fracBaudRate,
      gaugeBaudRate,
      fracComPort,
      gaugeComPort,
      enhancedConfig,
      startDate,
      endDate,
      ...rest 
    } = job;

    return {
      ...rest,
      well_count: wellCount || job.well_count || 0,
      has_wellside_gauge: hasWellsideGauge || job.has_wellside_gauge || false,
      company_computer_names: companyComputerNames || job.company_computer_names || {},
      equipment_assignment: equipmentAssignment || job.equipment_assignment || {},
      equipment_allocated: equipmentAllocated || job.equipment_allocated || false,
      main_box_name: mainBoxName || job.main_box_name || null,
      satellite_name: satelliteName || job.satellite_name || null,
      wellside_gauge_name: wellsideGaugeName || job.wellside_gauge_name || null,
      selected_cable_type: selectedCableType || job.selected_cable_type || 'default_cable',
      frac_baud_rate: fracBaudRate || job.frac_baud_rate || 'RS485-19200',
      gauge_baud_rate: gaugeBaudRate || job.gauge_baud_rate || 'RS232-38400',
      frac_com_port: fracComPort || job.frac_com_port || 'COM1',
      gauge_com_port: gaugeComPort || job.gauge_com_port || 'COM2',
      enhanced_config: enhancedConfig || job.enhanced_config || {},
      start_date: startDate || job.start_date || null,
      end_date: endDate || job.end_date || null,
    };
  }
}

// Export singleton instance
export const unifiedJobService = new UnifiedJobService();

// Also export as default
export default unifiedJobService;