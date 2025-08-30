import { useState, useEffect, useCallback } from 'react';
import { Contact, ContactColumn, ContactsDatabase } from '../types';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';
import { defaultClientColumns, defaultFracColumns, defaultCustomColumns } from '../utils/columnConfig';
import edgeSync from '@/services/edgeFunctionSync';

// Migration helper to import existing localStorage data
async function migrateFromLocalStorage() {
  const STORAGE_KEY = 'shearfrac_contacts_db';
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) return false;
  
  try {
    const data = JSON.parse(stored) as ContactsDatabase;
    
    // Check if migration already happened
    const existingContacts = await tursoDb.getContacts();
    if (existingContacts.length > 0) {
      console.log('Contacts already migrated to Turso');
      return false;
    }
    
    console.log('Migrating contacts from localStorage to Turso...');
    
    // Migrate contacts
    for (const contact of data.contacts) {
      await tursoDb.createContact(contact);
    }
    
    // Migrate custom types
    for (const customType of data.customTypes || []) {
      if (customType !== 'client' && customType !== 'frac') {
        await tursoDb.createCustomContactType(customType);
      }
    }
    
    // Migrate column settings
    for (const [type, columns] of Object.entries(data.columnSettings || {})) {
      await tursoDb.saveColumnSettings(type, columns as ContactColumn[]);
    }
    
    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_sha');
    
    console.log(`✅ Migrated ${data.contacts.length} contacts to Turso`);
    toast.success(`Migrated ${data.contacts.length} contacts to cloud storage!`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

export function useTursoContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(['Coldbore']);
  const [columnSettings, setColumnSettings] = useState<Record<string, ContactColumn[]>>({
    client: defaultClientColumns,
    frac: defaultFracColumns,
    custom: defaultCustomColumns,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data on mount
  // DISABLED - Manual load only to prevent request storm
  // useEffect(() => {
  //   loadData();
  // }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try migration first
      await migrateFromLocalStorage();
      
      // Load contacts
      const contactsData = await tursoDb.getContacts();
      setContacts(contactsData);
      
      // AWS Mode - Use default types and columns
      setCustomTypes(['Coldbore']);
      
      // Use default column settings for AWS mode
      const settings: Record<string, ContactColumn[]> = {
        'client': defaultClientColumns,
        'frac': defaultFracColumns,
        'custom': defaultCustomColumns,
        'Coldbore': defaultCustomColumns
      };
      setColumnSettings(settings);
      
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError(err instanceof Error ? err : new Error('Failed to load contacts'));
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contact: Contact) => {
    try {
      setIsSyncing(true);
      const newContact = await tursoDb.createContact(contact);
      
      // Optimistically update local state
      setContacts(prev => [...prev, newContact]);
      
      // Add custom type if needed
      if (contact.type !== 'client' && contact.type !== 'frac' && !customTypes.includes(contact.type)) {
        await tursoDb.createCustomContactType(contact.type);
        setCustomTypes(prev => [...prev, contact.type]);
      }
      
      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.contacts.create({
            type: newContact.type,
            name: newContact.name,
            company: newContact.company,
            title: newContact.title,
            phone: newContact.phone,
            email: newContact.email,
            job: newContact.job,
            crew: newContact.crew,
            shift: newContact.shift,
            notes: newContact.notes,
            jobAssignments: newContact.jobAssignments
          });
          console.log(`Contact ${newContact.id} synced to edge functions`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'contact',
            action: 'create',
            data: newContact
          });
        }
      }
      
      toast.success('Contact added successfully');
    } catch (err) {
      console.error('Failed to add contact:', err);
      toast.error('Failed to add contact');
      // Reload to sync state
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const updateContact = async (id: string, contact: Contact) => {
    try {
      setIsSyncing(true);
      await tursoDb.updateContact(id, contact);
      
      // Optimistically update local state
      setContacts(prev => prev.map(c => c.id === id ? contact : c));
      
      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.contacts.update(id, contact);
          console.log(`Contact ${id} synced to edge functions`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'contact',
            action: 'update',
            data: { id, ...contact }
          });
        }
      }
      
      toast.success('Contact updated successfully');
    } catch (err) {
      console.error('Failed to update contact:', err);
      toast.error('Failed to update contact');
      // Reload to sync state
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setIsSyncing(true);
      await tursoDb.deleteContact(id);
      
      // Optimistically update local state
      setContacts(prev => prev.filter(c => c.id !== id));
      
      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.contacts.delete(id);
          console.log(`Contact ${id} deletion synced to edge functions`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'contact',
            action: 'delete',
            data: { id }
          });
        }
      }
      
      toast.success('Contact deleted successfully');
    } catch (err) {
      console.error('Failed to delete contact:', err);
      toast.error('Failed to delete contact');
      // Reload to sync state
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const updateColumnSettings = async (type: string, columns: ContactColumn[]) => {
    try {
      setIsSyncing(true);
      await tursoDb.saveColumnSettings(type, columns);
      
      // Update local state
      setColumnSettings(prev => ({
        ...prev,
        [type]: columns
      }));
      
      toast.success('Column settings updated');
    } catch (err) {
      console.error('Failed to update column settings:', err);
      toast.error('Failed to update column settings');
    } finally {
      setIsSyncing(false);
    }
  };

  const addCustomType = async (typeName: string) => {
    if (customTypes.includes(typeName)) return;
    
    try {
      setIsSyncing(true);
      await tursoDb.createCustomContactType(typeName);
      
      // Update local state
      setCustomTypes(prev => [...prev, typeName]);
      
      // Set default columns for new type
      setColumnSettings(prev => ({
        ...prev,
        [typeName]: defaultCustomColumns
      }));
      
      toast.success(`Added custom type: ${typeName}`);
    } catch (err) {
      console.error('Failed to add custom type:', err);
      toast.error('Failed to add custom type');
    } finally {
      setIsSyncing(false);
    }
  };

  const searchContacts = useCallback(async (query: string) => {
    if (!query) return contacts;
    
    try {
      const results = await tursoDb.searchContacts(query);
      return results;
    } catch (err) {
      console.error('Search failed:', err);
      // Fallback to local search
      const lowerQuery = query.toLowerCase();
      return contacts.filter(c => 
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.email?.toLowerCase().includes(lowerQuery) ||
        c.company?.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query)
      );
    }
  }, [contacts]);

  return {
    contacts,
    customTypes,
    columnSettings,
    loading,
    error,
    isSyncing,
    addContact,
    updateContact,
    deleteContact,
    updateColumnSettings,
    addCustomType,
    searchContacts,
    refresh: loadData,
  };
}