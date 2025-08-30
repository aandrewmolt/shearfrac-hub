# AWS Deployment Quick Guide

## Prerequisites
- AWS CLI installed and configured (`aws configure`)
- Node.js 18+ installed
- npm or yarn installed

## Quick Deploy

### Option 1: Automated Deployment
```bash
# Run the deployment script
./deploy-to-aws.sh
```

### Option 2: Manual Deployment

#### 1. Deploy Backend (Lambda Functions)
```bash
cd rigup-v2/backend-aws
npm install
npx serverless deploy --stage dev --region us-east-1
```

#### 2. Build Frontend
```bash
# Return to root directory
cd ../..

# Install dependencies
npm install

# Build for production
npm run build
```

#### 3. Deploy Frontend to Vercel (Recommended)
```bash
npx vercel --prod
```

## What Was Fixed

### Equipment API Improvements
1. **Flexible Equipment Code Format**
   - Now accepts: SS01, SS-01, SS-001, SS-0001, CTT-001, CTS-01, ABRA-001, PG1502-001, etc.
   - Pattern: 2-10 letters, optional dash, 1-4 digits

2. **Field Mapping**
   - Frontend sends: `code`, `type`, `location_id`
   - Backend accepts multiple field names for compatibility
   - Proper mapping to DynamoDB fields

3. **New Endpoints**
   - `PUT /equipment/{id}` - General update endpoint
   - `PATCH /equipment/{id}/status` - Status-only update

4. **Gauge Types Support**
   - Added support for Abra, ShearWave, 1502, and Pencil gauges
   - Automatic initialization on app startup
   - Proper type filtering in equipment selection

## Testing the Deployment

### Test Equipment Creation
```bash
# Get your API URL from deployment output
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"

# Test creating equipment with flexible format
curl -X POST $API_URL/equipment \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "SS-001",
    "name": "ShearStream Box 001",
    "type": "shearstream-box",
    "location_id": "midland-office",
    "status": "available"
  }'

# Test with gauge equipment
curl -X POST $API_URL/equipment \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "ABRA-001",
    "name": "Abra Gauge 001",
    "type": "gauge-abra",
    "location_id": "midland-office",
    "status": "available"
  }'
```

### Test Equipment List
```bash
curl $API_URL/equipment
```

## Environment Variables

Create a `.env.production` file in the root directory:
```env
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## Troubleshooting

### 400 Bad Request Errors
- Check that the API URL in `.env` matches your deployed endpoint
- Verify the equipment code format
- Check CloudWatch logs: `aws logs tail /aws/lambda/rigup-backend-dev-createEquipment`

### CORS Issues
- Serverless.yml already configured with CORS
- Check browser console for specific CORS errors

### Database Issues
- DynamoDB tables are auto-created by Serverless
- Check table exists: `aws dynamodb list-tables`

## Monitoring

### View Lambda Logs
```bash
# List all function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/rigup-backend

# Tail specific function logs
aws logs tail /aws/lambda/rigup-backend-dev-createEquipment --follow
```

### Check DynamoDB Tables
```bash
# List tables
aws dynamodb list-tables

# Scan equipment table
aws dynamodb scan --table-name rigup-backend-equipment-dev
```

## Costs
- Lambda: ~$0.20 per 1M requests
- API Gateway: ~$3.50 per 1M calls
- DynamoDB: ~$0.25 per GB/month
- CloudWatch Logs: ~$0.50 per GB ingested

Total estimated cost for small usage: <$5/month