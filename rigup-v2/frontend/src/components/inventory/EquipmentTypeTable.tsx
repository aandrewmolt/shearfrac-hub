import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EquipmentTypeTableProps {
  filteredTypes: unknown[];
  data: {
    equipmentTypes: Array<{ id: string; name: string; category: string; description?: string; defaultIdPrefix?: string; }>;
  };
  canDeleteEquipmentType: (typeId: string) => { canDelete: boolean; reason?: string; details?: string[] };
  getEquipmentCountForType: (typeId: string) => {
    equipmentItems: number;
    individualEquipment: number;
    totalQuantity: number;
  };
  getCategoryColor: (category: string) => string;
  onEdit: (type: { id: string; name: string; category: string; description?: string; }) => void;
  onDelete: (typeId: string, typeName: string) => void;
}

const EquipmentTypeTable: React.FC<EquipmentTypeTableProps> = ({
  filteredTypes,
  data,
  canDeleteEquipmentType,
  getEquipmentCountForType,
  getCategoryColor,
  onEdit,
  onDelete,
}) => {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; typeId: string; typeName: string; details?: string[] }>({
    open: false,
    typeId: '',
    typeName: '',
    details: []
  });

  const handleDeleteClick = (typeId: string, typeName: string) => {
    const { canDelete, details } = canDeleteEquipmentType(typeId);
    
    if (!canDelete) {
      setDeleteDialog({
        open: true,
        typeId,
        typeName,
        details
      });
    } else {
      // If no linked equipment, proceed with deletion
      onDelete(typeId, typeName);
    }
  };

  const handleConfirmDelete = () => {
    toast.error(`Cannot delete "${deleteDialog.typeName}" - it has linked equipment. Remove equipment from the Inventory tab first.`);
    setDeleteDialog({ open: false, typeId: '', typeName: '', details: [] });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[100px]">Prefix</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px] text-center">Equipment</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No equipment types found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTypes.map((type) => {
                const equipmentCounts = getEquipmentCountForType(type.id);
                const totalCount = equipmentCounts.individualEquipment;
                const { canDelete } = canDeleteEquipmentType(type.id);
                
                return (
                  <TableRow key={type.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      {type.defaultIdPrefix ? (
                        <Badge variant="outline" className="font-mono">
                          {type.defaultIdPrefix}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(type.category)}>
                        {type.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {totalCount > 0 ? (
                        <Badge variant="secondary">
                          {totalCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate block max-w-[300px]">
                        {type.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(type)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(type.id, type.name)}
                          className={`h-8 w-8 p-0 ${!canDelete ? 'text-amber-600 hover:text-amber-700' : 'hover:text-destructive'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Warning Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cannot Delete Equipment Type
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-3">
                <p>
                  The equipment type <strong>"{deleteDialog.typeName}"</strong> cannot be deleted because it has linked equipment.
                </p>
                {deleteDialog.details && deleteDialog.details.length > 0 && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">Linked Equipment:</p>
                    <ul className="space-y-1">
                      {deleteDialog.details.map((detail, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  To delete this equipment type, first remove or reassign all linked equipment from the Inventory tab.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => setDeleteDialog({ open: false, typeId: '', typeName: '', details: [] })}
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentTypeTable;