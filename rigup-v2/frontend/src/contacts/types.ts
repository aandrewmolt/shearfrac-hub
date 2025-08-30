export type ShiftType = 'days' | 'nights' | 'off';
export type ContactType = 'client' | 'frac' | 'custom';

export interface JobAssignment {
  jobId: string;
  jobName: string;
  client: string;
  assignedDate: string;
  unassignedDate?: string;
  active: boolean;
}

export interface BaseContact {
  id: string;
  name: string;
  type: ContactType;
  company: string;
  phoneNumber?: string;
  email?: string;
  jobAssignments?: JobAssignment[];
  createdDate: string;
  lastUpdatedDate: string;
  lastUpdatedTime?: string;
  notes?: string;
}

export interface ClientContact extends BaseContact {
  type: 'client';
  title?: string;
  shift?: ShiftType;
}

export interface FracContact extends BaseContact {
  type: 'frac';
  crew?: string;
  title?: string;
  shift?: ShiftType;
  phone?: string; // Some components use 'phone' instead of 'phoneNumber'
}

export interface CustomContact extends BaseContact {
  type: 'custom';
  customType: string;
  crew?: string;
  title?: string;
  shift?: ShiftType;
}

export type Contact = ClientContact | FracContact | CustomContact;

// Helper type guards
export function isClientContact(contact: Contact): contact is ClientContact {
  return contact.type === 'client';
}

export function isFracContact(contact: Contact): contact is FracContact {
  return contact.type === 'frac';
}

export function isCustomContact(contact: Contact): contact is CustomContact {
  return contact.type === 'custom';
}

// Contact form data (for creating/editing)
export interface ContactFormData {
  name: string;
  type: ContactType;
  customType?: string;
  company: string;
  crew?: string;
  title?: string;
  phoneNumber?: string;
  email?: string;
  shift?: ShiftType;
  notes?: string;
}

// Contact filter options
export interface ContactFilters {
  type?: ContactType | 'all';
  company?: string;
  crew?: string;
  shift?: ShiftType | 'all';
  jobId?: string;
  searchQuery?: string;
}

// Contact import options
export interface ContactImportOptions {
  mode: 'crew' | 'company' | 'template';
  company?: string;
  crew?: string;
  templateType?: 'client' | 'frac';
  selectedMembers?: Set<string>;
}

// Contact sync status
export interface ContactSyncStatus {
  lastSynced?: Date;
  pending: number;
  failed: number;
  syncing: boolean;
}

// Crew information
export interface CrewInfo {
  name: string;
  company: string;
  memberCount: number;
  shifts: {
    days: number;
    nights: number;
    off: number;
  };
}

// Contact statistics
export interface ContactStats {
  total: number;
  byType: {
    client: number;
    frac: number;
    custom: number;
  };
  byCompany: Record<string, number>;
  byCrew: Record<string, number>;
  assigned: number;
  unassigned: number;
}