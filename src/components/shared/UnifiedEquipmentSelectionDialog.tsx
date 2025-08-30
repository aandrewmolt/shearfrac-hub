import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Monitor, Satellite, Square, AlertTriangle, CheckCircle, Tablet } from 'lucide-react';
import { useEquipmentCRUDManager } from '@/hooks/equipment/managers/useEquipmentCRUDManager';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { JobEquipmentAssignment } from '@/types/equipment';

interface UnifiedEquipmentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    assignment: JobEquipmentAssignment | {
      shearstreamBoxes: string[];
      starlink?: string;
      customerComputers: string[];
    },
    customNames?: {
      shearstreamBox?: string;
      starlink?: string;
      customerComputers: Record<string, string>;
    }
  ) => void;
  jobId: string;
  jobName: string;
  hasWellsideGauge: boolean;
  customerComputerCount: number;
  shearstreamBoxCount?: number;
  variant?: 'basic' | 'enhanced' | 'compact'; // Controls features and validation
}

export const UnifiedEquipmentSelectionDialog: React.FC<UnifiedEquipmentSelectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobId,
  jobName,
  hasWellsideGauge,
  customerComputerCount,
  shearstreamBoxCount = 1,
  variant = 'enhanced'
}) => {
  const { data } = useInventory();
  const { getAvailableEquipmentByType, getEquipmentByStatus } = useEquipmentCRUDManager();
  const { 
    validateEquipmentAvailability, 
    getEquipmentStatus, 
    conflicts, 
    resolveConflict 
  } = useUnifiedEquipmentSync();
  
  const [selectedShearstreamBoxes, setSelectedShearstreamBoxes] = useState<string[]>([]);
  const [selectedStarlink, setSelectedStarlink] = useState<string>('');
  const [selectedCustomerComputers, setSelectedCustomerComputers] = useState<string[]>([]);
  
  const [shearstreamBoxName, setShearstreamBoxName] = useState('ShearStream Box');
  const [starlinkName, setStarlinkName] = useState('Starlink');
  const [customerComputerNames, setCustomerComputerNames] = useState<Record<string, string>>({});
  
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [currentConflicts, setCurrentConflicts] = useState<{ equipmentId: string; currentJobId: string; currentJobName: string }[]>([]);

  const availableSSBoxes = getAvailableEquipmentByType('ShearStream Box');
  const availableStarlinks = getAvailableEquipmentByType('Starlink');
  const availableComputers = getAvailableEquipmentByType('Customer Computer');
  const availableTablets = getAvailableEquipmentByType('Customer Tablet');
  const allCustomerDevices = [...availableComputers, ...availableTablets];

  const handleShearstreamBoxSelect = (index: number, equipmentId: string) => {
    const newSelection = [...selectedShearstreamBoxes];
    newSelection[index] = equipmentId;
    setSelectedShearstreamBoxes(newSelection);
  };

  const handleCustomerComputerSelect = (index: number, equipmentId: string) => {
    const newSelection = [...selectedCustomerComputers];
    newSelection[index] = equipmentId;
    setSelectedCustomerComputers(newSelection);
    
    // Set default name if not already set
    if (!customerComputerNames[equipmentId] && variant === 'enhanced') {
      const equipment = allCustomerDevices.find(eq => eq.id === equipmentId);
      if (equipment) {
        setCustomerComputerNames(prev => ({
          ...prev,
          [equipmentId]: equipment.name
        }));
      }
    }
  };

  // Enhanced validation for enhanced variant
  useEffect(() => {
    if (variant !== 'enhanced') return;

    const validateSelection = async () => {
      setIsValidating(true);
      const results: Record<string, boolean> = {};
      
      for (const [index, equipmentId] of selectedShearstreamBoxes.entries()) {
        if (equipmentId) {
          results[`shearstream-${index}`] = await validateEquipmentAvailability(equipmentId, jobId);
        }
      }
      
      if (selectedStarlink) {
        results.starlink = await validateEquipmentAvailability(selectedStarlink, jobId);
      }
      
      for (const [index, equipmentId] of selectedCustomerComputers.entries()) {
        if (equipmentId) {
          results[`computer-${index}`] = await validateEquipmentAvailability(equipmentId, jobId);
        }
      }
      
      setValidationResults(results);
      setIsValidating(false);
    };
    
    if (isOpen) {
      validateSelection();
    }
  }, [selectedShearstreamBoxes, selectedStarlink, selectedCustomerComputers, jobId, isOpen, validateEquipmentAvailability, variant]);
  
  // Filter conflicts for enhanced variant
  useEffect(() => {
    if (variant !== 'enhanced') return;

    const relevantConflicts = conflicts.filter(conflict => {
      return conflict.requestedJobId === jobId && (
        selectedShearstreamBoxes.includes(conflict.equipmentId) ||
        conflict.equipmentId === selectedStarlink ||
        selectedCustomerComputers.includes(conflict.equipmentId)
      );
    });
    setCurrentConflicts(relevantConflicts);
  }, [conflicts, selectedShearstreamBoxes, selectedStarlink, selectedCustomerComputers, jobId, variant]);

  const handleConfirm = async () => {
    // Validation checks for enhanced variant
    if (variant === 'enhanced') {
      const allValid = Object.values(validationResults).every(result => result);
      
      if (!allValid && currentConflicts.length === 0) {
        return;
      }
      
      if (currentConflicts.length > 0) {
        return;
      }
    }
    
    // Create assignment based on variant
    let assignment: JobEquipmentAssignment | {
      shearstreamBoxes: string[];
      starlink?: string;
      customerComputers: string[];
    };
    let customNames: {
      shearstreamBox?: string;
      starlink?: string;
      customerComputers: Record<string, string>;
    } | undefined;

    if (variant === 'enhanced') {
      assignment = {
        shearstreamBoxIds: selectedShearstreamBoxes.filter(Boolean),
        starlinkId: selectedStarlink || undefined,
        customerComputerIds: selectedCustomerComputers.filter(Boolean),
      };

      customNames = {
        shearstreamBox: shearstreamBoxName,
        starlink: starlinkName,
        customerComputers: customerComputerNames,
      };
    } else {
      assignment = {
        shearstreamBoxes: selectedShearstreamBoxes.filter(Boolean),
        starlink: selectedStarlink || undefined,
        customerComputers: selectedCustomerComputers.filter(Boolean),
      };
    }

    onConfirm(assignment, variant === 'enhanced' ? customNames : undefined);
    onClose();
  };

  const getLastDeployment = (equipmentId: string) => {
    if (variant !== 'enhanced') return null;
    const history = getEquipmentHistory(equipmentId);
    return history.length > 0 ? history[0] : null;
  };

  const getEquipmentStatusBadge = (equipmentId: string) => {
    if (variant === 'basic' || variant === 'compact') {
      return (
        <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
          Available
        </Badge>
      );
    }

    const status = getEquipmentStatus(equipmentId);
    
    switch (status) {
      case 'available':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case 'allocated':
      case 'deployed': {
        const conflict = currentConflicts.find(c => c.equipmentId === equipmentId);
        if (conflict) {
          return (
            <Badge variant="outline" className="ml-2 text-xs bg-muted text-destructive border-red-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              In use by {conflict.currentJobName}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status === 'allocated' ? 'Allocated' : 'Deployed'}
          </Badge>
        );
      }
      default:
        return null;
    }
  };

  const handleResolveConflict = async (conflict: { equipmentId: string; currentJobId: string; currentJobName: string }) => {
    if (variant !== 'enhanced') return;

    await resolveConflict(conflict, 'requested');
    // Re-validate after resolving
    const results = { ...validationResults };
    const conflictEquipmentIndex = selectedShearstreamBoxes.indexOf(conflict.equipmentId);
    if (conflictEquipmentIndex !== -1) {
      results[`shearstream-${conflictEquipmentIndex}`] = true;
    } else if (conflict.equipmentId === selectedStarlink) {
      results.starlink = true;
    } else {
      const index = selectedCustomerComputers.indexOf(conflict.equipmentId);
      if (index !== -1) {
        results[`computer-${index}`] = true;
      }
    }
    setValidationResults(results);
  };

  const canConfirm = selectedShearstreamBoxes.filter(Boolean).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {variant === 'compact' ? 'Assign Equipment to' : 'Select Equipment for'} {jobName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Conflict Alert - Enhanced variant only */}
          {variant === 'enhanced' && currentConflicts.length > 0 && (
            <Alert className="border-red-200 bg-muted">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <div className="font-semibold mb-2">Equipment Conflicts Detected</div>
                {currentConflicts.map((conflict, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="text-sm">
                      {conflict.equipmentName} is currently assigned to {conflict.currentJobName}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveConflict(conflict)}
                      className="ml-2"
                    >
                      Reassign to this job
                    </Button>
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* ShearStream Boxes Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              <Label className="font-semibold">
                ShearStream Boxes ({shearstreamBoxCount} needed)
              </Label>
            </div>
            {Array.from({ length: shearstreamBoxCount }, (_, index) => (
              <div key={index} className="space-y-2">
                <Label>ShearStream Box {index + 1}</Label>
                <Select 
                  value={selectedShearstreamBoxes[index] || ''} 
                  onValueChange={(value) => handleShearstreamBoxSelect(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ShearStream Box" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {availableSSBoxes
                      .filter(eq => !selectedShearstreamBoxes.includes(eq.id) || selectedShearstreamBoxes[index] === eq.id)
                      .map(equipment => {
                        const lastDeployment = getLastDeployment(equipment.id);
                        const equipmentId = equipment.equipmentId || equipment.id;
                        return (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{equipmentId} {equipment.name ? `- ${equipment.name}` : ''}</span>
                              <div className="flex items-center">
                                {getEquipmentStatusBadge(equipment.id)}
                                {lastDeployment && variant === 'enhanced' && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Last: {lastDeployment.jobName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {variant === 'enhanced' && selectedShearstreamBoxes[index] && (
                  <div>
                    <Label>Custom Name for Job</Label>
                    <Input
                      value={shearstreamBoxName}
                      onChange={(e) => setShearstreamBoxName(e.target.value)}
                      placeholder="ShearStream Box"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Starlink Selection */}
          {hasWellsideGauge && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4" />
                <Label className="font-semibold">Starlink</Label>
              </div>
              <Select value={selectedStarlink} onValueChange={setSelectedStarlink}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Starlink" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {availableStarlinks.map(equipment => {
                    const lastDeployment = getLastDeployment(equipment.id);
                    const equipmentId = equipment.equipmentId || equipment.id;
                    return (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{equipmentId} {equipment.name ? `- ${equipment.name}` : ''}</span>
                          <div className="flex items-center">
                            {getEquipmentStatusBadge(equipment.id)}
                            {lastDeployment && variant === 'enhanced' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Last: {lastDeployment.jobName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {variant === 'enhanced' && selectedStarlink && (
                <div>
                  <Label>Custom Name for Job</Label>
                  <Input
                    value={starlinkName}
                    onChange={(e) => setStarlinkName(e.target.value)}
                    placeholder="Starlink"
                  />
                </div>
              )}
            </div>
          )}

          {/* Customer Computers Selection */}
          {customerComputerCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <Label className="font-semibold">Customer Computers/Tablets ({customerComputerCount} needed)</Label>
              </div>
              {Array.from({ length: customerComputerCount }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Label>Device {index + 1}</Label>
                  <Select 
                    value={selectedCustomerComputers[index] || ''} 
                    onValueChange={(value) => handleCustomerComputerSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Computer or Tablet" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {allCustomerDevices
                        .filter(eq => !selectedCustomerComputers.includes(eq.id) || selectedCustomerComputers[index] === eq.id)
                        .map(equipment => {
                          const equipmentId = equipment.equipmentId || equipment.id;
                          const isTablet = equipmentId.startsWith('CT');
                          const lastDeployment = getLastDeployment(equipment.id);
                          return (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              <div className="flex items-center gap-2 w-full">
                                {isTablet ? <Tablet className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                <span>{equipmentId} {equipment.name ? `- ${equipment.name}` : ''}</span>
                                <div className="flex items-center ml-auto">
                                  <Badge variant="outline" className="text-xs">
                                    {isTablet ? 'Tablet' : 'Computer'}
                                  </Badge>
                                  {getEquipmentStatusBadge(equipment.id)}
                                  {lastDeployment && variant === 'enhanced' && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Last: {lastDeployment.jobName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  {variant === 'enhanced' && selectedCustomerComputers[index] && (
                    <div>
                      <Label>Custom Name for Job</Label>
                      <Input
                        value={customerComputerNames[selectedCustomerComputers[index]] || ''}
                        onChange={(e) => setCustomerComputerNames(prev => ({
                          ...prev,
                          [selectedCustomerComputers[index]]: e.target.value
                        }))}
                        placeholder={`Customer Computer ${index + 1}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> Selected equipment will be marked as deployed and 
              {variant === 'enhanced' ? ' tracked throughout the job lifecycle. Custom names are used only for this job while maintaining equipment identity.' : ' assigned to this job.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={
              !canConfirm || 
              (variant === 'enhanced' && (currentConflicts.length > 0 || isValidating))
            }
          >
            {variant === 'enhanced' && isValidating 
              ? 'Validating...' 
              : variant === 'enhanced' && currentConflicts.length > 0 
                ? 'Resolve Conflicts First' 
                : variant === 'compact' 
                  ? 'Assign Equipment' 
                  : 'Select Equipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedEquipmentSelectionDialog;