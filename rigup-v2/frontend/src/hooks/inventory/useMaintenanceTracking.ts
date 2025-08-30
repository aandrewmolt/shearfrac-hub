
import { useMemo } from 'react';
import { IndividualEquipment } from '@/types/inventory';

interface MaintenanceAlert {
  equipmentId: string;
  equipmentName: string;
  message: string;
  severity: 'warning' | 'error';
  type: 'warranty' | 'maintenance' | 'lifecycle';
}

export const useMaintenanceTracking = (individualEquipment: IndividualEquipment[]) => {
  const alerts = useMemo(() => {
    const now = new Date();
    const maintenanceAlerts: MaintenanceAlert[] = [];

    individualEquipment.forEach(equipment => {
      // Warranty expiry alerts
      if (equipment.warrantyExpiry) {
        const daysUntilExpiry = Math.ceil(
          (equipment.warrantyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          maintenanceAlerts.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            message: `Warranty expires in ${daysUntilExpiry} days`,
            severity: daysUntilExpiry <= 7 ? 'error' : 'warning',
            type: 'warranty',
          });
        } else if (daysUntilExpiry <= 0) {
          maintenanceAlerts.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            message: 'Warranty has expired',
            severity: 'error',
            type: 'warranty',
          });
        }
      }

      // Age-based maintenance alerts
      if (equipment.purchaseDate) {
        const monthsSincePurchase = Math.floor(
          (now.getTime() - equipment.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsSincePurchase >= 12) {
          maintenanceAlerts.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            message: `Equipment is ${monthsSincePurchase} months old - consider maintenance`,
            severity: monthsSincePurchase >= 24 ? 'error' : 'warning',
            type: 'maintenance',
          });
        }
      }

      // Status-based alerts
      if (equipment.status === 'red-tagged') {
        maintenanceAlerts.push({
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          message: equipment.redTagReason || 'Equipment is red-tagged',
          severity: 'error',
          type: 'lifecycle',
        });
      }

      if (equipment.status === 'maintenance') {
        maintenanceAlerts.push({
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          message: 'Equipment is under maintenance',
          severity: 'warning',
          type: 'maintenance',
        });
      }
    });

    return maintenanceAlerts;
  }, [individualEquipment]);

  const criticalCount = alerts.filter(alert => alert.severity === 'error').length;
  const warningCount = alerts.filter(alert => alert.severity === 'warning').length;
  const totalAlertsCount = alerts.length;

  return {
    maintenanceAlerts: alerts,
    criticalCount,
    warningCount,
    totalAlertsCount,
  };
};
