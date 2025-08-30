
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cable } from 'lucide-react';

const ConnectionGuide: React.FC = () => {
  return (
    <Card className="bg-muted border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-foreground flex items-center gap-2 text-base">
          <Cable className="h-4 w-4" />
          Cable Connection Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-foreground space-y-1 pt-0">
        <p><strong>300ft Reels (Old):</strong> Connect from Main Box → Y Adapter → Wells (direct connection from Y adapter)</p>
        <p><strong>300ft Cables/Reels (New):</strong> Connect from Main Box - Direct to Well</p>
        <p><strong>200ft Cables:</strong> Connect directly Main Box → Well (can't add Y connect to 200ft Cables/Reels)</p>
        <p><strong>100ft Cables:</strong> Can connect through Y Adapter or directly to wells/gauges</p>
        <p><strong>Y Adapters:</strong> Can connect directly to wells and wellside gauges without cable restrictions (does not connect directly to main box)</p>
        <p><strong>Pressure Ports:</strong> P1(COM1,2) | P2(COM3,4) | P3(COM5,6) | P4(COM7,8)</p>
        <p><strong>Delete Connections:</strong> Select any cable connection and press Delete key</p>
      </CardContent>
    </Card>
  );
};

export default ConnectionGuide;
