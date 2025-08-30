
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useEquipmentMigration } from '@/hooks/inventory/useEquipmentMigration';

const EquipmentMigrationButton = () => {
  const { migrateEquipmentNaming } = useEquipmentMigration();

  return (
    <Button 
      onClick={migrateEquipmentNaming}
      variant="outline"
      className="bg-muted border-border text-foreground hover:bg-muted"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Fix Equipment IDs
    </Button>
  );
};

export default EquipmentMigrationButton;
