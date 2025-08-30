import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';

export const LocalModeBanner = () => {
  // Show banner based on mode
  if (DATABASE_MODE === 'vercel-blob') {
    return (
      <Alert className="mb-4 bg-muted border-border">
        <Info className="h-4 w-4 text-foreground" />
        <AlertDescription className="text-foreground">
          <strong>Cloud Sync Active:</strong> Data syncs to Vercel Blob storage. 
          Changes are saved locally and backed up to the cloud automatically.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (DATABASE_MODE === 'local') {
    return (
      <Alert className="mb-4 bg-muted border-border">
        <Info className="h-4 w-4 text-foreground" />
        <AlertDescription className="text-foreground">
          <strong>Local Mode Active:</strong> All data is stored in your browser. 
          Perfect for testing or single-user deployment. No cloud database required!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};