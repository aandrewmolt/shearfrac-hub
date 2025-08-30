# AWS Integration Guide for Well Rig Visualizer

This guide explains how to connect the Well Rig Visualizer frontend to the AWS Lambda backend via API Gateway.

## Overview

The application now includes full AWS integration support, allowing you to:
- Store and retrieve data from AWS DynamoDB
- Use AWS Lambda functions for business logic
- Leverage API Gateway for secure API access
- Deploy the entire backend serverlessly

## Configuration

### 1. Set Up Your AWS Backend

Follow the deployment instructions in `rigup-v2/backend-aws/README.md` to deploy your AWS infrastructure.

### 2. Configure the Frontend

After deploying your AWS backend, you'll receive an API Gateway endpoint URL. Add this to your `.env` file:

```env
# AWS API Configuration
VITE_API_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/dev
```

Replace `your-api-gateway-id` with your actual API Gateway ID.

### 3. Authentication (Optional)

If your API requires authentication, you can set a token:

```javascript
import { authApi } from '@/services/awsApiService';

// Set authentication token
authApi.setToken('your-jwt-token');

// Check if authenticated
if (authApi.isAuthenticated()) {
  // Make authenticated requests
}

// Clear token on logout
authApi.clearToken();
```

## Usage Examples

### Using the AWS API Service

The `awsApiService.ts` provides a clean interface to interact with your AWS backend:

```javascript
import awsApi from '@/services/awsApiService';

// Fetch all jobs
const jobs = await awsApi.jobs.list();

// Create a new job
const newJob = await awsApi.jobs.create({
  name: 'Well Site Alpha',
  client: 'Energy Corp',
  location: 'Texas',
  status: 'active'
});

// Deploy equipment to a job
await awsApi.equipment.deploy({
  equipmentId: 'equip-123',
  jobId: 'job-456',
  quantity: 5
});
```

### Using React Hooks

The application provides custom React hooks for easier integration:

```javascript
import { useAwsJobs, useCreateAwsJob } from '@/hooks/useAwsApi';

function MyComponent() {
  // Fetch jobs with automatic loading and error states
  const { data: jobs, loading, error, execute: refetch } = useAwsJobs();
  
  // Create a new job with toast notifications
  const { execute: createJob } = useCreateAwsJob();
  
  const handleCreate = async () => {
    const newJob = await createJob({
      name: 'New Job',
      client: 'Client Name'
    });
    // Automatically shows success/error toast
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {jobs?.map(job => (
        <div key={job.id}>{job.name}</div>
      ))}
    </div>
  );
}
```

## AWS Connection Status

The application displays the AWS connection status in the header:
- **Green Cloud Icon**: Connected to AWS
- **Amber Cloud-Off Icon**: Disconnected or not configured
- **Spinning Loader**: Checking connection

The status is automatically checked every 30 seconds.

## Available API Endpoints

### Jobs
- `GET /jobs` - List all jobs
- `GET /jobs/{id}` - Get specific job
- `POST /jobs` - Create new job
- `PUT /jobs/{id}` - Update job
- `DELETE /jobs/{id}` - Delete/archive job
- `GET /jobs/{id}/diagram` - Get job diagram
- `PUT /jobs/{id}/diagram` - Update job diagram

### Equipment
- `GET /equipment` - List all equipment
- `GET /equipment/{id}` - Get specific equipment
- `POST /equipment` - Create new equipment
- `PUT /equipment/{id}` - Update equipment
- `PATCH /equipment/{id}/status` - Update equipment status
- `POST /equipment/deploy` - Deploy equipment to job
- `POST /equipment/return` - Return equipment from job

### Contacts
- `GET /contacts` - List all contacts
- `GET /contacts/{id}` - Get specific contact
- `POST /contacts` - Create new contact
- `PUT /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Clients
- `GET /clients` - List all client names
- `POST /clients` - Create new client

## Error Handling

The AWS API service includes comprehensive error handling:

```javascript
try {
  const result = await awsApi.jobs.create(data);
  // Success
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message);
    // Handle specific HTTP status codes
    if (error.status === 401) {
      // Redirect to login
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Testing the Integration

1. Check the AWS connection status in the app header
2. Navigate to any page that uses AWS data (Jobs, Equipment, etc.)
3. Try creating, updating, or deleting records
4. Monitor the browser console for API requests and responses

## Troubleshooting

### "AWS API not configured" message
- Ensure `VITE_API_URL` is set in your `.env` file
- Restart the development server after changing `.env`

### CORS errors
- Check that your API Gateway has CORS enabled
- Verify the allowed origins include your frontend URL

### 401 Unauthorized errors
- Check if your API requires authentication
- Ensure the authentication token is valid and not expired

### Network errors
- Verify the API Gateway endpoint URL is correct
- Check that the Lambda functions are deployed and running
- Ensure your AWS region is correct

## Local Development vs AWS

The application can work in three modes:

1. **Local Only**: Uses local SQLite database (no AWS)
2. **Turso + AWS**: Uses Turso for database, AWS for additional features
3. **Full AWS**: Uses AWS for everything

Configure the mode by setting environment variables:
```env
# For local development
VITE_DATABASE_MODE=local

# For Turso + AWS
VITE_DATABASE_MODE=turso
VITE_API_URL=https://your-api-gateway.amazonaws.com/dev

# For full AWS (future)
VITE_DATABASE_MODE=aws
VITE_API_URL=https://your-api-gateway.amazonaws.com/dev
```

## Security Best Practices

1. **Never commit API tokens** to version control
2. **Use environment variables** for all sensitive configuration
3. **Implement proper authentication** for production deployments
4. **Enable HTTPS** for all API communications
5. **Validate and sanitize** all user input before sending to AWS
6. **Implement rate limiting** on your API Gateway
7. **Use AWS IAM roles** for Lambda function permissions
8. **Monitor API usage** through CloudWatch

## Next Steps

1. Deploy your AWS backend using the RigUp v2 backend
2. Configure your `.env` file with the API Gateway URL
3. Test the connection using the status indicator
4. Start using AWS services in your components
5. Monitor performance and costs in AWS Console

For more details on the AWS backend, see `rigup-v2/backend-aws/README.md`.