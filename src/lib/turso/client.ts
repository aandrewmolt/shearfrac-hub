import { createClient } from '@libsql/client/web';

// Lazy initialization to avoid environment variable issues
let tursoClient: ReturnType<typeof createClient> | null = null;

// Mock client for local development without a Turso database
class MockTursoClient {
  private storage: Map<string, unknown[]> = new Map();
  
  async execute(sql: string | any, params?: unknown[]) {
    // Simple mock implementation for basic queries
    const sqlString = String(sql || '');
    const upperSql = sqlString.toUpperCase();
    
    if (upperSql.includes('SELECT 1')) {
      return { rows: [{ '1': 1 }], columns: ['1'] };
    }
    
    if (upperSql.includes('CREATE TABLE')) {
      return { rows: [], columns: [] };
    }
    
    if (upperSql.includes('SELECT') && upperSql.includes('FROM')) {
      const tableMatch = sqlString.match(/FROM\s+(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : '';
      const rows = this.storage.get(tableName) || [];
      return { rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] };
    }
    
    if (upperSql.includes('INSERT INTO')) {
      const tableMatch = sqlString.match(/INSERT INTO\s+(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : '';
      if (!this.storage.has(tableName)) {
        this.storage.set(tableName, []);
      }
      const tableData = this.storage.get(tableName)!;
      tableData.push({ id: Date.now().toString(), ...params });
      return { rows: [], columns: [] };
    }
    
    return { rows: [], columns: [] };
  }
  
  async batch(statements: { sql: string; params?: unknown[] }[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await this.execute(stmt.sql, stmt.params));
    }
    return results;
  }
}

export function getTursoClient() {
  if (!tursoClient) {
    const dbUrl = import.meta.env.VITE_TURSO_DATABASE_URL;
    
    // AWS API mode - use mock client (data comes from AWS DynamoDB)
    if (!dbUrl || dbUrl === '' || dbUrl.startsWith('file:')) {
      // Silent initialization - all data operations go through AWS API
      tursoClient = new MockTursoClient() as unknown as typeof tursoClient;
    } else {
      // Create real Turso client
      tursoClient = createClient({
        url: dbUrl,
        authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
      });
    }
  }
  return tursoClient;
}

// Export using Proxy for lazy initialization to avoid module initialization issues
export const turso = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getTursoClient();
    const value = (client as Record<string, unknown>)[prop as string];
    // If it's a function, bind it to the client to maintain correct 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Test connection
export async function testConnection() {
  try {
    const client = getTursoClient();
    await client.execute('SELECT 1');
    console.log('✅ Turso database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Turso database connection failed:', error);
    return false;
  }
}