/**
 * Example Component: How to Use AWS API Integration
 * This demonstrates various ways to interact with the AWS backend
 */

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAwsJobs, useCreateAwsJob, useAwsEquipment } from '@/hooks/useAwsApi';
import { Loader2 } from 'lucide-react';

export function AwsApiExample() {
  // Example 1: Fetch list of jobs
  const { data: jobs, loading: jobsLoading, execute: fetchJobs } = useAwsJobs();
  
  // Example 2: Create a new job
  const { execute: createJob, loading: creating } = useCreateAwsJob();
  
  // Example 3: Fetch equipment list
  const { data: equipment, loading: equipmentLoading, execute: fetchEquipment } = useAwsEquipment();

  // Fetch data on component mount
  useEffect(() => {
    fetchJobs();
    fetchEquipment();
  }, []);

  // Example job creation
  const handleCreateJob = async () => {
    try {
      const newJob = await createJob({
        name: 'Test Job from AWS',
        client: 'Test Client',
        location: 'Test Location',
        status: 'active',
        date: new Date().toISOString(),
      });
      
      console.log('Created job:', newJob);
      
      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>AWS API Integration Example</CardTitle>
          <CardDescription>
            This demonstrates how to use the AWS Lambda backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Jobs Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Jobs from AWS</h3>
            {jobsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading jobs...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs && jobs.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {jobs.slice(0, 5).map((job: any) => (
                      <li key={job.id}>
                        {job.name} - {job.client} ({job.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No jobs found</p>
                )}
                <Button 
                  onClick={handleCreateJob}
                  disabled={creating}
                  className="mt-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Test Job'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Equipment Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Equipment from AWS</h3>
            {equipmentLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading equipment...</span>
              </div>
            ) : (
              <div>
                {equipment && equipment.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {equipment.slice(0, 5).map((item: any) => (
                      <li key={item.id}>
                        {item.code} - {item.name} ({item.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No equipment found</p>
                )}
              </div>
            )}
          </div>

          {/* API Configuration Info */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">API Configuration</h4>
            <p className="text-sm text-muted-foreground">
              API URL: {import.meta.env.VITE_API_URL || 'Not configured'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              To configure: Set VITE_API_URL in your .env file
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AwsApiExample;