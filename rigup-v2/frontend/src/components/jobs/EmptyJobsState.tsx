
import React from 'react';
import { FileText } from 'lucide-react';

const EmptyJobsState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <FileText className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-muted-foreground mb-2">No jobs yet</h3>
      <p className="text-muted-foreground">Create your first job to start mapping cable connections</p>
    </div>
  );
};

export default EmptyJobsState;
