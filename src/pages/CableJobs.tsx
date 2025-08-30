import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AppHeader from '@/components/AppHeader';
import { useJobs } from '@/hooks/useJobs';
import JobsList from '@/components/jobs/JobsList';
import JobCreationDialog from '@/components/jobs/JobCreationDialog';
import JobDiagram from '@/components/JobDiagram';
import { useSearchParams } from 'react-router-dom';
import { useJobStorageIntegration } from '@/hooks/useJobStorageIntegration';
import { JobStatusControl } from '@/components/jobs/JobStatusControl';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useJobEquipmentTracking } from '@/hooks/equipment/useJobEquipmentTracking';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { JobDeletionDialog } from '@/components/jobs/JobDeletionDialog';

const CableJobs = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'client' | 'date' | 'status'>('date');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const { jobs, isLoading, saveJob, deleteJob, getJobById } = useJobs();
  const { ensureJobLocationExists } = useJobStorageIntegration();
  const { endAllJobUsageSessions } = useJobEquipmentTracking();
  const { data: inventoryData, updateIndividualEquipment } = useInventory();
  const isMobile = useIsMobile();
  
  type JobLike = {
    id: string;
    name: string;
    client?: string;
    status?: 'pending' | 'active' | 'completed';
    start_date?: string;
    end_date?: string;
    createdAt?: string | number | Date;
    nodes?: unknown[];
    edges?: unknown[];
    equipmentAllocated?: boolean;
    [key: string]: unknown;
  };

  // Check for edit parameter from URL (when navigating from inventory)
  useEffect(() => {
    const editJobId = searchParams.get('edit');
    if (editJobId && jobs.find(j => j.id === editJobId)) {
      setSelectedJobId(editJobId);
    }
  }, [searchParams, jobs]);

  const handleCreateJob = async (jobData: { name: string; client: string; pad: string; wellCount: number; hasWellsideGauge: boolean }) => {
    // First save the job
    saveJob({
      ...jobData,
      nodes: [],
      edges: [],
      equipmentAllocated: false,
    });
    
    // Then create a storage location for the job
    try {
      await ensureJobLocationExists(jobData.name);
    } catch (error) {
      console.error('Failed to create storage location for job:', error);
    }
    
    setShowCreateDialog(false);
  };

  const handleEditJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleBackToList = () => {
    setSelectedJobId(null);
  };

  const handleUpdateJobName = (jobId: string, newName: string) => {
    const job = getJobById(jobId);
    if (job) {
      saveJob({ ...job, name: newName });
    }
  };

  const handleCompleteJob = async (job: JobLike, endDate: string) => {
    // If job doesn't have a start date, set it to now
    const startDate = job.start_date || new Date().toISOString();
    
    // Automatically end all equipment usage sessions for this job
    await endAllJobUsageSessions(job.id);
    
    saveJob({
      ...job,
      status: 'completed',
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleDeleteJobRequest = (job: JobLike) => {
    setJobToDelete(job);
    setShowDeletionDialog(true);
  };

  const handleConfirmDelete = async (returnLocationId?: string) => {
    if (!jobToDelete) return;

    // Find all equipment currently deployed to this job
    const deployedEquipment = inventoryData.individualEquipment.filter(
      equipment => equipment.jobId === jobToDelete.id && equipment.status === 'deployed'
    );

    // If there's deployed equipment, return it to the selected location
    if (deployedEquipment.length > 0 && returnLocationId) {
      for (const equipment of deployedEquipment) {
        await updateIndividualEquipment(equipment.id, {
          status: 'available',
          jobId: null,
          locationId: returnLocationId
        });
      }
    }

    // End all equipment usage sessions for this job
    await endAllJobUsageSessions(jobToDelete.id);
    
    // Delete the job
    deleteJob(jobToDelete.id);
    
    // Reset state
    setJobToDelete(null);
    setShowDeletionDialog(false);
  };

  const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;

  // Get unique clients for filter dropdown
  const uniqueClients = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const clients = jobs
      .map(job => job.client)
      .filter((client): client is string => !!client);
    return [...new Set(clients)].sort();
  }, [jobs]);

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(query) ||
        (job.client && job.client.toLowerCase().includes(query))
      );
    }

    // Apply client filter
    if (filterClient !== 'all') {
      filtered = filtered.filter(job => job.client === filterClient);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => {
        const jobStatus = job.status || 'pending';
        return jobStatus === filterStatus;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'client':
          return (a.client || '').localeCompare(b.client || '');
        case 'date': {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime(); // Newest first
        }
        case 'status': {
          const statusOrder = { 'pending': 0, 'active': 1, 'completed': 2 };
          const aStatus = a.status || 'pending';
          const bStatus = b.status || 'pending';
          return statusOrder[aStatus] - statusOrder[bStatus];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, searchQuery, filterClient, filterStatus, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterClient('all');
    setFilterStatus('all');
    setSortBy('date');
  };

  const hasActiveFilters = Boolean(searchQuery.trim()) || filterClient !== 'all' || filterStatus !== 'all';

  if (selectedJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <AppHeader />
        <div className="p-3 sm:p-4">
          <div className="max-w-full lg:max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <Button onClick={handleBackToList} variant="outline" className="h-9 sm:h-10">
                  ← Back to Jobs
                </Button>
                <JobStatusControl 
                  job={selectedJob}
                  onUpdateStatus={(updates) => saveJob({ ...selectedJob, ...updates })}
                />
              </div>
              <Button 
                onClick={() => saveJob({ ...selectedJob })}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-10"
              >
                Save Job
              </Button>
            </div>
            <JobDiagram job={selectedJob} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      
      <div className="p-3 sm:p-4">
        <div className="max-w-full lg:max-w-6xl mx-auto">
          <div className="mb-4 sm:mb-6 text-center">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Jobs Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage job diagrams. All diagrams are saved and accessible to your entire team.
            </p>
            <div className="flex justify-center mt-4">
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          {isMobile ? (
            // Mobile Filter Sheet
            <div className="bg-card rounded-lg border border-border p-3 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-10 bg-background border-input"
                />
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 relative"
                      aria-label="Filter and sort"
                      aria-expanded={mobileFiltersOpen}
                      aria-controls="mobile-filters-panel"
                    >
                      <Filter className="h-4 w-4" />
                      {hasActiveFilters && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[80vh] bg-card" id="mobile-filters-panel">
                    <SheetHeader>
                      <SheetTitle>Filter & Sort</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      {/* Client Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Client</Label>
                        <Select value={filterClient} onValueChange={setFilterClient}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {uniqueClients.map(client => (
                              <SelectItem key={client} value={client}>{client}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Status</Label>
                        <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'active' | 'completed') => setFilterStatus(value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={(value: 'name' | 'client' | 'date' | 'status') => setSortBy(value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date (Newest)</SelectItem>
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                            <SelectItem value="client">Client (A-Z)</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            clearFilters();
                            setMobileFiltersOpen(false);
                          }}
                          className="flex-1"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="flex-1"
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filterClient !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filterClient}
                      <Button
                        onClick={() => setFilterClient('all')}
                        variant="ghost" 
                        size="sm"
                        className="ml-1 h-auto p-0 hover:bg-transparent"
                        aria-label="Clear client filter"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filterStatus}
                      <Button
                        onClick={() => setFilterStatus('all')}
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0 hover:bg-transparent"
                        aria-label="Clear status filter"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Desktop Filters
            <div className="bg-card rounded-lg border border-border p-4 mb-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 w-full">
                  <Input
                    placeholder="Search jobs by name or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border-input"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {/* Client Filter */}
                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {uniqueClients.map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'active' | 'completed') => setFilterStatus(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={(value: 'name' | 'client' | 'date' | 'status') => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date (Newest)</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="client">Client (A-Z)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>
                    Showing {filteredAndSortedJobs.length} of {jobs?.length ?? 0} jobs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-foreground hover:text-foreground"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}

          <JobsList
            jobs={filteredAndSortedJobs}
            isLoading={isLoading}
            onSelectJob={(job) => handleEditJob(job.id)}
            onDeleteJob={handleDeleteJobRequest}
            onCompleteJob={handleCompleteJob}
            onUpdateJobName={handleUpdateJobName}
          />

          <JobCreationDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreateJob={handleCreateJob}
          />

          <JobDeletionDialog
            open={showDeletionDialog}
            onOpenChange={setShowDeletionDialog}
            onConfirm={handleConfirmDelete}
            jobName={jobToDelete?.name || ''}
            deployedEquipment={jobToDelete ? inventoryData.individualEquipment
              .filter(equipment => equipment.jobId === jobToDelete.id && equipment.status === 'deployed')
              .map(equipment => ({
                id: equipment.id,
                typeId: equipment.typeId,
                quantity: 1,
                typeName: equipment.name || equipment.equipmentId || 'Unknown Equipment'
              })) : []}
          />
        </div>
      </div>
    </div>
  );
};

export default CableJobs;
