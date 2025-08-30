
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Save, Package } from 'lucide-react';

interface IndividualEquipmentHeaderProps {
  draftCount: number;
  onSaveDrafts: () => void;
  onOpenForm: () => void;
  onBulkCreate?: () => void;
}

const IndividualEquipmentHeader: React.FC<IndividualEquipmentHeaderProps> = ({
  draftCount,
  onSaveDrafts,
  onOpenForm,
  onBulkCreate,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Individual Equipment Management
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {draftCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSaveDrafts}
                className="text-foreground border-border hover:bg-muted"
              >
                <Save className="h-3 w-3 mr-1" />
                Save {draftCount} Drafts
              </Button>
            )}
            
            <Button size="sm" onClick={onOpenForm}>
              <Plus className="h-3 w-3 mr-1" />
              Add One
            </Button>
            
            {onBulkCreate && (
              <Button size="sm" variant="outline" onClick={onBulkCreate}>
                <Users className="h-3 w-3 mr-1" />
                Bulk Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default IndividualEquipmentHeader;
