
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield } from 'lucide-react';

interface MaintenanceAlert {
  equipmentId: string;
  equipmentName: string;
  message: string;
  severity: 'warning' | 'error';
  type: 'warranty' | 'maintenance' | 'lifecycle';
}

interface MaintenanceAlertPanelProps {
  alerts: MaintenanceAlert[];
  maxDisplay?: number;
  compact?: boolean;
}

const MaintenanceAlertPanel: React.FC<MaintenanceAlertPanelProps> = ({
  alerts,
  maxDisplay = 5,
  compact = false,
}) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'error');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  const getIcon = (type: string) => {
    switch (type) {
      case 'warranty': return Shield;
      case 'maintenance': return Clock;
      default: return AlertTriangle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warranty': return 'text-foreground';
      case 'maintenance': return 'text-foreground';
      default: return 'text-destructive';
    }
  };

  if (alerts.length === 0 && !compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-foreground">
            ✓ No maintenance alerts
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayAlerts = alerts.slice(0, maxDisplay);

  return (
    <Card className={compact ? 'border-border bg-muted' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-foreground" />
          Maintenance Alerts
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {criticalAlerts.length} Critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayAlerts.map((alert, index) => {
          const Icon = getIcon(alert.type);
          return (
            <div
              key={`${alert.equipmentId}-${index}`}
              className={`flex items-start gap-2 p-2 rounded text-sm ${
                alert.severity === 'error' ? 'bg-status-danger/20 border border-red-200' : 'bg-status-warning/20 border border-border'
              }`}
            >
              <Icon className={`h-4 w-4 mt-0.5 ${getTypeColor(alert.type)}`} />
              <div className="flex-1">
                <div className="font-medium">{alert.equipmentName}</div>
                <div className="text-xs text-corporate-silver">{alert.message}</div>
              </div>
              <Badge
                variant={alert.severity === 'error' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {alert.severity}
              </Badge>
            </div>
          );
        })}
        
        {alerts.length > maxDisplay && (
          <div className="text-center text-xs text-corporate-silver pt-2">
            +{alerts.length - maxDisplay} more alerts
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceAlertPanel;
