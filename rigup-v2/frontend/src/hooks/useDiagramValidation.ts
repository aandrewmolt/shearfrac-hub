
import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

export const useDiagramValidation = (nodes: Node[], edges: Edge[]) => {
  const handleValidateDiagram = useCallback(() => {
    console.log('Validating diagram integrity...');
    console.log('Nodes:', nodes.length);
    console.log('Edges:', edges.length);
    console.log('Edges with sourceHandle:', edges.filter(e => e.sourceHandle || e.data?.sourceHandle).length);
    
    const invalidEdges = edges.filter(e => !e.source || !e.target);
    if (invalidEdges.length > 0) {
      console.warn('Found invalid edges:', invalidEdges);
    } else {
      console.log('All edges are valid');
    }
  }, [nodes, edges]);

  return {
    handleValidateDiagram,
  };
};
