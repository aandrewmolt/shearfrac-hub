
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '@/hooks/useJobs';
import { EquipmentConflict } from '@/types/equipment-allocation';

interface EquipmentTableProps {
  filteredEquipment: unknown[];
  data: {
    storageLocations: Array<{ id: string; name: string; }>;
    equipmentTypes: Array<{ id: string; name: string; category: string; }>;
  };
  onEdit: (item: unknown) => void;
  onDelete: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: 'available' | 'deployed' | 'red-tagged') => void;
  getEquipmentTypeName: (typeId: string) => string;
  getEquipmentTypeCategory: (typeId: string) => string;
  getLocationName: (locationId: string) => string;
  getStatusColor: (status: string) => string;
  getCategoryColor: (category: string) => string;
  onClearFilters: () => void;
  conflicts?: EquipmentConflict[];
  getEquipmentStatus?: (equipmentId: string) => 'available' | 'allocated' | 'deployed' | 'unavailable';
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  filteredEquipment,
  data,
  onEdit,
  onDelete,
  onStatusChange,
  getEquipmentTypeName,
  getEquipmentTypeCategory,
  getLocationName,
  getStatusColor,
  getCategoryColor,
  onClearFilters,
  conflicts = [],
  getEquipmentStatus,
}) => {
  const navigate = useNavigate();
  const { jobs } = useJobs();
  
  const getConflictForEquipment = (equipmentId: string) => {
    return conflicts.find(c => c.equipmentId === equipmentId);
  };
  
  const getJobName = (jobId: string | null): string => {
    if (!jobId) return '';
    const job = jobs.find(j => j.id === jobId);
    return job?.name || `Job #${jobId}`;
  };
  if (filteredEquipment.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-corporate-silver mb-4">No equipment found matching your filters.</p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipment Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEquipment.map((item) => {
            const conflict = getConflictForEquipment(item.id);
            const syncStatus = getEquipmentStatus ? getEquipmentStatus(item.id) : item.status;
            
            return (
              <TableRow key={item.id} className={conflict ? 'bg-status-danger/20' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getEquipmentTypeName(item.typeId)}
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
              <TableCell>
                <Badge className={getCategoryColor(getEquipmentTypeCategory(item.typeId))}>
                  {getEquipmentTypeCategory(item.typeId)}
                </Badge>
              </TableCell>
              <TableCell>{getLocationName(item.locationId)}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    value={syncStatus}
                    onValueChange={(value) => onStatusChange(item.id, value as 'available' | 'deployed' | 'red-tagged')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge className={getStatusColor(syncStatus)}>
                          {syncStatus}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="deployed">Deployed</SelectItem>
                      <SelectItem value="red-tagged">Red Tagged</SelectItem>
                    </SelectContent>
                  </Select>
                  {item.jobId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-card flex items-center gap-1"
                            onClick={() => navigate(`/jobs?edit=${item.jobId}`)}
                          >
                            {getJobName(item.jobId)}
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to view job diagram</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {item.notes || '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default EquipmentTable;
