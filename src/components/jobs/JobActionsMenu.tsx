import React, { useState, useMemo } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, MoreVertical } from 'lucide-react';
import { JobDiagram } from '@/hooks/useJobs';
import { JobCompletionDialog } from './JobCompletionDialog';
import { JobDeletionDialog } from './JobDeletionDialog';
import { useInventory } from '@/contexts/InventoryContext';
import { useEquipmentDeployment } from '@/hooks/equipment/useEquipmentDeployment';

interface JobActionsMenuProps {
  job: JobDiagram;
  onCompleteJob: (job: JobDiagram, endDate: string) => void;
  onDeleteJob: (job: JobDiagram) => void;
}

export const JobActionsMenu: React.FC<JobActionsMenuProps> = ({
  job,
  onCompleteJob,
  onDeleteJob,
}) => {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const { data, updateIndividualEquipment } = useInventory();
  const { returnEquipment } = useEquipmentDeployment();

  // Find all equipment currently deployed to this job
  const deployedEquipment = useMemo(() => {
    return data?.individualEquipment?.filter(
      equipment => equipment.jobId === job.id && equipment.status === 'deployed'
    );
  }, [data.individualEquipment, job.id]);

  const handleComplete = (endDate: string) => {
    onCompleteJob(job, endDate);
    setShowCompletionDialog(false);
  };

  const handleDelete = async (returnLocationId?: string) => {
    // If there's deployed equipment, return it to the selected location
    if (deployedEquipment.length > 0 && returnLocationId) {
      for (const equipment of deployedEquipment) {
        if (equipment.equipmentId) {
          // Update equipment to set it to available and move it to the selected location
          await updateIndividualEquipment(equipment.id, {
            status: 'available',
            jobId: null,
            locationId: returnLocationId
          });
        }
      }
    }
    
    onDeleteJob(job);
    setShowDeletionDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            onClick={(e) => e.stopPropagation()}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {job.status !== 'completed' && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowCompletionDialog(true);
              }}
              className="text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Job
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeletionDialog(true);
            }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <JobCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onComplete={handleComplete}
        jobName={job.name}
      />

      <JobDeletionDialog
        open={showDeletionDialog}
        onOpenChange={setShowDeletionDialog}
        onConfirm={handleDelete}
        jobName={job.name}
        hasEquipment={deployedEquipment.length > 0}
        deployedEquipment={deployedEquipment.map(equipment => ({
          id: equipment.id,
          typeId: equipment.typeId,
          quantity: 1,
          typeName: equipment.name || equipment.equipmentId || 'Unknown Equipment'
        }))}
      />
    </>
  );
};