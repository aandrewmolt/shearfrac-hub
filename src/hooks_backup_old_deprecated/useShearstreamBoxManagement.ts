
import { useCallback } from 'react';

interface UseShearstreamBoxManagementProps {
  selectedShearstreamBoxes: string[];
  setSelectedShearstreamBoxes: (boxes: string[]) => void;
  addShearstreamBox: () => void;
  removeShearstreamBox: (boxId: string) => void;
  returnEquipment: (equipmentId: string) => Promise<void>;
}

export const useShearstreamBoxManagement = ({
  selectedShearstreamBoxes,
  setSelectedShearstreamBoxes,
  addShearstreamBox,
  removeShearstreamBox,
  returnEquipment,
}: UseShearstreamBoxManagementProps) => {
  const handleAddShearstreamBox = useCallback(() => {
    addShearstreamBox();
    const newBoxes = [...selectedShearstreamBoxes, ''];
    setSelectedShearstreamBoxes(newBoxes);
  }, [addShearstreamBox, selectedShearstreamBoxes, setSelectedShearstreamBoxes]);

  const handleRemoveShearstreamBox = useCallback((index: number) => {
    // Return equipment if assigned
    if (selectedShearstreamBoxes[index]) {
      returnEquipment(selectedShearstreamBoxes[index]);
    }
    
    // Remove the node
    const boxNodeId = index === 0 ? 'main-box' : `main-box-${index + 1}`;
    removeShearstreamBox(boxNodeId);
    
    // Update selected boxes array
    const newBoxes = selectedShearstreamBoxes.filter((_, i) => i !== index);
    setSelectedShearstreamBoxes(newBoxes);
  }, [selectedShearstreamBoxes, returnEquipment, removeShearstreamBox, setSelectedShearstreamBoxes]);

  return {
    handleAddShearstreamBox,
    handleRemoveShearstreamBox,
  };
};
