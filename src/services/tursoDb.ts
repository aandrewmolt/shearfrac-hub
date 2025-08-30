/**
 * TursoDb - Now redirects to AWS Database Service
 * This file exists for backward compatibility only
 * All operations now go through AWS API
 */

// Import and re-export everything from AWS database
export { tursoDb, turso, default } from './awsDatabase';
export * from './awsDatabase';