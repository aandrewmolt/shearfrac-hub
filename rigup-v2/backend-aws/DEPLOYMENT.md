# AWS Lambda Backend Deployment Guide

## Overview
This backend uses AWS Lambda functions with API Gateway and DynamoDB for a fully serverless architecture. All team members can access job diagrams and equipment assignments in real-time.

## Key Features
- ✅ **Job Diagrams saved in cloud** - Accessible to all team members
- ✅ **Equipment codes display properly** - SS01, CT03, etc. show on nodes and dropdowns
- ✅ **Job naming system** - Client + Pad = Job Name (e.g., "OXY - Mohawk 2")
- ✅ **Contacts management** - Fully integrated with AWS
- ✅ **Real-time updates** - All changes immediately available to team

## Prerequisites
1. AWS Account with appropriate permissions
2. Node.js 18+ and npm installed
3. AWS CLI configured (`aws configure`)
4. Serverless Framework installed globally:
   ```bash
   npm install -g serverless
   ```

## Installation

### 1. Install Dependencies
```bash
cd rigup-v2/backend-aws
npm install
```

### 2. Configure AWS Credentials
If not already configured:
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### 3. Deploy to AWS
```bash
# Deploy to development environment
npm run deploy

# Or deploy to production
npm run deploy:prod
```

The deployment will output your API Gateway endpoint URL. Save this URL!

Example output:
```
endpoints:
  GET - https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/jobs
  POST - https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/jobs
  ...
```

## Frontend Configuration

### 1. Update Frontend Environment
Create `.env` file in `rigup-v2/frontend/`:
```env
# Use your actual API Gateway URL from deployment output
VITE_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

### 2. Build and Deploy Frontend
```bash
cd rigup-v2/frontend
npm install
npm run build
```

Deploy the `dist` folder to your hosting service (Vercel, Netlify, S3, etc.)

## Testing the Deployment

### 1. Test Equipment Codes
Create equipment with proper codes:
```bash
curl -X POST https://your-api-url/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "SS01",
    "name": "Shearstream Box 1",
    "type": "shearstream-box",
    "status": "available"
  }'
```

### 2. Test Job Creation
Create a job with Client + Pad naming:
```bash
curl -X POST https://your-api-url/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "client": "OXY",
    "pad": "Mohawk",
    "wellNumber": "2",
    "well_count": 12
  }'
```

This will create a job named "OXY - Mohawk" with display name "OXY - Mohawk 2"

### 3. Test Diagram Saving
Save a diagram with equipment assignments:
```bash
curl -X PUT https://your-api-url/jobs/{jobId}/diagram \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [...],
    "edges": [...],
    "equipmentAssignment": {
      "mainBox": "SS01",
      "satellite": "CT03",
      "starlinks": {
        "starlink-1": "SL06"
      }
    }
  }'
```

## Equipment Code Format
All equipment MUST follow the format: **2 letters + 2-3 digits**

Examples:
- **SS01** - Shearstream Box 01
- **CT03** - Cable Tray 03
- **SL06** - Starlink 06
- **CC05** - Customer Computer 05
- **YA01** - Y-Adapter 01
- **WG12** - Well Gauge 12

The system validates this format and displays codes on:
- Equipment selection dropdowns
- Job diagram nodes
- Equipment lists
- Deployment records

## Database Tables

### Jobs Table
- Stores job information with Client + Pad naming
- Equipment assignments stored at job level
- Links to diagram in Diagrams table

### Diagrams Table
- Stores complete React Flow diagram data
- Equipment codes embedded in node data
- Accessible to all team members

### Equipment Table
- Individual equipment items with codes
- Status tracking (available, deployed, maintenance, etc.)
- Job assignment tracking

### Contacts Table
- Client, Frac, and Custom contact types
- Associated with jobs

### Clients Table
- Stores unique client names
- Auto-created when new job uses new client name

## Monitoring

### View Lambda Logs
```bash
# View logs for specific function
npm run logs getJobs

# Or use AWS Console
# CloudWatch > Log Groups > /aws/lambda/rigup-backend-dev-getJobs
```

### Check DynamoDB Tables
1. Go to AWS Console > DynamoDB
2. Select your region
3. View tables: rigup-backend-jobs-dev, rigup-backend-diagrams-dev, etc.

## Cost Optimization

This serverless setup is cost-effective:
- **Lambda**: First 1M requests/month FREE
- **API Gateway**: First 1M calls/month FREE  
- **DynamoDB**: Pay-per-request mode, scales automatically
- **Typical monthly cost**: $5-20 for small teams

## Troubleshooting

### Equipment codes not displaying
- Ensure equipment has `equipmentId` field with proper format (SS01, CT03)
- Check diagram save includes `equipmentAssignment` object
- Verify nodes have equipment data in their `data` property

### Job names not formatting correctly
- Ensure both `client` and `pad` fields are provided
- Job name will be: `${client} - ${pad}`
- Display name will be: `${client} - ${pad} ${wellNumber}`

### Diagram not saving
- Check Lambda function has DynamoDB permissions
- Verify jobId exists before saving diagram
- Check CloudWatch logs for errors

### Cannot access from frontend
- Verify API Gateway URL in frontend .env file
- Check CORS is enabled (handled by serverless.yml)
- Ensure frontend is using updated api.client.ts

## Cleanup

To remove all AWS resources:
```bash
npm run remove
```

This will delete all Lambda functions, API Gateway, and DynamoDB tables.

## Support

For issues:
1. Check CloudWatch logs for Lambda errors
2. Verify DynamoDB table data in AWS Console
3. Test API endpoints with curl or Postman
4. Ensure frontend environment variables are correct