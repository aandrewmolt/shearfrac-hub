import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ChevronDown, Table, Network, Users2, LayoutGrid, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactsTableEnhanced } from './ContactsTableEnhanced';
import { ContactFormEnhanced } from './ContactFormEnhanced';
import { ContactFilterChips } from './ContactFilterChips';
import { EnhancedSearch } from './EnhancedSearch';
import { DuplicateDetection } from './DuplicateDetection';
import { useTursoContacts } from '../hooks/useTursoContacts';
import { Contact, ContactType, ContactColumn } from '../types';
import { getDefaultColumns } from '../utils/columnConfig';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDebounce } from '@/hooks/use-debounce-hook';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { RelationshipMap } from './RelationshipMap';
import { ContactsGroupedView } from './ContactsGroupedView';

// Memoized sub-components
const ViewModeToggle = React.memo(({ 
  viewMode, 
  onViewModeChange,
  isMobile 
}: { 
  viewMode: string; 
  onViewModeChange: (mode: string) => void;
  isMobile: boolean;
}) => {
  if (isMobile) {
    return (
      <Select value={viewMode} onValueChange={onViewModeChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="table">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Table
            </div>
          </SelectItem>
          <SelectItem value="grouped">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Grouped
            </div>
          </SelectItem>
          <SelectItem value="relationships">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex bg-card rounded-lg p-1">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="flex items-center gap-2"
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
      <Button
        variant={viewMode === 'grouped' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grouped')}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grouped</span>
      </Button>
      <Button
        variant={viewMode === 'relationships' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('relationships')}
        className="flex items-center gap-2"
      >
        <Network className="h-4 w-4" />
        <span className="hidden sm:inline">Network</span>
      </Button>
    </div>
  );
});

ViewModeToggle.displayName = 'ViewModeToggle';

export function ContactsPage() {
  const {
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
    refresh,
  } = useTursoContacts();

  const isMobile = useIsMobile();

  // State management
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [customTypeDialogOpen, setCustomTypeDialogOpen] = useState(false);
  const [newCustomType, setNewCustomType] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [newContactType, setNewContactType] = useState<string>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: {},
    companies: [],
    jobs: [],
    shifts: [],
    hasEmail: null,
    hasPhone: null,
  });
  const [viewMode, setViewMode] = useState<'table' | 'grouped' | 'relationships'>('table');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach(contact => {
        const type = contact.type;
        counts[type] = (counts[type] || 0) + 1;
      });
    }
    return counts;
  }, [contacts]);

  // Optimized filtering with memoization
  const filteredContacts = useMemo(() => {
    if (!contacts || !Array.isArray(contacts)) return [];
    
    let filtered = [...contacts];

    // Apply type filters
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(contact => selectedTypes.includes(contact.type));
    }

    // Apply search filter with debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(contact => {
        if (searchScope === 'all') {
          return (
            contact.name?.toLowerCase().includes(query) ||
            contact.company?.toLowerCase().includes(query) ||
            contact.job?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.phone?.includes(query) ||
            ('title' in contact && contact.title?.toLowerCase().includes(query)) ||
            ('crew' in contact && contact.crew?.toLowerCase().includes(query))
          );
        } else {
          const field = contact[searchScope as keyof Contact] as string;
          return field?.toLowerCase().includes(query);
        }
      });
    }

    // Apply advanced filters
    if (advancedFilters.companies.length > 0) {
      filtered = filtered.filter(contact => 
        advancedFilters.companies.includes(contact.company)
      );
    }

    if (advancedFilters.jobs.length > 0) {
      filtered = filtered.filter(contact => {
        const jobKey = `${contact.company} - ${contact.job}`;
        return advancedFilters.jobs.includes(jobKey);
      });
    }

    if (advancedFilters.shifts.length > 0) {
      filtered = filtered.filter(contact => 
        contact.shift && advancedFilters.shifts.includes(contact.shift)
      );
    }

    if (advancedFilters.hasEmail !== null) {
      filtered = filtered.filter(contact => {
        const hasEmail = Boolean(contact.email?.trim());
        return hasEmail === advancedFilters.hasEmail;
      });
    }

    if (advancedFilters.hasPhone !== null) {
      filtered = filtered.filter(contact => {
        const hasPhone = Boolean(contact.phone?.trim());
        return hasPhone === advancedFilters.hasPhone;
      });
    }

    // Date range filter
    if (advancedFilters.dateRange.from || advancedFilters.dateRange.to) {
      filtered = filtered.filter(contact => {
        const contactDate = new Date(contact.lastUpdatedDate);
        const isAfterFrom = !advancedFilters.dateRange.from || 
          contactDate >= advancedFilters.dateRange.from;
        const isBeforeTo = !advancedFilters.dateRange.to || 
          contactDate <= advancedFilters.dateRange.to;
        return isAfterFrom && isBeforeTo;
      });
    }

    if (advancedFilters.lastUpdatedDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - advancedFilters.lastUpdatedDays);
      filtered = filtered.filter(contact => {
        const contactDate = new Date(contact.lastUpdatedDate);
        return contactDate >= cutoffDate;
      });
    }

    return filtered;
  }, [contacts, selectedTypes, debouncedSearchQuery, searchScope, advancedFilters]);

  // Memoized columns
  const currentColumns = useMemo(() => {
    const allColumns = new Set<ContactColumn>();
    const columnMap = new Map<string, ContactColumn>();
    
    ['client', 'frac', 'custom', ...customTypes].forEach(type => {
      const cols = columnSettings[type] || getDefaultColumns(type as ContactType);
      cols.forEach(col => {
        if (!columnMap.has(col.id)) {
          columnMap.set(col.id, col);
        }
      });
    });
    
    return Array.from(columnMap.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [columnSettings, customTypes]);

  // Callbacks with useCallback for optimization
  const handleAddContact = useCallback((type?: string) => {
    setEditingContact(undefined);
    if (type) setNewContactType(type);
    setFormOpen(true);
  }, []);

  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  }, []);

  const handleDeleteContact = useCallback((id: string) => {
    setContactToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (contactToDelete) {
      try {
        await deleteContact(contactToDelete);
        toast.success('Contact deleted successfully');
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
    setDeleteConfirmOpen(false);
    setContactToDelete(null);
  }, [contactToDelete, deleteContact]);

  const handleSubmitContact = useCallback(async (contact: Contact) => {
    try {
      if (editingContact) {
        await updateContact(contact.id, contact);
        toast.success('Contact updated successfully');
      } else {
        await addContact(contact);
        toast.success('Contact added successfully');
      }
      setFormOpen(false);
      setEditingContact(undefined);
    } catch (error) {
      toast.error('Failed to save contact');
    }
  }, [editingContact, updateContact, addContact]);

  const handleColumnOrderChange = useCallback(async (columns: typeof currentColumns) => {
    try {
      await updateColumnSettings('unified', columns);
      toast.success('Column order saved');
    } catch (error) {
      toast.error('Failed to save column order');
    }
  }, [updateColumnSettings]);

  const handleAddCustomType = useCallback(async () => {
    const trimmedType = newCustomType.trim();
    if (trimmedType) {
      try {
        await addCustomType(trimmedType);
        setCustomTypeDialogOpen(false);
        setNewCustomType('');
        toast.success('Custom type added successfully');
      } catch (error) {
        toast.error('Failed to add custom type');
      }
    }
  }, [newCustomType, addCustomType]);

  const handleMergeContacts = useCallback(async (contactsToMerge: Contact[], mergedContact: Contact) => {
    try {
      for (let i = 1; i < contactsToMerge.length; i++) {
        await deleteContact(contactsToMerge[i].id);
      }
      await updateContact(contactsToMerge[0].id, mergedContact);
      toast.success(`Merged ${contactsToMerge.length} contacts successfully`);
    } catch (error) {
      toast.error('Failed to merge contacts');
    }
  }, [deleteContact, updateContact]);

  const handleSearch = useCallback((query: string, scope: string) => {
    setSearchQuery(query);
    setSearchScope(scope);
  }, []);

  const handleTypeToggle = useCallback((type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedTypes([]);
  }, []);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteContact(id);
      }
      toast.success(`Deleted ${ids.length} contacts`);
    } catch (error) {
      toast.error('Failed to delete contacts');
    }
  }, [deleteContact]);

  // Pull to refresh on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    let startY = 0;
    let pulling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100) {
        refresh();
        pulling = false;
      }
    };
    
    const handleTouchEnd = () => {
      pulling = false;
    };
    
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Loader2 className="h-16 w-16 sm:h-32 sm:w-32 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-red-500 text-center">Error loading contacts: {error.message}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-gradient-corporate">
        <AppHeader />
        
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6">
          {/* Cloud sync notification */}
          <Alert className="bg-status-success/20 border-status-success">
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted0 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-status-success">
                  {isMobile ? 'Synced to cloud' : 'Contacts are now synced to the cloud and available across all your devices'}
                </span>
              </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refresh}
              className={cn("h-8", isMobile && "w-full")}
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              <span className="ml-2">{isSyncing ? 'Syncing...' : 'Refresh'}</span>
            </Button>
            </AlertDescription>
          </Alert>
          
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center sm:text-left w-full sm:w-auto">
                  ShearFrac Contacts
                </h1>
                {!isMobile && isSyncing && (
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Syncing...
                  </span>
                )}
                <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} isMobile={isMobile} />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                {!isMobile && (
                  <Button onClick={() => setCustomTypeDialogOpen(true)} variant="outline">
                    Add Custom Type
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex-1 sm:flex-initial">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {['client', 'frac', ...(customTypes || [])].map(type => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => handleAddContact(type)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add {type === 'client' ? 'Client' : type === 'frac' ? 'Frac' : type} Contact
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {isMobile && (
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={() => setAdvancedFiltersOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <ContactFilterChips
            typeCounts={typeCounts}
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
            onClearAll={handleClearFilters}
            customTypes={customTypes}
          />

          <EnhancedSearch
            contacts={contacts}
            onSearch={handleSearch}
            onAdvancedFilter={() => setAdvancedFiltersOpen(true)}
            className="mb-4"
          />

          <DuplicateDetection
            contacts={contacts}
            onMergeContacts={handleMergeContacts}
            onDeleteContact={async (contactId) => {
              try {
                await deleteContact(contactId);
                toast.success('Contact deleted successfully');
              } catch (error) {
                toast.error('Failed to delete contact');
              }
            }}
          />

          <ErrorBoundary level="section">
              {viewMode === 'table' ? (
                <ContactsTableEnhanced
                  contacts={filteredContacts}
                  columns={currentColumns}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                  onColumnOrderChange={handleColumnOrderChange}
                  onBulkDelete={handleBulkDelete}
                />
              ) : viewMode === 'grouped' ? (
                <ContactsGroupedView
                  contacts={filteredContacts}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                />
              ) : (
                <RelationshipMap 
                  contacts={filteredContacts}
                  onContactSelect={handleEditContact}
                  className="w-full min-h-[400px]"
                />
              )}
          </ErrorBoundary>

          <ContactFormEnhanced
            contact={editingContact}
            contactType={editingContact?.type || newContactType}
            customTypes={customTypes}
            existingContacts={contacts}
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditingContact(undefined);
            }}
            onSubmit={handleSubmitContact}
          />

          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the contact.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={customTypeDialogOpen} onOpenChange={setCustomTypeDialogOpen}>
            <DialogContent className="max-w-[90%] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Custom Contact Type</DialogTitle>
                <DialogDescription>
                  Enter a name for the new custom contact type (e.g., Wireline, Pumpdown, Data).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                  <Label htmlFor="customType" className="sm:text-right">
                    Type Name
                  </Label>
                  <Input
                    id="customType"
                    value={newCustomType}
                    onChange={(e) => setNewCustomType(e.target.value)}
                    className="sm:col-span-3"
                    placeholder="e.g., Wireline"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setCustomTypeDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddCustomType} className="w-full sm:w-auto">Add Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AdvancedFilterPanel
            contacts={contacts}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            open={advancedFiltersOpen}
            onOpenChange={setAdvancedFiltersOpen}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
