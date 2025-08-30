import React from 'react';
import { WifiOff, Wifi, Cable, Calendar, Users, Package, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';
import { JobDiagram } from '@/hooks/useJobs';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import EmptyJobsState from './EmptyJobsState';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobsListProps {
  jobs: JobDiagram[];
  isLoading: boolean;
  onSelectJob: (job: JobDiagram) => void;
  onDeleteJob: (job: JobDiagram) => void;
  onCompleteJob?: (job: JobDiagram, endDate: string) => void;
  onUpdateJobName?: (jobId: string, newName: string) => void;
}

const JobsList: React.FC<JobsListProps> = ({ 
  jobs, 
  isLoading, 
  onSelectJob, 
  onDeleteJob, 
  onCompleteJob, 
  onUpdateJobName 
}) => {
  const { data, getDeployedEquipment } = useUnifiedInventory();
  const isOnline = navigator.onLine;
  const isMobile = useIsMobile();

  const getDeployedEquipmentForJob = (jobId: string) => {
    return getDeployedEquipment(jobId).map(item => ({
      id: item.id,
      typeId: item.equipmentTypeId,
      quantity: 1,
      typeName: data?.equipmentTypes?.find(type => type.id === item.equipmentTypeId)?.name || 'Unknown',
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-muted text-foreground border-border';
      case 'active': return 'bg-muted text-foreground border-border';
      case 'completed': return 'bg-muted text-foreground border-border';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 sm:p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return <EmptyJobsState />;
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-card rounded-lg p-3 sm:p-4 border">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 sm:h-5 w-4 sm:w-5 text-success" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {isMobile ? 'Connected' : 'Connected to Turso'}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 sm:h-5 w-4 sm:w-5 text-destructive" />
              <span className="text-xs sm:text-sm font-medium text-destructive">
                {isMobile ? 'Offline' : 'No Internet Connection'}
              </span>
            </>
          )}
        </div>
        {jobs.length > 0 && (
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
          </Badge>
        )}
      </div>

      {/* Jobs Grid */}
      <div className={cn(
        "grid gap-3 sm:gap-4",
        isMobile 
          ? "grid-cols-1" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {jobs.map((job) => {
          const deployedEquipment = getDeployedEquipmentForJob(job.id);
          const status = job.status || 'pending';
          
          return (
            <Card 
              key={job.id}
              className={cn(
                "group relative transition-all hover:shadow-lg cursor-pointer",
                "active:scale-[0.98]",
                isMobile && "touch-target"
              )}
              onClick={() => onSelectJob(job)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">
                      {job.name}
                    </CardTitle>
                    {job.client && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        {job.client}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs capitalize",
                        getStatusColor(status)
                      )}
                    >
                      {status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Job
                        </DropdownMenuItem>
                        
                        {status !== 'completed' && onCompleteJob && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            const endDate = new Date().toISOString();
                            onCompleteJob(job, endDate);
                          }}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete job "${job.name}"?`)) {
                              onDeleteJob(job);
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Job Details */}
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Cable className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span>{job.wellCount || 0} Wells</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="truncate">{formatDate(job.createdAt)}</span>
                  </div>
                </div>

                {/* Equipment Summary */}
                {deployedEquipment.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Equipment ({deployedEquipment.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {deployedEquipment.slice(0, isMobile ? 3 : 5).map((item, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {item.typeName}
                        </Badge>
                      ))}
                      {deployedEquipment.length > (isMobile ? 3 : 5) && (
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          +{deployedEquipment.length - (isMobile ? 3 : 5)} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons - Mobile Only */}
                {isMobile && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectJob(job);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${job.name}"?`)) {
                          onDeleteJob(job);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default JobsList;