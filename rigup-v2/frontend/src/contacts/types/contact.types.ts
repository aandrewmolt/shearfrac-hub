export type ContactType = 'client' | 'frac' | string; // Allow any string for custom types
export type ShiftType = 'days' | 'nights' | 'off';

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
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  notes?: string;
  createdDate: string;
  jobAssignments?: JobAssignment[];
}

export interface ClientContact extends BaseContact {
  type: 'client';
  title: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  job: string; // Keep for backward compatibility
  shift?: ShiftType;
  crew?: string;
  dateOfRotation?: string;
}

export interface FracContact extends BaseContact {
  type: 'frac';
  company: string;
  crew: string;
  name: string;
  shift: ShiftType;
  title: string;
  phone: string;
  email: string;
  job: string;
  dateOfRotation?: string;
}

export interface CustomContact extends BaseContact {
  type: string; // This will be the actual custom type like 'coldbore', 'wireline', etc.
  company: string;
  crew: string;
  name: string;
  shift: ShiftType;
  title: string;
  phone: string;
  email: string;
  job: string;
  dateOfRotation?: string;
}

export type Contact = ClientContact | FracContact | CustomContact;

export interface ContactColumn {
  id: string;
  label: string;
  key: keyof Contact | string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  visible?: boolean;
  order?: number;
}

export interface ContactsDatabase {
  version: string;
  lastModified: string;
  contacts: Contact[];
  customTypes: string[]; // Store custom contact types
  columnSettings: {
    [key in ContactType | string]: ContactColumn[];
  };
}

export interface ContactFilter {
  type?: ContactType | string;
  company?: string;
  crew?: string;
  job?: string;
  jobId?: string;
  activeJobsOnly?: boolean;
  shift?: ShiftType;
  search?: string;
}

export interface ContactSort {
  key: string;
  direction: 'asc' | 'desc';
}