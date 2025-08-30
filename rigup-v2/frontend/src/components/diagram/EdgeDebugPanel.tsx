import React from 'react';
import { Edge } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug } from 'lucide-react';

interface EdgeDebugPanelProps {
  edges: Edge[];
}

const EdgeDebugPanel: React.FC<EdgeDebugPanelProps> = ({ edges }) => {
  // Group edges by cable type
  const edgesByCableType = edges.reduce((acc, edge) => {
    const cableTypeId = (edge.data as { cableTypeId?: string })?.cableTypeId || 'NO_CABLE_TYPE_ID';
    if (!acc[cableTypeId]) {
      acc[cableTypeId] = [];
    }
    acc[cableTypeId].push(edge);
    return acc;
  }, {} as Record<string, Edge[]>);

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-96 overflow-auto bg-card/95 backdrop-blur shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bug className="h-4 w-4" />
          Edge Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="font-semibold">Total Edges: {edges.length}</div>
        
        <div className="space-y-2">
          <div className="font-semibold">Edges by Cable Type:</div>
          {Object.entries(edgesByCableType).map(([cableTypeId, edgesOfType]) => (
            <div key={cableTypeId} className="ml-2 space-y-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={cableTypeId === 'NO_CABLE_TYPE_ID' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {cableTypeId}
                </Badge>
                <span className="text-muted-foreground">({edgesOfType.length} edges)</span>
              </div>
              {edgesOfType.map((edge, idx) => (
                <div key={edge.id} className="ml-4 text-xs text-muted-foreground">
                  {idx + 1}. {edge.source} → {edge.target} 
                  {edge.label && <span className="ml-1">({edge.label})</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-2">
          <div className="font-semibold">All Edge Details:</div>
          {edges.map((edge, index) => {
            const data = edge.data as { 
              cableTypeId?: string;
              label?: string;
              isYConnection?: boolean;
              equipmentId?: string;
            };
            return (
              <div key={edge.id} className="ml-2 p-2 bg-muted rounded text-xs space-y-1">
                <div className="font-medium">Edge {index + 1}:</div>
                <div className="ml-2 space-y-0.5">
                  <div>ID: {edge.id}</div>
                  <div>Source: {edge.source} → Target: {edge.target}</div>
                  <div>Type: {edge.type || 'default'}</div>
                  <div>Connection Type: {data?.connectionType || 'not set'}</div>
                  <div className={data?.cableTypeId ? 'text-foreground' : 'text-destructive font-semibold'}>
                    Cable Type ID: {data?.cableTypeId || 'MISSING!'}
                  </div>
                  <div>Label: {edge.label || data?.label || 'none'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EdgeDebugPanel;