import { turso } from '@/utils/consolidated/databaseUtils';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for user service operations
interface ContactCreateInput {
  id?: string;
  type: string;
  name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  company?: string;
  rig?: string;
  job_title?: string;
  location?: string;
  client_name?: string;
  well_name?: string;
  created_by?: string;
  [key: string]: unknown;
}

interface ContactUpdateInput {
  type?: string;
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  company?: string;
  rig?: string;
  job_title?: string;
  location?: string;
  client_name?: string;
  well_name?: string;
  [key: string]: unknown;
}

export class UserService {
  // ==== USERS (Auth) ====
  async getUser(email: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    return result.rows[0] || null;
  }

  async createUser(email: string, name?: string) {
    const id = uuidv4();
    await turso.execute({
      sql: 'INSERT INTO users (id, email, name) VALUES (?, ?, ?)',
      args: [id, email, name || email.split('@')[0]]
    });
    return { id, email, name };
  }

  // ==== CONTACTS MANAGEMENT ====
  async getContacts() {
    const result = await turso.execute('SELECT * FROM contacts ORDER BY name');
    return result.rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data as string) : {}
    }));
  }

  async getContactById(id: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) return null;
    
    const contact = result.rows[0];
    return {
      ...contact,
      data: contact.data ? JSON.parse(contact.data as string) : {}
    };
  }

  async createContact(contact: ContactCreateInput) {
    const id = contact.id || uuidv4();
    const now = new Date().toISOString();
    const additionalData: Record<string, unknown> = {};
    
    // Extract known fields and put rest in data
    const knownFields = ['id', 'type', 'name', 'email', 'phone', 'phone2', 'company', 
                        'rig', 'job_title', 'location', 'client_name', 'well_name', 'created_by'];
    
    Object.keys(contact).forEach(key => {
      if (!knownFields.includes(key) && key !== 'data') {
        additionalData[key] = contact[key];
      }
    });
    
    await turso.execute({
      sql: `INSERT INTO contacts 
            (id, type, name, email, phone, phone2, company, rig, job_title, 
             location, client_name, well_name, created_by, created_at, updated_at, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        contact.type,
        contact.name,
        contact.email || null,
        contact.phone || null,
        contact.phone2 || null,
        contact.company || null,
        contact.rig || null,
        contact.job_title || null,
        contact.location || null,
        contact.client_name || null,
        contact.well_name || null,
        contact.created_by || null,
        now,
        now,
        Object.keys(additionalData).length > 0 ? JSON.stringify(additionalData) : null
      ]
    });
    
    return { ...contact, id };
  }

  async updateContact(id: string, updates: ContactUpdateInput) {
    const now = new Date().toISOString();
    const knownFields = ['type', 'name', 'email', 'phone', 'phone2', 'company', 
                        'rig', 'job_title', 'location', 'client_name', 'well_name'];
    
    const setClause: string[] = ['updated_at = ?'];
    const args: unknown[] = [now];
    const additionalData: Record<string, unknown> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (knownFields.includes(key)) {
        setClause.push(`${key} = ?`);
        args.push(value);
      } else if (key !== 'id' && key !== 'created_at' && key !== 'created_by' && key !== 'data') {
        additionalData[key] = value;
      }
    });
    
    if (Object.keys(additionalData).length > 0) {
      setClause.push('data = ?');
      args.push(JSON.stringify(additionalData));
    }
    
    args.push(id);
    
    await turso.execute({
      sql: `UPDATE contacts SET ${setClause.join(', ')} WHERE id = ?`,
      args
    });
    
    return { id, ...updates };
  }

  async deleteContact(id: string) {
    await turso.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [id]
    });
  }

  async searchContacts(query: string) {
    const searchTerm = `%${query}%`;
    const result = await turso.execute({
      sql: `SELECT * FROM contacts 
            WHERE name LIKE ? OR email LIKE ? OR company LIKE ? 
            OR phone LIKE ? OR rig LIKE ? OR location LIKE ?
            ORDER BY name`,
      args: [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    });
    
    return result.rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data as string) : {}
    }));
  }

  // ==== CONTACT COLUMN SETTINGS ====
  async getColumnSettings(contactType: string, userId?: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM contact_columns WHERE contact_type = ? AND (user_id = ? OR user_id IS NULL) ORDER BY user_id DESC LIMIT 1',
      args: [contactType, userId || null]
    });
    
    if (result.rows.length === 0) return null;
    
    return JSON.parse(result.rows[0].column_settings as string);
  }

  async saveColumnSettings(contactType: string, settings: unknown[], userId?: string) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Try to update existing settings first
    const existing = await turso.execute({
      sql: 'SELECT id FROM contact_columns WHERE contact_type = ? AND user_id = ?',
      args: [contactType, userId || null]
    });
    
    if (existing.rows.length > 0) {
      await turso.execute({
        sql: 'UPDATE contact_columns SET column_settings = ?, updated_at = ? WHERE id = ?',
        args: [JSON.stringify(settings), now, existing.rows[0].id]
      });
    } else {
      await turso.execute({
        sql: `INSERT INTO contact_columns (id, contact_type, column_settings, user_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, contactType, JSON.stringify(settings), userId || null, now, now]
      });
    }
    
    return settings;
  }

  // ==== CUSTOM CONTACT TYPES ====
  async getCustomContactTypes() {
    const result = await turso.execute('SELECT * FROM custom_contact_types ORDER BY name');
    return result.rows;
  }

  async createCustomContactType(name: string, userId?: string) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await turso.execute({
      sql: 'INSERT INTO custom_contact_types (id, name, created_by, created_at) VALUES (?, ?, ?, ?)',
      args: [id, name, userId || null, now]
    });
    
    return { id, name };
  }

  async deleteCustomContactType(id: string) {
    await turso.execute({
      sql: 'DELETE FROM custom_contact_types WHERE id = ?',
      args: [id]
    });
  }
}

// Lazy singleton instance
let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}