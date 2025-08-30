
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { toast } from 'sonner';
import { EquipmentItem } from '@/types/types';

const InventoryConsistencyValidator: React.FC = () => {
  const { data, updateEquipment } = useUnifiedInventory();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    issues: string[];
    warnings: string[];
    fixed: string[];
  } | null>(null);

  const runComprehensiveValidation = async () => {
    setIsValidating(true);
    setValidationResults({ issues: [], warnings: [], fixed: [] });

    try {
      const issues: string[] = [];
      const warnings: string[] = [];
      const fixed: string[] = [];
      const updatedItems = [...data.equipmentItems];

      // Check for duplicate deployments
      const deploymentMap = new Map<string, EquipmentItem[]>();
      data.equipmentItems.forEach(item => {
        if (item.status === 'deployed' && item.jobId) {
          const key = `${item.typeId}-${item.jobId}`;
          if (!deploymentMap.has(key)) {
            deploymentMap.set(key, []);
          }
          deploymentMap.get(key)!.push(item);
        }
      });

      deploymentMap.forEach((items, key) => {
        if (items.length > 1) {
          issues.push(`Duplicate deployments found for ${key} (${items.length} records)`);
          
          // Auto-fix: consolidate duplicates
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          const firstItem = items[0];
          
          // Remove duplicates and update first item
          items.slice(1).forEach(item => {
            const index = updatedItems.findIndex(i => i.id === item.id);
            if (index !== -1) {
              updatedItems.splice(index, 1);
            }
          });
          
          // Update first item with consolidated quantity
          const firstIndex = updatedItems.findIndex(i => i.id === firstItem.id);
          if (firstIndex !== -1) {
            updatedItems[firstIndex].quantity = totalQuantity;
            updatedItems[firstIndex].lastUpdated = new Date();
          }
          
          fixed.push(`Consolidated ${items.length} duplicate records for ${key}`);
        }
      });

      // Check for negative quantities
      data.equipmentItems.forEach(item => {
        if (item.quantity < 0) {
          issues.push(`Negative quantity found: ${item.quantity} for type ${item.typeId}`);
          
          // Auto-fix: set to 0
          const index = updatedItems.findIndex(i => i.id === item.id);
          if (index !== -1) {
            updatedItems[index].quantity = 0;
            updatedItems[index].lastUpdated = new Date();
            fixed.push(`Reset negative quantity to 0 for type ${item.typeId}`);
          }
        }
      });

      // Check for orphaned equipment items
      data.equipmentItems.forEach(item => {
        const typeExists = data?.equipmentTypes?.find(type => type.id === item.typeId);
        const locationExists = data?.storageLocations?.find(loc => loc.id === item.locationId);
        
        if (!typeExists) {
          issues.push(`Equipment item references non-existent type: ${item.typeId}`);
        }
        if (!locationExists) {
          issues.push(`Equipment item references non-existent location: ${item.locationId}`);
        }
      });

      // Check for missing minimum inventory
      const defaultLocation = data?.storageLocations?.find(loc => loc.isDefault);
      if (defaultLocation) {
        data.equipmentTypes.forEach(type => {
          if (!type.requiresIndividualTracking) {
            const availableStock = data.equipmentItems
              .filter(item => 
                item.typeId === type.id && 
                item.locationId === defaultLocation.id && 
                item.status === 'available'
              )
              .reduce((sum, item) => sum + item.quantity, 0);

            if (availableStock < 5) {
              warnings.push(`Low stock for ${type.name} at ${defaultLocation.name}: ${availableStock}`);
            }
          }
        });
      }

      // Apply fixes if any
      if (fixed.length > 0) {
        updateEquipmentItems(updatedItems);
        toast.success(`Applied ${fixed.length} automatic fixes`);
      }

      setValidationResults({ issues, warnings, fixed });
      
      if (issues.length === 0 && warnings.length === 0) {
        toast.success('Inventory validation passed - all systems consistent');
      } else {
        toast.warning(`Validation completed: ${issues.length} issues, ${warnings.length} warnings`);
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed - check console for details');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Inventory Consistency Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runComprehensiveValidation}
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Run Comprehensive Validation
            </>
          )}
        </Button>

        {validationResults && (
          <div className="space-y-3">
            {validationResults.issues.length > 0 && (
              <Alert className="border-red-200 bg-status-danger/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <div className="font-medium mb-1">Issues Found ({validationResults.issues.length})</div>
                  <ul className="text-sm space-y-1">
                    {validationResults.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResults.warnings.length > 0 && (
              <Alert className="border-border bg-status-warning/20">
                <AlertTriangle className="h-4 w-4 text-foreground" />
                <AlertDescription className="text-foreground">
                  <div className="font-medium mb-1">Warnings ({validationResults.warnings.length})</div>
                  <ul className="text-sm space-y-1">
                    {validationResults.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResults.fixed.length > 0 && (
              <Alert className="border-border bg-status-success/20">
                <CheckCircle className="h-4 w-4 text-foreground" />
                <AlertDescription className="text-foreground">
                  <div className="font-medium mb-1">Auto-Fixed ({validationResults.fixed.length})</div>
                  <ul className="text-sm space-y-1">
                    {validationResults.fixed.map((fix, index) => (
                      <li key={index}>• {fix}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResults.issues.length === 0 && validationResults.warnings.length === 0 && (
              <Alert className="border-border bg-status-success/20">
                <CheckCircle className="h-4 w-4 text-foreground" />
                <AlertDescription className="text-foreground">
                  All inventory data is consistent and properly tracked!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryConsistencyValidator;
