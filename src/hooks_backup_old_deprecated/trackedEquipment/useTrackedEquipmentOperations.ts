
import { TrackedEquipment, EquipmentDeploymentHistory } from '@/types/equipment';
import { toast } from 'sonner';

export const useTrackedEquipmentOperations = (
  trackedEquipment: TrackedEquipment[],
  setTrackedEquipment: React.Dispatch<React.SetStateAction<TrackedEquipment[]>>,
  deploymentHistory: EquipmentDeploymentHistory[],
  setDeploymentHistory: React.Dispatch<React.SetStateAction<EquipmentDeploymentHistory[]>>
) => {
  const deployEquipment = (
    equipmentId: string, 
    jobId: string, 
    jobName: string, 
    customName: string,
    location?: string
  ) => {
    const equipment = trackedEquipment.find(eq => eq.id === equipmentId);
    if (!equipment) {
      toast.error('Equipment not found');
      return;
    }

    if (equipment.status === 'deployed') {
      toast.error(`${equipment.name} is already deployed`);
      return;
    }

    // Update equipment status
    setTrackedEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: 'deployed', currentJobId: jobId, currentLocation: location, lastUpdated: new Date() }
        : eq
    ));

    // Add deployment history
    const historyEntry: EquipmentDeploymentHistory = {
      id: `deploy-${equipmentId}-${Date.now()}`,
      equipmentId,
      jobId,
      jobName,
      customNameUsed: customName,
      deploymentDate: new Date(),
      location,
    };

    setDeploymentHistory(prev => [...prev, historyEntry]);
    toast.success(`${equipment.name} deployed to ${jobName}`);
  };

  const returnEquipment = (equipmentId: string) => {
    const equipment = trackedEquipment.find(eq => eq.id === equipmentId);
    if (!equipment) return;

    // Update equipment status
    setTrackedEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: 'available', currentJobId: undefined, currentLocation: undefined, lastUpdated: new Date() }
        : eq
    ));

    // Update deployment history
    setDeploymentHistory(prev => prev.map(history => 
      history.equipmentId === equipmentId && !history.returnDate
        ? { ...history, returnDate: new Date() }
        : history
    ));

    toast.success(`${equipment.name} returned to inventory`);
  };

  const updateEquipment = (equipmentId: string, updates: Partial<TrackedEquipment>) => {
    setTrackedEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, ...updates, lastUpdated: new Date() }
        : eq
    ));
  };

  const getAvailableEquipment = (type?: TrackedEquipment['type']) => {
    return trackedEquipment.filter(eq => 
      eq.status === 'available' && (!type || eq.type === type)
    );
  };

  const getEquipmentHistory = (equipmentId: string) => {
    return deploymentHistory
      .filter(history => history.equipmentId === equipmentId)
      .sort((a, b) => b.deploymentDate.getTime() - a.deploymentDate.getTime());
  };

  return {
    deployEquipment,
    returnEquipment,
    updateEquipment,
    getAvailableEquipment,
    getEquipmentHistory,
  };
};
