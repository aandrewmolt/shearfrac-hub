import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/AppHeader';
import LocationManagementPanel from '@/components/inventory/LocationManagementPanel';
import EquipmentTransferManager from '@/components/inventory/EquipmentTransferManager';
import RedTagDashboard from '@/components/inventory/RedTagDashboard';
import DataInitializationGuard from '@/components/inventory/DataInitializationGuard';
import { InitializeInventoryButton } from '@/components/inventory/InitializeInventoryButton';
import { CleanupDuplicatesButton } from '@/components/inventory/CleanupDuplicatesButton';
import { FixPressureGaugeButton } from '@/components/inventory/FixPressureGaugeButton';
import { RunMigration } from '@/components/RunMigration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building, ArrowRightLeft, AlertTriangle, Package, AlertCircle } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import EquipmentConflictDashboard from '@/components/inventory/EquipmentConflictDashboard';

const InventorySettings = () => {
  const { data, isLoading } = useInventory();

  // Calculate summary stats with safe access
  const availableItems = data?.equipmentItems?.filter(item => item.status === 'available').length || 0;
  const deployedItems = data?.equipmentItems?.filter(item => item.status === 'deployed').length || 0;
  const redTaggedItems = (data?.equipmentItems?.filter(item => item.status === 'red-tagged').length || 0) + 
                        (data?.individualEquipment?.filter(eq => eq.status === 'red-tagged').length || 0);

  return (
    <DataInitializationGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <AppHeader />
        
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider mb-2 inline-flex items-center gap-2 justify-center">
                <Settings className="h-8 w-8" />
                Inventory Management
              </h1>
              <p className="text-muted-foreground">
                Manage storage locations, transfer equipment, resolve conflicts, and track red-tagged items
              </p>
            </div>

            <Tabs defaultValue="locations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-muted">
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Locations
                </TabsTrigger>
                <TabsTrigger value="transfers" className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfers
                </TabsTrigger>
                <TabsTrigger value="conflicts" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Conflicts
                </TabsTrigger>
                <TabsTrigger value="redtag" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Red Tagged
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Overview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="locations">
                <LocationManagementPanel />
              </TabsContent>

              <TabsContent value="transfers">
                <EquipmentTransferManager />
              </TabsContent>

              <TabsContent value="conflicts">
                <EquipmentConflictDashboard />
              </TabsContent>

              <TabsContent value="redtag">
                <RedTagDashboard />
              </TabsContent>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 justify-center text-foreground">
                        <Package className="h-5 w-5" />
                        Equipment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Equipment Types</span>
                          <span className="font-bold text-foreground">{data?.equipmentTypes?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available Items</span>
                          <span className="font-bold text-foreground">{availableItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deployed Items</span>
                          <span className="font-bold text-foreground">{deployedItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Red Tagged Items</span>
                          <span className="font-bold text-destructive">{redTaggedItems}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 justify-center text-foreground">
                        <Building className="h-5 w-5" />
                        Location Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Storage Locations</span>
                          <span className="font-bold text-foreground">{data?.storageLocations?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Individual Equipment</span>
                          <span className="font-bold text-foreground">{data?.individualEquipment?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equipment Items</span>
                          <span className="font-bold text-foreground">{data?.equipmentItems?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 justify-center text-foreground">
                        <AlertTriangle className="h-5 w-5" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {isLoading ? (
                          <div className="p-2 bg-muted border border-border rounded text-sm">
                            <span className="text-muted-foreground">Loading inventory data...</span>
                          </div>
                        ) : redTaggedItems > 0 ? (
                          <div className="p-2 bg-destructive/20 border border-destructive rounded text-sm">
                            <span className="text-destructive">{redTaggedItems} items need attention (red tagged)</span>
                          </div>
                        ) : (
                          <div className="p-2 bg-green-500/20 border border-green-500 rounded text-sm">
                            <span className="text-green-500">All equipment in good condition</span>
                          </div>
                        )}
                        
                        <div className="p-2 bg-blue-500/20 border border-blue-500 rounded text-sm">
                          <span className="text-blue-500">System running normally</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 justify-center text-foreground">
                        <Package className="h-5 w-5" />
                        Inventory Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                          Initialize a complete inventory set with standard equipment items and cable quantities.
                        </p>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <InitializeInventoryButton />
                          <CleanupDuplicatesButton />
                          <FixPressureGaugeButton />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <RunMigration />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DataInitializationGuard>
  );
};

export default InventorySettings;
