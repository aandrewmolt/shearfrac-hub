// Safe data access utilities to prevent production errors
// These utilities handle cases where data might be undefined during loading

export function safeArray<T>(data: T[] | undefined | null): T[] {
  return data || [];
}

export function safeForEach<T>(
  data: T[] | undefined | null,
  callback: (item: T, index: number) => void
): void {
  if (data && Array.isArray(data)) {
    data.forEach(callback);
  }
}

export function safeFilter<T>(
  data: T[] | undefined | null,
  predicate: (item: T) => boolean
): T[] {
  if (data && Array.isArray(data)) {
    return data.filter(predicate);
  }
  return [];
}

export function safeFind<T>(
  data: T[] | undefined | null,
  predicate: (item: T) => boolean
): T | undefined {
  if (data && Array.isArray(data)) {
    return data.find(predicate);
  }
  return undefined;
}

export function safeMap<T, U>(
  data: T[] | undefined | null,
  callback: (item: T, index: number) => U
): U[] {
  if (data && Array.isArray(data)) {
    return data.map(callback);
  }
  return [];
}

export function safeReduce<T, U>(
  data: T[] | undefined | null,
  callback: (acc: U, item: T, index: number) => U,
  initialValue: U
): U {
  if (data && Array.isArray(data)) {
    return data.reduce(callback, initialValue);
  }
  return initialValue;
}

export function safeLength(data: unknown[] | undefined | null): number {
  return data && Array.isArray(data) ? data.length : 0;
}

export function safeObject<T>(data: T | undefined | null): T | Record<string, never> {
  return data || {} as T;
}

export function safeString(data: string | undefined | null): string {
  return data || '';
}

export function safeNumber(data: number | undefined | null): number {
  return data || 0;
}