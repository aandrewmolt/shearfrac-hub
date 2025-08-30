import { ContactColumn, ContactType } from '../types';

export const defaultClientColumns: ContactColumn[] = [
  { id: 'title', label: 'Title', key: 'title', sortable: true, filterable: true, order: 1 },
  { id: 'name', label: 'Name', key: 'name', sortable: true, filterable: true, order: 2 },
  { id: 'company', label: 'Company', key: 'company', sortable: true, filterable: true, order: 3 },
  { id: 'phone', label: 'Phone', key: 'phone', sortable: true, filterable: true, order: 4 },
  { id: 'email', label: 'Email', key: 'email', sortable: true, filterable: true, order: 5 },
  { id: 'job', label: 'Job', key: 'job', sortable: true, filterable: true, order: 6 },
  { id: 'lastUpdatedDate', label: 'Last Updated', key: 'lastUpdatedDate', sortable: true, filterable: true, order: 7 },
  { id: 'notes', label: 'Notes', key: 'notes', sortable: false, filterable: true, order: 8 },
  { id: 'shift', label: 'Shift', key: 'shift', sortable: true, filterable: true, order: 9 },
  { id: 'type', label: 'Type', key: 'type', sortable: true, filterable: true, order: 10, visible: false },
];

export const defaultFracColumns: ContactColumn[] = [
  { id: 'company', label: 'Company', key: 'company', sortable: true, filterable: true, order: 1 },
  { id: 'crew', label: 'Crew', key: 'crew', sortable: true, filterable: true, order: 2 },
  { id: 'name', label: 'Name', key: 'name', sortable: true, filterable: true, order: 3 },
  { id: 'shift', label: 'Shift', key: 'shift', sortable: true, filterable: true, order: 4 },
  { id: 'title', label: 'Title', key: 'title', sortable: true, filterable: true, order: 5 },
  { id: 'phone', label: 'Phone', key: 'phone', sortable: true, filterable: true, order: 6 },
  { id: 'email', label: 'Email', key: 'email', sortable: true, filterable: true, order: 7 },
  { id: 'job', label: 'Job', key: 'job', sortable: true, filterable: true, order: 8 },
  { id: 'lastUpdatedDate', label: 'Last Updated', key: 'lastUpdatedDate', sortable: true, filterable: true, order: 9 },
  { id: 'notes', label: 'Notes', key: 'notes', sortable: false, filterable: true, order: 10 },
  { id: 'dateOfRotation', label: 'Date of Rotation', key: 'dateOfRotation', sortable: true, filterable: true, order: 11 },
  { id: 'type', label: 'Type', key: 'type', sortable: true, filterable: true, order: 12, visible: false },
];

export const defaultCustomColumns: ContactColumn[] = [
  { id: 'company', label: 'Company', key: 'company', sortable: true, filterable: true, order: 1 },
  { id: 'crew', label: 'Crew', key: 'crew', sortable: true, filterable: true, order: 2 },
  { id: 'name', label: 'Name', key: 'name', sortable: true, filterable: true, order: 3 },
  { id: 'shift', label: 'Shift', key: 'shift', sortable: true, filterable: true, order: 4 },
  { id: 'title', label: 'Title', key: 'title', sortable: true, filterable: true, order: 5 },
  { id: 'phone', label: 'Phone', key: 'phone', sortable: true, filterable: true, order: 6 },
  { id: 'email', label: 'Email', key: 'email', sortable: true, filterable: true, order: 7 },
  { id: 'job', label: 'Job', key: 'job', sortable: true, filterable: true, order: 8 },
  { id: 'lastUpdatedDate', label: 'Last Updated', key: 'lastUpdatedDate', sortable: true, filterable: true, order: 9 },
  { id: 'notes', label: 'Notes', key: 'notes', sortable: false, filterable: true, order: 10 },
  { id: 'dateOfRotation', label: 'Date of Rotation', key: 'dateOfRotation', sortable: true, filterable: true, order: 11 },
  { id: 'type', label: 'Type', key: 'type', sortable: true, filterable: true, order: 12, visible: false },
];

export function getDefaultColumns(type: ContactType | string): ContactColumn[] {
  switch (type) {
    case 'client':
      return [...defaultClientColumns];
    case 'frac':
      return [...defaultFracColumns];
    default:
      return [...defaultCustomColumns];
  }
}