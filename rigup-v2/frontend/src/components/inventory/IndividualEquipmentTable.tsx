import React, { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, ExternalLink, Briefcase, Home, Wrench } from 'lucide-react';
import { IndividualEquipment, InventoryData } from '@/types/inventory';
import { EquipmentConflict } from '@/types/equipment-allocation';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '@/hooks/useJobs';

interface IndividualEquipmentTableProps {
  filteredEquipment: IndividualEquipment[];
  data: InventoryData;
  onStatusChange: (itemId: string, status: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired') => void;
  getEquipmentTypeName: (typeId: string) => string;
  getEquipmentTypeCategory: (typeId: string) => string;
  getLocationName: (locationId: string) => string;
  getStatusColor: (status: string) => string;
  getCategoryColor: (category: string) => string;
  conflicts?: EquipmentConflict[];
  getEquipmentStatus?: (equipmentId: string) => 'available' | 'allocated' | 'deployed' | 'unavailable';
}

const IndividualEquipmentTable: React.FC<IndividualEquipmentTableProps> = ({
  filteredEquipment,
  data,
  onStatusChange,
  getEquipmentTypeName,
  getEquipmentTypeCategory,
  getLocationName,
  getStatusColor,
  getCategoryColor,
  conflicts = [],
  getEquipmentStatus,
}) => {
  const navigate = useNavigate();
  const { jobs } = useJobs();
  
  const getConflictForEquipment = (equipmentId: string) => {
    return conflicts.find(c => c.equipmentId === equipmentId);
  };
  
  const getJobName = useCallback((jobId: string | null): string => {
    if (!jobId) return '';
    const job = jobs.find(j => j.id === jobId);
    if (!job) return `Job #${jobId.substring(0, 8)}`;
    
    // Format as "Client - JobName"
    const clientName = job.clientName || 'Unknown Client';
    return `${clientName} - ${job.name}`;
  }, [jobs]);
  
  // Group equipment by deployment status and job
  const groupedEquipment = React.useMemo(() => {
    const groups: {
      jobDeployments: { [jobId: string]: { jobName: string; equipment: IndividualEquipment[] } };
      available: IndividualEquipment[];
      other: IndividualEquipment[];
    } = {
      jobDeployments: {},
      available: [],
      other: []
    };

    filteredEquipment.forEach(item => {
      if (item.status === 'deployed' && item.jobId) {
        const jobName = getJobName(item.jobId);
        if (!groups.jobDeployments[item.jobId]) {
          groups.jobDeployments[item.jobId] = { jobName, equipment: [] };
        }
        groups.jobDeployments[item.jobId].equipment.push(item);
      } else if (item.status === 'available') {
        groups.available.push(item);
      } else if (item.status === 'maintenance' || item.status === 'red-tagged' || item.status === 'retired') {
        // Only items that actually need attention
        groups.other.push(item);
      } else if (item.status === 'deployed' && !item.jobId) {
        // Deployed but no job ID - show in available section with deployed status
        groups.available.push(item);
      }
    });

    return groups;
  }, [filteredEquipment, getJobName]);

  if (filteredEquipment.length === 0) {
    return (
      <div className="text-center py-8 text-corporate-silver">
        <p>No individual equipment items found</p>
        <p className="text-sm">Individual equipment items are tracked with unique IDs</p>
      </div>
    );
  }

  const renderEquipmentRow = (item: IndividualEquipment, index: number, showJobBadge: boolean = false) => {
    const conflict = getConflictForEquipment(item.equipmentId);
    const syncStatus = getEquipmentStatus ? getEquipmentStatus(item.equipmentId) : item.status;
    
    return (
      <TableRow key={item.id || item.equipmentId || `equipment-${index}`} className={conflict ? 'bg-status-danger/20' : ''}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {item.equipmentId}
            {conflict && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Double-booked:</p>
                    <p className="text-sm">Current: {conflict.currentJobName}</p>
                    <p className="text-sm">Requested: {conflict.requestedJobName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
        <TableCell>{item.name}</TableCell>
        <TableCell>{getEquipmentTypeName(item.typeId)}</TableCell>
        <TableCell>
          <Badge className={getCategoryColor(getEquipmentTypeCategory(item.typeId))}>
            {getEquipmentTypeCategory(item.typeId)}
          </Badge>
        </TableCell>
        <TableCell>
          {showJobBadge && item.jobId ? (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-muted flex items-center gap-1"
              onClick={() => navigate(`/jobs?edit=${item.jobId}`)}
            >
              <Briefcase className="h-3 w-3" />
              {getJobName(item.jobId)}
              <ExternalLink className="h-3 w-3" />
            </Badge>
          ) : (
            <span className="text-corporate-silver text-sm">{getLocationName(item.locationId)}</span>
          )}
        </TableCell>
        <TableCell>
          <Select 
            value={syncStatus === 'unavailable' ? 'red-tagged' : syncStatus} 
            onValueChange={(value: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired') => {
              if (item.id) {
                onStatusChange(item.id, value);
              } else {
                console.error('Cannot update status: item.id is undefined', item);
              }
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="red-tagged">Red Tagged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>{item.serialNumber || '-'}</TableCell>
        <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
      </TableRow>
    );
  };

  // If we have deployed equipment, show grouped view
  const hasDeployments = Object.keys(groupedEquipment.jobDeployments).length > 0;
  
  if (hasDeployments || groupedEquipment.other.length > 0) {
    return (
      <div className="space-y-6">
        {/* Jobs with Deployed Equipment */}
        {Object.entries(groupedEquipment.jobDeployments).map(([jobId, { jobName, equipment }]) => (
          <div key={jobId} className="border rounded-lg overflow-hidden">
            <div className="bg-status-info/20 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-foreground" />
                {jobName}
                <Badge className="bg-status-info/20 text-status-info">{equipment.length} items deployed</Badge>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/jobs?edit=${jobId}`)}
                className="flex items-center gap-1"
              >
                View Job Diagram
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item, index) => renderEquipmentRow(item, index, false))}
              </TableBody>
            </Table>
          </div>
        ))}
        
        {/* Available Equipment */}
        {groupedEquipment.available.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-status-success/20 px-4 py-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-foreground" />
                Available Equipment at Storage Locations
                <Badge className="bg-status-success/20 text-status-success">{groupedEquipment.available.length} items</Badge>
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedEquipment.available.map((item, index) => renderEquipmentRow(item, index, false))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Other Status Equipment */}
        {groupedEquipment.other.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-status-warning/20 px-4 py-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5 text-foreground" />
                Equipment Needing Attention
                <Badge className="bg-status-warning/20 text-status-warning">{groupedEquipment.other.length} items</Badge>
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedEquipment.other.map((item, index) => renderEquipmentRow(item, index, true))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  // Fallback to regular table if no special grouping needed
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Equipment ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Serial Number</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEquipment.map((item, index) => renderEquipmentRow(item, index, true))}
      </TableBody>
    </Table>
  );
};

export default IndividualEquipmentTable;