import { turso } from './client';

export async function createSchema() {
  console.log('🔨 Creating database schema...');
  
  try {
    // Users table (for simple auth)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Equipment Types table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS equipment_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        requires_individual_tracking BOOLEAN DEFAULT FALSE,
        default_id_prefix TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Storage Locations table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS storage_locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Equipment Items table (bulk inventory) - DEPRECATED: Use individual_equipment instead
    // Kept for backward compatibility but all new equipment should be created as individual items
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS equipment_items (
        id TEXT PRIMARY KEY,
        type_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        status TEXT DEFAULT 'available',
        job_id TEXT,
        notes TEXT,
        red_tag_reason TEXT,
        red_tag_photo TEXT,
        location_type TEXT DEFAULT 'storage',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_id) REFERENCES equipment_types(id),
        FOREIGN KEY (location_id) REFERENCES storage_locations(id)
      )
    `);

    // Individual Equipment table (tracked items)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS individual_equipment (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        job_id TEXT,
        serial_number TEXT,
        purchase_date DATE,
        warranty_expiry DATE,
        notes TEXT,
        red_tag_reason TEXT,
        red_tag_photo TEXT,
        location_type TEXT DEFAULT 'storage',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_id) REFERENCES equipment_types(id),
        FOREIGN KEY (location_id) REFERENCES storage_locations(id)
      )
    `);

    // Jobs table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client TEXT,
        pad TEXT,
        well_count INTEGER DEFAULT 0,
        has_wellside_gauge BOOLEAN DEFAULT FALSE,
        nodes TEXT,
        edges TEXT,
        company_computer_names TEXT,
        equipment_assignment TEXT,
        equipment_allocated BOOLEAN DEFAULT FALSE,
        main_box_name TEXT,
        satellite_name TEXT,
        wellside_gauge_name TEXT,
        selected_cable_type TEXT DEFAULT 'default_cable',
        frac_baud_rate TEXT DEFAULT 'RS485-19200',
        gauge_baud_rate TEXT DEFAULT 'RS232-38400',
        frac_com_port TEXT DEFAULT 'COM1',
        gauge_com_port TEXT DEFAULT 'COM2',
        enhanced_config TEXT,
        photos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Job Photos table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS job_photos (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        section_label TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    // Bulk Equipment Deployments table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS bulk_equipment_deployments (
        id TEXT PRIMARY KEY,
        equipment_type_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        source_location_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        returned_at DATETIME,
        status TEXT DEFAULT 'deployed',
        notes TEXT,
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (source_location_id) REFERENCES storage_locations(id)
      )
    `);

    // Equipment History table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS equipment_history (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        action TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT,
        from_location TEXT,
        to_location TEXT,
        job_id TEXT,
        job_name TEXT,
        user_id TEXT,
        user_name TEXT,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES individual_equipment(id)
      )
    `);

    // Contacts tables
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        phone2 TEXT,
        company TEXT,
        rig TEXT,
        job_title TEXT,
        location TEXT,
        client_name TEXT,
        well_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        data TEXT -- JSON field for flexible additional fields
      )
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS contact_columns (
        id TEXT PRIMARY KEY,
        contact_type TEXT NOT NULL,
        column_settings TEXT NOT NULL, -- JSON array of column configurations
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contact_type, user_id)
      )
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS custom_contact_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Storage Transfers table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS storage_transfers (
        id TEXT PRIMARY KEY,
        from_location_id TEXT NOT NULL,
        to_location_id TEXT NOT NULL,
        equipment_type_id TEXT NOT NULL,
        equipment_ids TEXT, -- JSON array of individual equipment IDs
        quantity INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, in_transit, completed, cancelled
        requested_by TEXT,
        approved_by TEXT,
        notes TEXT,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        completed_at DATETIME,
        cancelled_at DATETIME,
        FOREIGN KEY (from_location_id) REFERENCES storage_locations(id),
        FOREIGN KEY (to_location_id) REFERENCES storage_locations(id),
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id)
      )
    `);

    // Create indexes for better performance
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_equipment_items_type ON equipment_items(type_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_equipment_items_location ON equipment_items(location_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_individual_equipment_type ON individual_equipment(type_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_individual_equipment_location ON individual_equipment(location_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos(job_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_bulk_deployments_job ON bulk_equipment_deployments(job_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_bulk_deployments_type ON bulk_equipment_deployments(equipment_type_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment ON equipment_history(equipment_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_equipment_history_timestamp ON equipment_history(timestamp)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_storage_transfers_status ON storage_transfers(status)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_storage_transfers_from ON storage_transfers(from_location_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_storage_transfers_to ON storage_transfers(to_location_id)');

    // Add pad column to existing jobs tables (migration)
    try {
      await turso.execute(`
        ALTER TABLE jobs ADD COLUMN pad TEXT
      `);
      console.log('✅ Added pad column to jobs table');
    } catch (error) {
      const err = error as { message?: string; code?: string };
      if (err.message?.includes('duplicate column name') || 
          err.message?.includes('already exists') ||
          err.code === 'SQLITE_ERROR') {
        console.log('✅ Pad column already exists in jobs table');
      } else {
        console.error('❌ Error adding pad column:', error);
        // Don't throw here, continue with schema creation
      }
    }

    console.log('✅ Database schema created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create schema:', error);
    throw error;
  }
}

