import * as React from 'react';
import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

/**
 * Memory Leak Prevention Utilities
 * Provides hooks and utilities to prevent common memory leaks in React applications
 */

/**
 * Tracks whether a component is mounted to prevent state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Provides a safe setState that only updates if component is mounted
 */
export function useSafeState<T>(initialState: T | (() => T)) {
  const [state, setState] = React.useState(initialState);
  const isMounted = useIsMounted();

  const setSafeState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      if (isMounted()) {
        setState(newState);
      }
    },
    [isMounted]
  );

  return [state, setSafeState] as const;
}

/**
 * Manages abort controllers for cancellable operations
 */
export function useAbortController(): [
  AbortController,
  () => void,
  MutableRefObject<AbortController>
] {
  const abortControllerRef = useRef(new AbortController());

  const reset = useCallback(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
  }, []);

  useEffect(() => {
    const controller = abortControllerRef.current;
    return () => {
      controller.abort();
    };
  }, []);

  return [abortControllerRef.current, reset, abortControllerRef];
}

/**
 * Cancellable async operations with automatic cleanup
 */
export function useCancellableAsync<T>() {
  const isMounted = useIsMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      asyncFunction: (signal: AbortSignal) => Promise<T>
    ): Promise<T | undefined> => {
      // Cancel any previous operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const result = await asyncFunction(signal);
        if (isMounted() && !signal.aborted) {
          return result;
        }
      } catch (error) {
        if (!signal.aborted && isMounted()) {
          throw error;
        }
      }
      return undefined;
    },
    [isMounted]
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return execute;
}

/**
 * Manages event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Manages intervals with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Manages timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        savedCallback.current();
      }, delay);
    }
  }, [delay]);

  useEffect(() => {
    reset();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, reset]);

  return reset;
}

/**
 * Cleanup function manager for complex cleanup operations
 */
export class CleanupManager {
  private cleanupFunctions: Array<() => void> = [];
  private isCleanedUp = false;

  add(cleanup: () => void): void {
    if (this.isCleanedUp) {
      cleanup();
    } else {
      this.cleanupFunctions.push(cleanup);
    }
  }

  cleanup(): void {
    if (this.isCleanedUp) return;
    
    this.isCleanedUp = true;
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}

/**
 * Hook for managing cleanup operations
 */
export function useCleanupManager(): CleanupManager {
  const managerRef = useRef(new CleanupManager());

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager.cleanup();
    };
  }, []);

  return managerRef.current;
}

/**
 * Resource pool for managing shared resources
 */
export class ResourcePool<T> {
  private resources: Map<string, T> = new Map();
  private refCounts: Map<string, number> = new Map();
  private cleanupFns: Map<string, () => void> = new Map();

  acquire(
    key: string,
    factory: () => T,
    cleanup?: (resource: T) => void
  ): T {
    if (!this.resources.has(key)) {
      this.resources.set(key, factory());
      this.refCounts.set(key, 0);
      if (cleanup) {
        this.cleanupFns.set(key, () => cleanup(this.resources.get(key)!));
      }
    }

    this.refCounts.set(key, (this.refCounts.get(key) || 0) + 1);
    return this.resources.get(key)!;
  }

  release(key: string): void {
    const count = this.refCounts.get(key);
    if (!count) return;

    if (count === 1) {
      const cleanup = this.cleanupFns.get(key);
      if (cleanup) cleanup();
      
      this.resources.delete(key);
      this.refCounts.delete(key);
      this.cleanupFns.delete(key);
    } else {
      this.refCounts.set(key, count - 1);
    }
  }

  clear(): void {
    this.cleanupFns.forEach(cleanup => cleanup());
    this.resources.clear();
    this.refCounts.clear();
    this.cleanupFns.clear();
  }
}

/**
 * Hook for managing resource pools
 */
export function useResourcePool<T>(): ResourcePool<T> {
  const poolRef = useRef(new ResourcePool<T>());

  useEffect(() => {
    const pool = poolRef.current;
    return () => {
      pool.clear();
    };
  }, []);

  return poolRef.current;
}

/**
 * WeakMap-based cache for preventing memory leaks with object keys
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Hook for using WeakCache
 */
export function useWeakCache<K extends object, V>(): WeakCache<K, V> {
  const cacheRef = useRef(new WeakCache<K, V>());
  return cacheRef.current;
}

/**
 * Memory usage monitor
 */
export function useMemoryMonitor(threshold: number = 100 * 1024 * 1024) {
  const [isHighMemory, setIsHighMemory] = React.useState(false);

  useEffect(() => {
    if (!performance.memory) return;

    const checkMemory = () => {
      const usedMemory = performance.memory.usedJSHeapSize;
      setIsHighMemory(usedMemory > threshold);
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory();

    return () => clearInterval(interval);
  }, [threshold]);

  return isHighMemory;
}

/**
 * Disposable pattern for cleanup
 */
export interface IDisposable {
  dispose(): void;
}

export class DisposableStore implements IDisposable {
  private disposables: Set<IDisposable> = new Set();

  add<T extends IDisposable>(disposable: T): T {
    this.disposables.add(disposable);
    return disposable;
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables.clear();
  }
}

/**
 * Hook for disposable store
 */
export function useDisposableStore(): DisposableStore {
  const storeRef = useRef(new DisposableStore());

  useEffect(() => {
    const store = storeRef.current;
    return () => {
      store.dispose();
    };
  }, []);

  return storeRef.current;
}
