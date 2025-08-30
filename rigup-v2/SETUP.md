# RigUp v2 Setup Guide

## Overview
RigUp v2 features a new architecture with ClickUp integration for better team collaboration while maintaining local control over complex diagram data.

## Architecture Changes
- **Frontend**: React (unchanged) - migrated to `/rigup-v2/frontend`
- **Backend**: Express + ClickUp API - new Node.js backend in `/rigup-v2/backend`
- **Database**: Hybrid approach:
  - **ClickUp**: Jobs, contacts, equipment status (simple data)
  - **Local SQLite/Turso**: Diagrams, equipment details, audit trails (complex data)

## Prerequisites
- Node.js 18+ and npm
- ClickUp account with API access
- (Optional) Turso account for cloud database

## Backend Setup

### 1. Install Dependencies
```bash
cd rigup-v2/backend
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# ClickUp API Configuration
CLICKUP_API_TOKEN=pk_YOUR_API_TOKEN_HERE
CLICKUP_WORKSPACE_ID=YOUR_WORKSPACE_ID

# Database (use local SQLite or Turso)
TURSO_URL=file:local.db
# For Turso Cloud:
# TURSO_URL=libsql://your-database.turso.io
# TURSO_AUTH_TOKEN=your-auth-token
```

### 3. Set Up ClickUp Workspace
Run the setup script to create the required ClickUp structure:
```bash
npm run setup:clickup
```

This will:
- Create spaces for Jobs, Equipment, and Contacts
- Create lists for Active Jobs, Completed Jobs, Equipment Inventory, and Contacts
- Set up custom fields for all entities
- Generate a configuration file with all IDs

### 4. Update Environment with ClickUp IDs
After running the setup script, append the generated configuration from `.env.clickup` to your `.env` file.

### 5. Start the Backend
```bash
npm run dev
```

The backend will start on `http://localhost:3001`

## Frontend Setup

### 1. Install Dependencies
```bash
cd rigup-v2/frontend
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

The default configuration should work for local development:
```env
VITE_API_URL=http://localhost:3001/api/v2
VITE_WS_URL=ws://localhost:3001
```

### 3. Start the Frontend
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Testing the Integration

### 1. Health Check
Visit `http://localhost:3001/api/v2/health` to verify:
- Database connection
- ClickUp API connection

### 2. Create a Test Job
1. Open the frontend at `http://localhost:5173`
2. Create a new job
3. Check ClickUp to see the job appear in the Active Jobs list
4. The job diagram will be stored locally

### 3. Test Synchronization
1. Modify a job in ClickUp
2. The change should appear in the frontend within the sync interval (5 minutes for jobs)
3. Or trigger manual sync from the frontend sync panel

## Data Flow

### Jobs
- **Create**: Frontend → Backend → Local DB → Queue for ClickUp sync
- **Update**: Bi-directional sync based on configuration
- **Diagram**: Stored only in local database, referenced in ClickUp

### Equipment
- **Status Updates**: Local → ClickUp (one-way)
- **Detailed Data**: Local database only
- **Bulk Operations**: Handled locally, status synced to ClickUp

### Contacts
- **CRUD**: Bi-directional sync with ClickUp as master
- **Used for**: Job assignments and communication

## Troubleshooting

### ClickUp Connection Issues
1. Verify API token is correct
2. Check workspace ID matches your ClickUp workspace
3. Ensure you have appropriate permissions in ClickUp

### Database Issues
1. For local SQLite, ensure write permissions in backend directory
2. For Turso, verify connection string and auth token

### Sync Issues
1. Check backend logs for sync errors
2. Verify webhook configuration if using real-time sync
3. Use manual sync trigger to force synchronization

## Production Deployment

### Backend
1. Build the TypeScript code:
   ```bash
   npm run build
   ```
2. Set production environment variables
3. Run with process manager (PM2, systemd, etc.):
   ```bash
   npm start
   ```

### Frontend
1. Build for production:
   ```bash
   npm run build
   ```
2. Deploy `dist` folder to your static hosting (Vercel, Netlify, etc.)
3. Update `VITE_API_URL` to point to production backend

## Migration from v1

Your existing data remains intact in the original database. To migrate:

1. Export jobs from the old system
2. Run the migration script (coming soon)
3. Verify data in ClickUp and local database
4. Switch to the new frontend

## Support

For issues or questions:
- Check backend logs in `logs/` directory
- Review ClickUp webhook logs
- Ensure all environment variables are set correctly