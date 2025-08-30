import { turso } from '../client';

export async function addClientToJobs() {
  try {
    // Check if the column already exists
    const tableInfo = await turso.execute(`
      PRAGMA table_info(jobs)
    `);
    
    const hasClientColumn = tableInfo.rows.some(
      row => row.name === 'client'
    );
    
    if (!hasClientColumn) {
      console.log('Adding client column to jobs table...');
      await turso.execute(`
        ALTER TABLE jobs ADD COLUMN client TEXT
      `);
      console.log('✅ Client column added to jobs table');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding client column to jobs:', error);
    return false;
  }
}