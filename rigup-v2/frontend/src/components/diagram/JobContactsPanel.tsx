import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, Plus, Search, Filter, UserPlus, UserMinus, Edit2, Trash2, MoreVertical, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import edgeSync from '@/services/edgeFunctionSync';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTursoContacts } from '@/contacts/hooks/useTursoContacts';
import { Contact, ContactType, JobAssignment } from '@/contacts/types';
import { ContactFormEnhanced } from '@/contacts/components/ContactFormEnhanced';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { BulkCrewImportDialog } from './BulkCrewImportDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface JobContactsPanelProps {
  jobId: string;
  jobName: string;
  client: string;
  className?: string;
}

export function JobContactsPanel({ jobId, jobName, client, className }: JobContactsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCrew, setFilterCrew] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [activeTab, setActiveTab] = useState('assigned');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const {
    contacts,
    customTypes,
    loading,
    addContact,
    updateContact,
    deleteContact,
  } = useTursoContacts();

  const eventSystem = useUnifiedEvents();

  // Subscribe to contact assignment/unassignment events from other parts of the system
  useEffect(() => {
    const unsubscribe = eventSystem.subscribe('contact_assignment', (event) => {
      const { contactId, jobId: eventJobId, action } = event.data;
      
      // Only react to events for this job
      if (eventJobId === jobId) {
        console.log(`Contact ${action} event received for job ${jobId}:`, contactId);
        
        if (action === 'assign') {
          toast.info('Contact assigned to job from another system');
        } else if (action === 'unassign') {
          toast.info('Contact removed from job from another system');
        }
        
        // The useTursoContacts hook should refresh automatically, 
        // but we could trigger a manual refresh here if needed
      }
    });

    return unsubscribe;
  }, [eventSystem, jobId]);

  // Get all unique crews from frac and custom contacts
  const uniqueCrews = useMemo(() => {
    const crews = new Set<string>();
    (contacts || []).forEach(contact => {
      if ((contact.type === 'frac' || contact.type === 'custom') && contact.crew) {
        crews.add(contact.crew);
      }
    });
    return crews ? Array.from(crews).sort() : [];
  }, [contacts]);

  // Filter contacts based on current job assignment
  const { assignedContacts, availableContacts } = useMemo(() => {
    const assigned: Contact[] = [];
    const available: Contact[] = [];

    (contacts || []).forEach(contact => {
      const isAssigned = contact.jobAssignments?.some(
        assignment => assignment.jobId === jobId && assignment.active
      );

      if (isAssigned) {
        assigned.push(contact);
      } else {
        available.push(contact);
      }
    });

    return { assignedContacts: assigned, availableContacts: available };
  }, [contacts, jobId]);

  // Apply filters
  const filteredContacts = useMemo(() => {
    const contactsToFilter = activeTab === 'assigned' ? assignedContacts : availableContacts;

    return contactsToFilter.filter(contact => {
      // Type filter
      if (filterType !== 'all') {
        if (contact.type === 'custom') {
          if (filterType !== contact.customType) return false;
        } else {
          if (filterType !== contact.type) return false;
        }
      }

      // Crew filter
      if (filterCrew !== 'all') {
        if (!('crew' in contact) || contact.crew !== filterCrew) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          contact.name.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          ('title' in contact && contact.title?.toLowerCase().includes(query)) ||
          ('email' in contact && contact.email?.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [assignedContacts, availableContacts, activeTab, filterType, filterCrew, searchQuery]);

  const handleAssignContact = async (contact: Contact) => {
    const newAssignment: JobAssignment = {
      jobId,
      jobName,
      client,
      assignedDate: new Date().toISOString(),
      active: true,
    };

    const updatedContact = {
      ...contact,
      jobAssignments: [...(contact.jobAssignments || []), newAssignment],
    };

    try {
      await updateContact(contact.id, updatedContact);
      
      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.contacts.assignToJob(contact.id, jobId, jobName, client);
          console.log(`Contact ${contact.id} assignment to job ${jobId} synced`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'contact',
            action: 'assign',
            data: { contactId: contact.id, jobId, jobName, client }
          });
        }
      }
      
      // Trigger unified event system notification
      await eventSystem.contactAssigned(contact.id, jobId, contact.type || 'custom');
      
      toast.success(`${contact.name} assigned to ${jobName}`);
    } catch (error) {
      console.error('Failed to assign contact:', error);
      toast.error('Failed to assign contact');
    }
  };

  const handleUnassignContact = async (contact: Contact) => {
    const updatedAssignments = contact.jobAssignments?.map(assignment => {
      if (assignment.jobId === jobId && assignment.active) {
        return {
          ...assignment,
          active: false,
          unassignedDate: new Date().toISOString(),
        };
      }
      return assignment;
    });

    const updatedContact = {
      ...contact,
      jobAssignments: updatedAssignments,
    };

    try {
      await updateContact(contact.id, updatedContact);
      
      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.contacts.unassignFromJob(contact.id, jobId);
          console.log(`Contact ${contact.id} unassignment from job ${jobId} synced`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'contact',
            action: 'unassign',
            data: { contactId: contact.id, jobId }
          });
        }
      }
      
      // Trigger unified event system notification
      await eventSystem.contactUnassigned(contact.id, jobId);
      
      toast.success(`${contact.name} removed from ${jobName}`);
    } catch (error) {
      console.error('Failed to remove contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    
    try {
      await deleteContact(contactToDelete.id);
      toast.success(`${contactToDelete.name} deleted`);
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleBulkImport = async (contactsToImport: Partial<Contact>[]) => {
    try {
      for (const contactData of contactsToImport) {
        const contactId = uuidv4();
        const newContact: Contact = {
          id: contactId,
          ...contactData,
          createdDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          lastUpdatedTime: new Date().toLocaleTimeString(),
          jobAssignments: [{
            jobId,
            jobName,
            client,
            assignedDate: new Date().toISOString(),
            active: true,
          }],
        } as Contact;
        
        await addContact(newContact);
        
        // Trigger unified event system notification for each contact
        await eventSystem.contactAssigned(contactId, jobId, newContact.type || 'custom');
      }
      
      toast.success(`Imported ${contactsToImport.length} contacts and assigned to ${jobName}`);
      setShowBulkImport(false);
    } catch (error) {
      console.error('Failed to import contacts:', error);
      toast.error('Failed to import contacts');
    }
  };

  const handleAddNewContact = async (contact: Contact) => {
    // Automatically assign to current job
    const newContact = {
      ...contact,
      jobAssignments: [{
        jobId,
        jobName,
        client,
        assignedDate: new Date().toISOString(),
        active: true,
      }],
    };

    try {
      await addContact(newContact);
      
      // Trigger unified event system notification
      await eventSystem.contactAssigned(contact.id, jobId, contact.type || 'custom');
      
      toast.success('Contact added and assigned to job');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const getContactTypeLabel = (contact: Contact) => {
    if (contact.type === 'custom') {
      return contact.customType;
    }
    return contact.type === 'client' ? 'Client' : 'Frac';
  };

  const getContactTypeColor = (contact: Contact) => {
    if (contact.type === 'client') return 'bg-muted text-foreground';
    if (contact.type === 'frac') return 'bg-muted text-foreground';
    return 'bg-muted text-accent';
  };

  const renderContact = (contact: Contact, isAssigned: boolean) => {
    // Get company type label based on contact type
    const getCompanyTypeLabel = () => {
      if (contact.type === 'client') return 'Operating Company';
      if (contact.type === 'frac') return 'Frac Company';
      return 'Service Company';
    };

    return (
      <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{contact.name}</span>
            <Badge className={cn("text-xs", getContactTypeColor(contact))}>
              {getContactTypeLabel(contact)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">{getCompanyTypeLabel()}:</span>
            <span className="ml-1">{contact.company}</span>
            {('crew' in contact && contact.crew) && (
              <span className="ml-2">• Crew: {contact.crew}</span>
            )}
            {('title' in contact && contact.title) && (
              <span className="ml-2">• {contact.title}</span>
            )}
          </div>
          {contact.jobAssignments && contact.jobAssignments.length > 1 && (
            <div className="text-xs text-muted-foreground mt-1">
              Also on {contact.jobAssignments.filter(a => a.jobId !== jobId && a.active).length} other jobs
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={isAssigned ? "destructive" : "default"}
          onClick={() => isAssigned ? handleUnassignContact(contact) : handleAssignContact(contact)}
        >
          {isAssigned ? (
            <>
              <UserMinus className="h-4 w-4 mr-1" />
              Remove
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Assign
            </>
          )}
        </Button>
        
        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditContact(contact)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(contact)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Role suggestions based on contact type
  const getRoleSuggestions = () => {
    if (filterType === 'client') {
      return (
        <div className="text-sm text-muted-foreground bg-card p-3 rounded mb-3">
          <p className="font-medium mb-1">Client Roles Needed:</p>
          <ul className="space-y-1">
            <li>• Company Man (Day Shift) - {client}</li>
            <li>• Company Man (Night Shift) - {client}</li>
          </ul>
        </div>
      );
    } else if (filterType === 'frac') {
      return (
        <div className="text-sm text-muted-foreground bg-card p-3 rounded mb-3">
          <p className="font-medium mb-1">Frac Crew Roles Needed:</p>
          <ul className="space-y-1">
            <li>• Engineer (Day & Night Shifts)</li>
            <li>• E-Tech (Day & Night Shifts)</li>
            <li>• Treater/Supervisor (Per Shift)</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("mt-4", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Job Contacts</CardTitle>
                <Badge variant="secondary">{assignedContacts.length} assigned</Badge>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="assigned">Assigned ({assignedContacts.length})</TabsTrigger>
                  <TabsTrigger value="available">Available ({availableContacts.length})</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button onClick={() => setShowBulkImport(true)} size="sm" variant="outline">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    Import Crew
                  </Button>
                  <Button onClick={() => setShowAddForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Contact
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="frac">Frac</SelectItem>
                      {customTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCrew} onValueChange={setFilterCrew}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All crews" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All crews</SelectItem>
                      {uniqueCrews.map(crew => (
                        <SelectItem key={crew} value={crew}>{crew}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="assigned" className="mt-0">
                {getRoleSuggestions()}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredContacts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchQuery || filterType !== 'all' || filterCrew !== 'all' 
                          ? 'No contacts match your filters' 
                          : 'No contacts assigned to this job'}
                      </p>
                    ) : (
                      filteredContacts.map(contact => renderContact(contact, true))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="available" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredContacts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No available contacts match your filters
                      </p>
                    ) : (
                      filteredContacts.map(contact => renderContact(contact, false))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {showAddForm && (
        <ContactFormEnhanced
          contactType={editingContact?.type || "client"}
          customTypes={customTypes}
          existingContacts={contacts}
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setEditingContact(undefined);
          }}
          onSubmit={editingContact ? 
            async (updated) => {
              try {
                await updateContact(updated.id, updated);
                toast.success('Contact updated');
                setShowAddForm(false);
                setEditingContact(undefined);
              } catch (error) {
                toast.error('Failed to update contact');
              }
            } : handleAddNewContact
          }
          contact={editingContact}
        />
      )}

      <BulkCrewImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        contacts={contacts}
        onImportContacts={handleBulkImport}
        jobName={jobName}
        client={client}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contactToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/80">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}