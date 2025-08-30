import { turso } from '@/utils/consolidated/databaseUtils';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge } from '@xyflow/react';
import edgeSync from '@/services/edgeFunctionSync';

// Type definition for job photo input
interface JobPhotoInput {
  id?: string;
  job_id: string;
  section_label: string;
  photo_url: string;
  caption?: string;
  sort_order?: number;
}

export class JobService {
  // Helper to parse JSON fields
  private parseJson(value: unknown) {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  // Helper to stringify JSON fields
  private stringifyJson(value: unknown) {
    if (!value) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  // ==== JOBS ====
  async getJobs() {
    const result = await turso.execute('SELECT * FROM jobs ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      has_wellside_gauge: Boolean(row.has_wellside_gauge),
      equipment_allocated: Boolean(row.equipment_allocated),
      nodes: this.parseJson(row.nodes) || [],
      edges: this.parseJson(row.edges) || [],
      company_computer_names: this.parseJson(row.company_computer_names) || {},
      equipment_assignment: this.parseJson(row.equipment_assignment) || {},
      enhanced_config: this.parseJson(row.enhanced_config) || {},
      photos: this.parseJson(row.photos) || [],
      status: row.status || 'pending',
      start_date: row.start_date || null,
      end_date: row.end_date || null
    }));
  }

  async createJob(job: Partial<{ id: string; name: string; client: string; well_count: number; has_wellside_gauge: boolean; nodes: Node[]; edges: Edge[]; company_computer_names: Record<string, string>; equipment_assignment: Record<string, unknown>; equipment_allocated: boolean; main_box_name: string; satellite_name: string; wellside_gauge_name: string; selected_cable_type: string; frac_baud_rate: string; gauge_baud_rate: string; frac_com_port: string; gauge_com_port: string; enhanced_config: Record<string, unknown>; photos: unknown[]; status: string; start_date: string; end_date: string }> & { name: string }) {
    const id = job.id || uuidv4();
    
    // Check for duplicate job names
    const existing = await turso.execute({
      sql: 'SELECT id FROM jobs WHERE name = ? AND id != ?',
      args: [job.name, id]
    });
    
    if (existing.rows.length > 0) {
      // Update existing job instead
      return this.updateJob(existing.rows[0].id as string, job);
    }
    
    await turso.execute({
      sql: `INSERT INTO jobs 
            (id, name, client, well_count, has_wellside_gauge, nodes, edges, 
             company_computer_names, equipment_assignment, equipment_allocated,
             main_box_name, satellite_name, wellside_gauge_name, 
             selected_cable_type, frac_baud_rate, gauge_baud_rate, 
             frac_com_port, gauge_com_port, enhanced_config, photos,
             status, start_date, end_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        job.name,
        job.client || null,
        job.wellCount || job.well_count || 0,
        job.hasWellsideGauge || job.has_wellside_gauge || false,
        this.stringifyJson(job.nodes),
        this.stringifyJson(job.edges),
        this.stringifyJson(job.companyComputerNames || job.company_computer_names),
        this.stringifyJson(job.equipmentAssignment || job.equipment_assignment),
        job.equipmentAllocated || job.equipment_allocated || false,
        job.mainBoxName || job.main_box_name || null,
        job.satelliteName || job.satellite_name || null,
        job.wellsideGaugeName || job.wellside_gauge_name || null,
        job.selectedCableType || job.selected_cable_type || 'default_cable',
        job.fracBaudRate || job.frac_baud_rate || 'RS485-19200',
        job.gaugeBaudRate || job.gauge_baud_rate || 'RS232-38400',
        job.fracComPort || job.frac_com_port || 'COM1',
        job.gaugeComPort || job.gauge_com_port || 'COM2',
        this.stringifyJson(job.enhancedConfig || job.enhanced_config),
        this.stringifyJson(job.photos),
        job.status || 'pending',
        job.start_date || job.startDate || null,
        job.end_date || job.endDate || null
      ]
    });
    
    // Sync to edge functions if enabled
    if (edgeSync.isEnabled()) {
      try {
        await edgeSync.jobs.save({
          id,
          name: job.name,
          client: job.client || '',
          location: job.location || '',
          wellCount: job.well_count || 1,
          hasWellsideGauge: Boolean(job.has_wellside_gauge),
          status: job.status || 'pending',
          diagramData: {
            nodes: job.nodes || [],
            edges: job.edges || []
          }
        });
        console.log(`New job ${id} synced to edge functions`);
      } catch (syncError) {
        console.error('Edge sync failed, adding to queue:', syncError);
        edgeSync.queue.add({
          type: 'job',
          action: 'create',
          data: { id, ...job }
        });
      }
    }
    
    return { ...job, id };
  }

  async updateJob(id: string, updates: Partial<{ name: string; client: string; pad: string; well_count: number; has_wellside_gauge: boolean; nodes: Node[]; edges: Edge[]; company_computer_names: Record<string, string>; equipment_assignment: Record<string, unknown>; equipment_allocated: boolean; main_box_name: string; satellite_name: string; wellside_gauge_name: string; selected_cable_type: string; frac_baud_rate: string; gauge_baud_rate: string; frac_com_port: string; gauge_com_port: string; enhanced_config: Record<string, unknown>; photos: unknown[]; status: string; start_date: string; end_date: string }>) {
    // Get the current job data first
    const currentJob = await this.getJobById(id);
    if (!currentJob) {
      throw new Error(`Job with id ${id} not found`);
    }
    
    // Build the update query dynamically based on provided fields
    const updateFields: string[] = [];
    const args: unknown[] = [];
    
    // Only update fields that are actually provided in updates
    if ('name' in updates) {
      updateFields.push('name = ?');
      args.push(updates.name);
    }
    if ('client' in updates) {
      updateFields.push('client = ?');
      args.push(updates.client || null);
    }
    if ('wellCount' in updates || 'well_count' in updates) {
      updateFields.push('well_count = ?');
      args.push(updates.wellCount || updates.well_count || 0);
    }
    if ('hasWellsideGauge' in updates || 'has_wellside_gauge' in updates) {
      updateFields.push('has_wellside_gauge = ?');
      args.push(updates.hasWellsideGauge || updates.has_wellside_gauge || false);
    }
    if ('nodes' in updates) {
      updateFields.push('nodes = ?');
      args.push(this.stringifyJson(updates.nodes));
      console.log('Updating nodes with equipment data:', updates.nodes?.filter(n => n.data?.equipmentId));
    }
    if ('edges' in updates) {
      updateFields.push('edges = ?');
      args.push(this.stringifyJson(updates.edges));
    }
    if ('companyComputerNames' in updates || 'company_computer_names' in updates) {
      updateFields.push('company_computer_names = ?');
      args.push(this.stringifyJson(updates.companyComputerNames || updates.company_computer_names));
    }
    if ('equipmentAssignment' in updates || 'equipment_assignment' in updates) {
      updateFields.push('equipment_assignment = ?');
      args.push(this.stringifyJson(updates.equipmentAssignment || updates.equipment_assignment));
    }
    if ('equipmentAllocated' in updates || 'equipment_allocated' in updates) {
      updateFields.push('equipment_allocated = ?');
      args.push(updates.equipmentAllocated || updates.equipment_allocated || false);
    }
    if ('mainBoxName' in updates || 'main_box_name' in updates) {
      updateFields.push('main_box_name = ?');
      args.push(updates.mainBoxName || updates.main_box_name || null);
    }
    if ('satelliteName' in updates || 'satellite_name' in updates) {
      updateFields.push('satellite_name = ?');
      args.push(updates.satelliteName || updates.satellite_name || null);
    }
    if ('wellsideGaugeName' in updates || 'wellside_gauge_name' in updates) {
      updateFields.push('wellside_gauge_name = ?');
      args.push(updates.wellsideGaugeName || updates.wellside_gauge_name || null);
    }
    if ('selectedCableType' in updates || 'selected_cable_type' in updates) {
      updateFields.push('selected_cable_type = ?');
      args.push(updates.selectedCableType || updates.selected_cable_type || 'default_cable');
    }
    if ('fracBaudRate' in updates || 'frac_baud_rate' in updates) {
      updateFields.push('frac_baud_rate = ?');
      args.push(updates.fracBaudRate || updates.frac_baud_rate || 'RS485-19200');
    }
    if ('gaugeBaudRate' in updates || 'gauge_baud_rate' in updates) {
      updateFields.push('gauge_baud_rate = ?');
      args.push(updates.gaugeBaudRate || updates.gauge_baud_rate || 'RS232-38400');
    }
    if ('fracComPort' in updates || 'frac_com_port' in updates) {
      updateFields.push('frac_com_port = ?');
      args.push(updates.fracComPort || updates.frac_com_port || 'COM1');
    }
    if ('gaugeComPort' in updates || 'gauge_com_port' in updates) {
      updateFields.push('gauge_com_port = ?');
      args.push(updates.gaugeComPort || updates.gauge_com_port || 'COM2');
    }
    if ('enhancedConfig' in updates || 'enhanced_config' in updates) {
      updateFields.push('enhanced_config = ?');
      args.push(this.stringifyJson(updates.enhancedConfig || updates.enhanced_config));
    }
    if ('photos' in updates) {
      updateFields.push('photos = ?');
      args.push(this.stringifyJson(updates.photos));
    }
    if ('status' in updates) {
      updateFields.push('status = ?');
      args.push(updates.status || 'pending');
    }
    if ('start_date' in updates || 'startDate' in updates) {
      updateFields.push('start_date = ?');
      args.push(updates.start_date || updates.startDate || null);
    }
    if ('end_date' in updates || 'endDate' in updates) {
      updateFields.push('end_date = ?');
      args.push(updates.end_date || updates.endDate || null);
    }
    
    // Always update the timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add the id at the end for the WHERE clause
    args.push(id);
    
    if (updateFields.length === 1) { // Only timestamp update
      console.log('No fields to update for job:', id);
      return currentJob;
    }
    
    const sql = `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('Executing job update:', { id, fieldsCount: updateFields.length });
    
    await turso.execute({ sql, args });
    
    // Sync to edge functions if enabled
    if (edgeSync.isEnabled()) {
      try {
        const jobData = await this.getJobById(id);
        if (jobData) {
          await edgeSync.jobs.save({
            id: jobData.id as string,
            name: jobData.name as string,
            client: jobData.client as string,
            location: jobData.location as string,
            wellCount: jobData.well_count as number,
            hasWellsideGauge: Boolean(jobData.has_wellside_gauge),
            status: jobData.status as string,
            diagramData: {
              nodes: jobData.nodes,
              edges: jobData.edges
            }
          });
          console.log(`Job ${id} synced to edge functions`);
        }
      } catch (syncError) {
        console.error('Edge sync failed, adding to queue:', syncError);
        edgeSync.queue.add({
          type: 'job',
          action: 'update',
          data: { id, ...updates }
        });
      }
    }
    
    return this.getJobById(id);
  }

  async deleteJob(id: string) {
    await turso.execute({
      sql: 'DELETE FROM jobs WHERE id = ?',
      args: [id]
    });
    
    // Sync deletion to edge functions if enabled
    if (edgeSync.isEnabled()) {
      try {
        await edgeSync.jobs.delete(id);
        console.log(`Job ${id} deletion synced to edge functions`);
      } catch (syncError) {
        console.error('Edge sync failed, adding to queue:', syncError);
        edgeSync.queue.add({
          type: 'job',
          action: 'delete',
          data: { id }
        });
      }
    }
  }

  async getJobById(id: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM jobs WHERE id = ?',
      args: [id]
    });
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      has_wellside_gauge: Boolean(row.has_wellside_gauge),
      equipment_allocated: Boolean(row.equipment_allocated),
      nodes: this.parseJson(row.nodes) || [],
      edges: this.parseJson(row.edges) || [],
      company_computer_names: this.parseJson(row.company_computer_names) || {},
      equipment_assignment: this.parseJson(row.equipment_assignment) || {},
      enhanced_config: this.parseJson(row.enhanced_config) || {},
      photos: this.parseJson(row.photos) || [],
      status: row.status || 'pending',
      start_date: row.start_date || null,
      end_date: row.end_date || null
    };
  }

  // Alias for compatibility
  async getJob(id: string) {
    return this.getJobById(id);
  }

  // ==== JOB PHOTOS ====
  async getJobPhotos(jobId: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM job_photos WHERE job_id = ? ORDER BY section_label, sort_order',
      args: [jobId]
    });
    return result.rows;
  }

  async createJobPhoto(photo: JobPhotoInput) {
    const id = photo.id || uuidv4();
    await turso.execute({
      sql: `INSERT INTO job_photos 
            (id, job_id, section_label, photo_url, caption, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        photo.job_id || photo.jobId,
        photo.section_label || photo.sectionLabel,
        photo.photo_url || photo.photoUrl,
        photo.caption || null,
        photo.sort_order || photo.sortOrder || 0
      ]
    });
    return { ...photo, id };
  }

  async deleteJobPhoto(id: string) {
    await turso.execute({
      sql: 'DELETE FROM job_photos WHERE id = ?',
      args: [id]
    });
  }

  async updateJobEquipment(jobId: string, equipment: Record<string, unknown>) {
    // Update job with equipment assignment
    const job = await this.getJobById(jobId);
    if (job) {
      await this.updateJob(jobId, {
        ...job,
        equipment_assignment: equipment,
        equipment_allocated: true
      });
    }
  }
}

// Lazy singleton instance
let jobServiceInstance: JobService | null = null;

export function getJobService(): JobService {
  if (!jobServiceInstance) {
    jobServiceInstance = new JobService();
  }
  return jobServiceInstance;
}