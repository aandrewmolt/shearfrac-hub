
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Package } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
// Removed Supabase realtime dependency
import { usePopulateIndividualEquipment } from '@/hooks/inventory/usePopulateIndividualEquipment';
import { toast } from 'sonner';

const DataSetupVerifier: React.FC = () => {
  const { data, isLoading } = useInventory();
  const { populateMissingIndividualEquipment } = usePopulateIndividualEquipment();
  const [verificationResults, setVerificationResults] = useState<{
    equipmentTypes: boolean;
    storageLocations: boolean;
    dataConsistency: boolean;
    individualEquipment: boolean;
  }>({
    equipmentTypes: false,
    storageLocations: false,
    dataConsistency: false,
    individualEquipment: false
  });

  useEffect(() => {
    const runVerification = () => {
      // Check equipment types
      const hasRequiredTypes = [
        'Customer Computer',
        'Starlink', 
        'ShearStream Box',
        '100ft Cable',
        '200ft Cable',
        '1502 Pressure Gauge',
        'Y-Adapter'
      ].every(requiredType => 
        data.equipmentTypes.some(type => type.name === requiredType)
      );
      
      // Also check for at least one 300ft cable variant
      const has300ftCable = data.equipmentTypes.some(type => 
        type.name === '300ft Cable (Old)' || type.name === '300ft Cable (New)'
      );
      
      const hasAllRequiredTypes = hasRequiredTypes && has300ftCable;

      // Check storage locations
      const hasStorageLocations = data.storageLocations.length > 0;

      // Check data consistency
      const allEquipmentTypesValid = data.equipmentItems.every(item => 
        data.equipmentTypes.some(type => type.id === item.typeId)
      );
      const allLocationsValid = data.equipmentItems.every(item =>
        data.storageLocations.some(location => location.id === item.locationId)
      );
      const dataConsistency = allEquipmentTypesValid && allLocationsValid;
      
      // Check individual equipment
      const hasIndividualEquipment = data.individualEquipment.length >= 20; // Expected minimum

      setVerificationResults({
        equipmentTypes: hasAllRequiredTypes,
        storageLocations: hasStorageLocations,
        dataConsistency,
        individualEquipment: hasIndividualEquipment
      });
    };

    if (!isLoading) {
      runVerification();
    }
  }, [data, isLoading]);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge className={status ? 'bg-muted text-foreground' : 'bg-muted text-destructive'}>
        {status ? 'OK' : 'Issues'}
      </Badge>
    );
  };

  const allSystemsGo = Object.values(verificationResults).every(Boolean);

  const handleForceSync = async () => {
    try {
      // Trigger a refresh of inventory data
      window.location.reload();
      toast.success('Data synchronized successfully');
    } catch (error) {
      toast.error('Failed to sync data');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Clock className="h-6 w-6 animate-spin mr-2" />
          <span>Verifying system setup...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Status</span>
          {allSystemsGo ? (
            <Badge className="bg-muted text-foreground">All Systems Operational</Badge>
          ) : (
            <Badge className="bg-muted text-foreground">Setup Required</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(verificationResults.equipmentTypes)}
              <div>
                <div className="font-medium">Equipment Types</div>
                <div className="text-sm text-corporate-silver">
                  {data.equipmentTypes.length} types configured
                </div>
              </div>
            </div>
            {getStatusBadge(verificationResults.equipmentTypes)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(verificationResults.storageLocations)}
              <div>
                <div className="font-medium">Storage Locations</div>
                <div className="text-sm text-corporate-silver">
                  {data.storageLocations.length} locations configured
                </div>
              </div>
            </div>
            {getStatusBadge(verificationResults.storageLocations)}
          </div>


          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(verificationResults.dataConsistency)}
              <div>
                <div className="font-medium">Data Consistency</div>
                <div className="text-sm text-corporate-silver">
                  All references valid
                </div>
              </div>
            </div>
            {getStatusBadge(verificationResults.dataConsistency)}
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(verificationResults.individualEquipment)}
              <div>
                <div className="font-medium">Individual Equipment</div>
                <div className="text-sm text-corporate-silver">
                  {data.individualEquipment.length} items tracked
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(verificationResults.individualEquipment)}
              {!verificationResults.individualEquipment && (
                <Button 
                  onClick={populateMissingIndividualEquipment} 
                  variant="outline" 
                  size="sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Populate
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Data Summary</div>
              <div className="text-sm text-corporate-silver">
                {data.equipmentItems.length} equipment items, {data.individualEquipment.length} individual items
              </div>
            </div>
            <Button onClick={handleForceSync} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Data
            </Button>
          </div>
        </div>

        {!allSystemsGo && (
          <div className="bg-status-warning/20 border border-border rounded-lg p-4">
            <div className="font-medium text-foreground">Setup Recommendations:</div>
            <ul className="mt-2 text-sm text-foreground space-y-1">
              {!verificationResults.equipmentTypes && (
                <li>• Visit Equipment Types tab to ensure all required types are configured</li>
              )}
              {!verificationResults.storageLocations && (
                <li>• Visit Storage Locations tab to add storage locations</li>
              )}
              {!verificationResults.dataConsistency && (
                <li>• Some equipment items reference invalid types or locations</li>
              )}
              {!verificationResults.individualEquipment && (
                <li>• Click "Populate" to create individual equipment items (CC01-CC18, SL01-SL09, etc.)</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSetupVerifier;
