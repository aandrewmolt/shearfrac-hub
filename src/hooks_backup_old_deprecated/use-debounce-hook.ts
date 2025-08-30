import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Hook that delays updating a value until after a specified delay
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 * @param callback The callback to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook that provides debounced state management
 * @param initialValue The initial state value
 * @param delay The delay in milliseconds
 * @returns A tuple of [value, debouncedValue, setValue]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

/**
 * Hook that tracks whether a value is being debounced
 * @param value The value to track
 * @param debouncedValue The debounced value
 * @returns Whether the value is currently being debounced
 */
export function useIsDebouncing<T>(value: T, debouncedValue: T): boolean {
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(value !== debouncedValue);
  }, [value, debouncedValue]);

  return isDebouncing;
}

/**
 * Hook for debouncing search input with loading state
 */
export function useDebouncedSearch(
  delay: number = 300
): {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
} {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const isSearching = useIsDebouncing(searchTerm, debouncedSearchTerm);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    isSearching,
    clearSearch,
  };
}

/**
 * Hook for debouncing form validation
 */
export function useDebouncedValidation<T>(
  value: T,
  validator: (value: T) => Promise<string | null> | string | null,
  delay: number = 500
): {
  error: string | null;
  isValidating: boolean;
} {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      setIsValidating(true);
      
      try {
        const validationError = await validator(debouncedValue);
        
        if (!cancelled) {
          setError(validationError);
          setIsValidating(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Validation error occurred');
          setIsValidating(false);
        }
      }
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [debouncedValue, validator]);

  return { error, isValidating };
}

/**
 * Hook for debouncing API calls with abort support
 */
export function useDebouncedAPI<T, R>(
  apiCall: (value: T, signal: AbortSignal) => Promise<R>,
  delay: number = 500
): {
  call: (value: T) => void;
  data: R | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedCall = useDebouncedCallback(async (value: T) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(value, abortControllerRef.current.signal);
      setData(result);
      setLoading(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, delay);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    call: debouncedCall,
    data,
    loading,
    error,
  };
}
