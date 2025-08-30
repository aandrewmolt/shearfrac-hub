# RigUp V2 - ClickUp Integration Architecture

## Project Structure

```
rigup-v2/
├── frontend/          # React frontend (unchanged from current)
├── backend/           # New simplified backend with ClickUp sync
└── shared/            # Shared types and utilities
```

## Hybrid Architecture Approach

### Primary Data Storage: ClickUp + SQLite

#### ClickUp Handles:
- **Jobs/Projects** - As ClickUp Lists
- **Contacts** - As ClickUp custom database
- **Basic Equipment Status** - As ClickUp tasks with custom fields
- **Work Orders/Tasks** - Native ClickUp tasks
- **Team Collaboration** - Comments, assignments, etc.

#### Local SQLite/Turso Handles:
- **Job Diagrams** - Complex React Flow JSON data
- **Equipment Deployments** - Many-to-many relationships
- **Audit Trails** - High-frequency tracking data
- **Bulk Operations** - Transactional inventory movements
- **Real-time Equipment Availability** - Fast queries for allocation

## Backend Simplification

### Current Backend Issues:
- Complex edge functions spread across multiple files
- Duplicate sync logic
- Multiple database connections (Turso, Supabase, localStorage)
- Inconsistent error handling

### New Backend Design:

```typescript
// Single API Gateway
/api/v2/
  ├── clickup/     # ClickUp sync endpoints
  ├── inventory/   # Local equipment management
  ├── diagrams/    # Job diagram storage
  └── sync/        # Bi-directional sync orchestration
```

## Migration Strategy

### Phase 1: Frontend Isolation
1. Copy entire frontend to `rigup-v2/frontend/`
2. Update all API endpoints to use new `/api/v2/` prefix
3. Keep frontend functionality identical

### Phase 2: Backend Simplification
1. Create unified API gateway
2. Implement ClickUp webhook handlers
3. Build sync queue for offline support
4. Simplify database schema

### Phase 3: ClickUp Integration
1. Jobs ↔ ClickUp Lists sync
2. Contacts ↔ ClickUp custom fields
3. Basic equipment status ↔ ClickUp tasks
4. Two-way webhook sync

## Data Flow

```
Frontend (React)
    ↓
API Gateway (Express/Fastify)
    ↓
┌─────────────┬──────────────┐
│  ClickUp    │   SQLite     │
│  (Master)   │   (Cache)    │
├─────────────┼──────────────┤
│ • Jobs      │ • Diagrams   │
│ • Contacts  │ • Equipment  │
│ • Tasks     │ • History    │
│ • Status    │ • Bulk Ops   │
└─────────────┴──────────────┘
```

## Benefits of This Approach

1. **Simplified Backend** - Single API layer instead of scattered edge functions
2. **Better Sync** - ClickUp webhooks for real-time updates
3. **Offline Support** - Local SQLite cache for critical operations
4. **Team Collaboration** - Leverage ClickUp's built-in features
5. **Reduced Complexity** - Let ClickUp handle what it's good at

## Limitations to Accept

1. **Diagram Storage** - Keep in SQLite, reference in ClickUp
2. **Complex Queries** - Use local cache for performance
3. **Bulk Operations** - Handle locally, sync status to ClickUp
4. **API Rate Limits** - Implement intelligent batching

## Next Steps

1. Copy frontend to new structure
2. Create Express/Fastify backend scaffold
3. Design ClickUp workspace structure
4. Implement sync queue system
5. Build webhook handlers
6. Test bi-directional sync