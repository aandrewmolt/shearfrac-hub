
import { TrackedEquipment, EquipmentDeploymentHistory } from '@/types/equipment';

export const useTrackedEquipmentStorage = () => {
  const loadData = () => {
    try {
      const historyData = localStorage.getItem('deployment-history');
      
      if (historyData) {
        const parsed = JSON.parse(historyData);
        return parsed.map((item: unknown) => ({
          ...item,
          deploymentDate: new Date(item.deploymentDate),
          returnDate: item.returnDate ? new Date(item.returnDate) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to load deployment history:', error);
      return [];
    }
  };

  const saveData = (trackedEquipment: TrackedEquipment[], deploymentHistory: EquipmentDeploymentHistory[]) => {
    try {
      localStorage.setItem('tracked-equipment', JSON.stringify(trackedEquipment));
      localStorage.setItem('deployment-history', JSON.stringify(deploymentHistory));
    } catch (error) {
      console.error('Failed to save tracked equipment data:', error);
    }
  };

  const loadExistingTrackedEquipment = (): TrackedEquipment[] => {
    const existingData = localStorage.getItem('tracked-equipment');
    let existingEquipment: TrackedEquipment[] = [];
    
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        existingEquipment = parsed.map((item: unknown) => ({
          ...item,
          lastUpdated: new Date(item.lastUpdated),
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
        }));
      } catch (error) {
        console.error('Failed to parse existing tracked equipment:', error);
      }
    }
    
    return existingEquipment;
  };

  return {
    loadData,
    saveData,
    loadExistingTrackedEquipment,
  };
};
