import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugEquipmentInfoProps {
  data: unknown;
  title?: string;
}

export const DebugEquipmentInfo: React.FC<DebugEquipmentInfoProps> = ({ 
  data, 
  title = 'Debug Info' 
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs overflow-auto max-h-60">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

// Add default export for compatibility
export default DebugEquipmentInfo;