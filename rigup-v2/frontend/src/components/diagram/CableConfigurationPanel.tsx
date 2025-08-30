
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, RotateCcw } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';

interface CableConfigurationPanelProps {
  selectedCableType: string;
  setSelectedCableType: (type: string) => void;
  addYAdapter: () => void;
  addCustomerComputer: () => void;
  clearDiagram: () => void;
  saveDiagram: () => void;
}

const CableConfigurationPanel: React.FC<CableConfigurationPanelProps> = ({
  selectedCableType,
  setSelectedCableType,
  addYAdapter,
  addCustomerComputer,
  clearDiagram,
  saveDiagram,
}) => {
  const { data } = useInventory();

  const cableTypes = data?.equipmentTypes?.filter(type => type.category === 'cables') || [];
  const selectedCable = cableTypes.find(cable => cable.id === selectedCableType);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Cable & Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Cable Type</label>
          <Select value={selectedCableType} onValueChange={setSelectedCableType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select cable type" />
            </SelectTrigger>
            <SelectContent>
              {cableTypes.map(cable => (
                <SelectItem key={cable.id} value={cable.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    {cable.name}
                    <Badge variant="outline" className="text-xs">
                      {cable.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCable && (
            <p className="text-xs text-muted-foreground mt-1">{selectedCable.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={addYAdapter} size="sm" variant="outline" className="text-xs h-8">
            <Plus className="h-3 w-3 mr-1" />
            Y Adapter
          </Button>
          <Button onClick={addCustomerComputer} size="sm" variant="outline" className="text-xs h-8">
            <Plus className="h-3 w-3 mr-1" />
            Computer
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button onClick={saveDiagram} size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700">
            <Download className="h-3 w-3 mr-1" />
            Export PNG
          </Button>
          <Button onClick={clearDiagram} size="sm" variant="destructive" className="text-xs h-8">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CableConfigurationPanel;
