import { useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { migrateCableTypeId } from '@/utils/consolidated/migrationUtils';
import { toast } from 'sonner';

export const useEdgeMigration = () => {
  const migrateEdges = useCallback((edges: Edge[], setEdges: (edges: Edge[]) => void) => {
    console.log('Starting edge migration...');
    
    let migratedCount = 0;
    const migratedEdges = edges.map(edge => {
      if (edge.data?.cableTypeId && ['1', '2', '3', '4'].includes(edge.data.cableTypeId)) {
        const oldId = edge.data.cableTypeId;
        const newId = migrateCableTypeId(oldId);
        
        console.log(`Migrating edge ${edge.id}: ${oldId} → ${newId}`);
        migratedCount++;
        
        return {
          ...edge,
          data: {
            ...edge.data,
            cableTypeId: newId,
          },
        };
      }
      return edge;
    });
    
    if (migratedCount > 0) {
      setEdges(migratedEdges);
      toast.success(`Migrated ${migratedCount} cable connections to new format`);
      console.log(`Migration complete: ${migratedCount} edges updated`);
    } else {
      console.log('No edges needed migration');
    }
    
    return migratedCount;
  }, []);
  
  return { migrateEdges };
};