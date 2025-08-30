
import { Edge } from '@xyflow/react';
import { toast } from 'sonner';

export interface EdgeError {
  edgeId: string;
  type: 'connection' | 'validation' | 'toggle' | 'delete';
  message: string;
  severity: 'warning' | 'error';
}

export class EdgeErrorHandler {
  private static errors: Map<string, EdgeError> = new Map();

  static handleEdgeError(error: EdgeError): void {
    this.errors.set(error.edgeId, error);
    
    if (error.severity === 'error') {
      toast.error(`Edge Error: ${error.message}`);
    } else {
      toast.warning(`Edge Warning: ${error.message}`);
    }
    
  }

  static getEdgeError(edgeId: string): EdgeError | undefined {
    return this.errors.get(edgeId);
  }

  static hasError(edgeId: string): boolean {
    return this.errors.has(edgeId);
  }

  static validateEdgeOperation(edge: Edge, operation: string): boolean {
    try {
      // Basic validation
      if (!edge.id || !edge.source || !edge.target) {
        this.handleEdgeError({
          edgeId: edge.id || 'unknown',
          type: 'validation',
          message: `Invalid edge data for ${operation}`,
          severity: 'error'
        });
        return false;
      }

      return true;
    } catch (error) {
      this.handleEdgeError({
        edgeId: edge.id || 'unknown',
        type: 'validation',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
      return false;
    }
  }

  static handleConnectionError(sourceId: string, targetId: string, reason: string): void {
    this.handleEdgeError({
      edgeId: `${sourceId}-${targetId}`,
      type: 'connection',
      message: `Connection failed: ${reason}`,
      severity: 'warning'
    });
  }
}

// Create a singleton instance
let instance: typeof EdgeErrorHandler | null = null;

function getEdgeErrorHandler() {
  if (!instance) {
    instance = EdgeErrorHandler;
  }
  return instance;
}

// Export individual functions that call the singleton
export const handleEdgeError = (error: EdgeError) => {
  return getEdgeErrorHandler().handleEdgeError(error);
};

export const clearEdgeError = (edgeId: string) => {
  return getEdgeErrorHandler().clearEdgeError(edgeId);
};

export const getEdgeError = (edgeId: string) => {
  return getEdgeErrorHandler().getEdgeError(edgeId);
};

export const hasError = (edgeId: string) => {
  return getEdgeErrorHandler().hasError(edgeId);
};

export const validateEdgeOperation = (edge: Edge, operation: string) => {
  return getEdgeErrorHandler().validateEdgeOperation(edge, operation);
};

export const handleConnectionError = (sourceId: string, targetId: string, reason: string) => {
  return getEdgeErrorHandler().handleConnectionError(sourceId, targetId, reason);
};
