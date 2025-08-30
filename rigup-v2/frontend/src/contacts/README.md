# ShearFrac Contacts Module

A flexible, modular contacts management system for ShearFrac with support for multiple contact types and easy backend switching.

## Features

- **Multiple Contact Types**: Clients, Frac, and Custom contact types
- **Dynamic Custom Types**: Add new contact types on the fly (Coldbore, etc.)
- **Advanced Table Features**:
  - Sorting on all columns
  - Global search filtering
  - Column visibility toggle
  - Drag-and-drop column reordering
- **Full CRUD Operations**: Create, Read, Update, Delete contacts
- **Flexible Storage**: Easy switching between GitHub/localStorage and AWS S3

## Usage

Navigate to `/contacts` in your application to access the contacts management page.

## Storage Configuration

### Current: GitHub/LocalStorage
By default, contacts are stored in localStorage for development. This simulates GitHub storage.

### Switching to AWS S3
1. Install AWS SDK:
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. Set environment variable:
   ```env
   VITE_CONTACTS_STORAGE=aws
   ```

3. Configure AWS credentials and update `awsStorage.ts` with your bucket details

4. Uncomment the AWS implementation in `storageFactory.ts`

## Data Structure

### Contact Types

1. **Client Contacts**
   - Title, Name, Company, Phone Number, Email, Job, Shift, Notes

2. **Frac Contacts**
   - Company, Crew, Name, Shift, Title, Phone, Email, Job, Date of Rotation, Notes

3. **Custom Contacts**
   - Same as Frac + Custom Type field

### Database Schema
```json
{
  "version": "1.0.0",
  "lastModified": "ISO date string",
  "contacts": [...],
  "customTypes": ["Coldbore"],
  "columnSettings": {
    "client": [...],
    "frac": [...],
    "custom": [...]
  }
}
```

## Extending the Module

### Adding New Fields
1. Update types in `types/contact.types.ts`
2. Add columns to `utils/columnConfig.ts`
3. Update form in `components/ContactForm.tsx`

### Adding New Storage Providers
1. Create new adapter implementing `StorageAdapter` interface
2. Add to `storageFactory.ts`
3. Update environment configuration

## Integration with Main App

The contacts module is designed to be modular and can share data with other parts of the application through:
- Job references (shared dataset)
- Company information
- Crew assignments