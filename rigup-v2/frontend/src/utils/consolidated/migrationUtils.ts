// =============================================================================
// CABLE TYPE MIGRATION UTILITIES
// =============================================================================

// Types for diagram data migration
interface DiagramEdgeData {
  cable_type_id?: string;
  [key: string]: unknown;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  data?: DiagramEdgeData;
  [key: string]: unknown;
}

interface DiagramData {
  edges?: DiagramEdge[];
  [key: string]: unknown;
}

// Utility to handle cable type ID migration from old numeric IDs to new string IDs
export const migrateCableTypeId = (oldId: string): string => {
  const cableTypeMapping: { [key: string]: string } = {
    '1': '100ft-cable',
    '2': '200ft-cable', 
    '3': '300ft-cable-old',
    '4': '300ft-cable-new',
  };

  // If it's an old numeric ID, map it to the new string ID
  if (cableTypeMapping[oldId]) {
    return cableTypeMapping[oldId];
  }

  // If it's already a new string ID, return as-is
  return oldId;
};

// Helper to check if an ID is an old numeric format
export const isOldCableTypeId = (id: string): boolean => {
  return ['1', '2', '3', '4'].includes(id);
};

// Batch migrate cable type IDs in an array of objects
export const migrateCableTypeIds = <T extends { cable_type_id?: string }>(
  items: T[]
): T[] => {
  return items.map(item => ({
    ...item,
    cable_type_id: item.cable_type_id ? migrateCableTypeId(item.cable_type_id) : item.cable_type_id
  }));
};

// Migrate cable type IDs in diagram data
export const migrateDiagramCableTypes = (diagramData: unknown): DiagramData => {
  // Type guard to ensure we have valid diagram data
  if (!diagramData || typeof diagramData !== 'object' || diagramData === null) {
    return diagramData as DiagramData;
  }

  const data = diagramData as DiagramData;
  if (!data.edges || !Array.isArray(data.edges)) {
    return data;
  }

  return {
    ...data,
    edges: data.edges.map((edge: DiagramEdge) => ({
      ...edge,
      data: {
        ...edge.data,
        cable_type_id: edge.data?.cable_type_id 
          ? migrateCableTypeId(edge.data.cable_type_id)
          : edge.data?.cable_type_id
      }
    }))
  };
};