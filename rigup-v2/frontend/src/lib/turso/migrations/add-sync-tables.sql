-- Add sync tracking tables to Turso database
-- Run this in your Turso dashboard or via CLI

-- Equipment sync log table
CREATE TABLE IF NOT EXISTS equipment_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'UPDATE', 'REALLOCATE', 'CONFLICT', etc.
  changes TEXT, -- JSON string of changes
  job_id TEXT,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolution TEXT,
  INDEX idx_equipment_sync_equipment (equipment_id),
  INDEX idx_equipment_sync_job (job_id),
  INDEX idx_equipment_sync_time (synced_at)
);

-- Add sync tracking columns to existing tables if they don't exist
-- Note: In SQLite/Turso, we can't easily check if columns exist, 
-- so you may need to skip these if they already exist

-- Add to individual_equipment if not exists
-- ALTER TABLE individual_equipment ADD COLUMN last_sync DATETIME;
-- ALTER TABLE individual_equipment ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- Add to jobs if not exists  
-- ALTER TABLE jobs ADD COLUMN last_equipment_sync DATETIME;
-- ALTER TABLE jobs ADD COLUMN sync_conflicts INTEGER DEFAULT 0;