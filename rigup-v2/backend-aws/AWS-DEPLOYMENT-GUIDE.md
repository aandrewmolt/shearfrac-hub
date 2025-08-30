# Complete AWS Infrastructure Deployment Guide

## Architecture Overview

```
Internet
    ↓
CloudFront CDN ($0.085/GB) 
    ↓
API Gateway ($3.50/million requests)
    ↓
Lambda Functions (Free tier: 1M requests)
    ↓
DynamoDB On-Demand ($0.25/million reads)
    ↓
S3 Standard-IA ($0.0125/GB/month)
```

## Cost Breakdown (Estimated Monthly)

| Service | Free Tier | Typical Usage | Estimated Cost |
|---------|-----------|---------------|----------------|
| CloudFront | None | 10GB transfer | $0.85 |
| API Gateway | 1M requests | 500K requests | FREE |
| Lambda | 1M requests, 400K GB-seconds | 500K requests | FREE |
| DynamoDB | 25GB storage, 25 read/write units | On-demand | ~$2-5 |
| S3 Standard | 5GB | 10GB diagrams/photos | $0.23 |
| S3 Standard-IA | None | 50GB archived | $0.63 |
| **TOTAL** | | | **~$4-8/month** |

## Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   # Enter Access Key ID
   # Enter Secret Access Key
   # Enter region (us-east-1 recommended)
   ```
3. **Node.js 18+** and npm
4. **Serverless Framework**:
   ```bash
   npm install -g serverless
   ```

## Step 1: Deploy the Complete Infrastructure

### 1.1 Clone and Setup
```bash
cd rigup-v2/backend-aws
npm install
```

### 1.2 Configure Serverless
```bash
# Use the full configuration with CloudFront
mv serverless-full.yml serverless.yml
```

### 1.3 Deploy Everything
```bash
# Deploy to development
serverless deploy --verbose

# Or deploy to production
serverless deploy --stage prod --verbose
```

This single command creates:
- ✅ CloudFront CDN distribution
- ✅ API Gateway with caching
- ✅ Lambda functions
- ✅ DynamoDB tables
- ✅ S3 buckets (storage & photos)
- ✅ All IAM roles and permissions

### 1.4 Save the Output
The deployment will output important URLs:

```
Serverless: Stack update finished...
Service Information
service: rigup-backend
stage: dev
region: us-east-1

endpoints:
  GET - https://abc123.execute-api.us-east-1.amazonaws.com/dev/jobs
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/jobs
  ...

Stack Outputs:
  CloudFrontDomainName: d1234567890.cloudfront.net
  ApiGatewayUrl: https://abc123.execute-api.us-east-1.amazonaws.com/dev
  StorageBucketName: rigup-backend-storage-dev
  PhotosBucketName: rigup-backend-photos-dev
```

**SAVE THESE URLs!** You'll need them for the frontend.

## Step 2: Configure Frontend

### 2.1 Update Environment Variables
Create `.env` in `rigup-v2/frontend/`:

```env
# Use CloudFront URL for best performance
VITE_API_URL=https://d1234567890.cloudfront.net

# Or use API Gateway directly (bypass CDN)
# VITE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev
```

### 2.2 Build Frontend
```bash
cd rigup-v2/frontend
npm install
npm run build
```

### 2.3 Deploy Frontend to S3 + CloudFront

Create a new S3 bucket for frontend hosting:

```bash
# Create frontend bucket
aws s3 mb s3://rigup-frontend-prod

# Enable static website hosting
aws s3 website s3://rigup-frontend-prod \
  --index-document index.html \
  --error-document error.html

# Upload frontend files
aws s3 sync dist/ s3://rigup-frontend-prod --acl public-read

# Create CloudFront distribution for frontend
aws cloudfront create-distribution \
  --origin-domain-name rigup-frontend-prod.s3.amazonaws.com \
  --default-root-object index.html
```

## Step 3: Test the Deployment

### 3.1 Test Equipment Creation
```bash
# Create equipment with proper code
curl -X POST https://your-cloudfront-domain/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "SS01",
    "name": "Shearstream Box 1",
    "type": "shearstream-box",
    "status": "available"
  }'
```

### 3.2 Test Job Creation
```bash
# Create job with Client + Pad naming
curl -X POST https://your-cloudfront-domain/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "client": "OXY",
    "pad": "Mohawk",
    "wellNumber": "2",
    "well_count": 12
  }'
```

### 3.3 Test Photo Upload
```bash
# Get pre-signed upload URL
curl -X POST https://your-cloudfront-domain/photos/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "rig-photo.jpg",
    "fileType": "image/jpeg",
    "jobId": "job-123"
  }'

# Response includes uploadUrl - use it to upload directly to S3
```

## Step 4: Configure CloudFront for Optimal Performance

### 4.1 Cache Behaviors
The CloudFront distribution is configured with:

- **API Routes**: No caching for POST/PUT/DELETE
- **GET /equipment**: Cached for 5 minutes
- **GET /contacts**: Cached for 5 minutes
- **GET /clients**: Cached for 10 minutes
- **Static files from S3**: Cached for 24 hours
- **Photos from S3**: Cached for 7 days

### 4.2 Invalidate Cache (if needed)
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Step 5: Cost Optimization Settings

### 5.1 DynamoDB
- ✅ Using **On-Demand billing** (pay per request)
- ✅ Point-in-time recovery enabled
- ✅ Minimal GSI projections to reduce costs

### 5.2 S3 Storage Classes
- **0-30 days**: Standard ($0.023/GB)
- **30-90 days**: Standard-IA ($0.0125/GB) 
- **90+ days**: Glacier ($0.004/GB)
- **365+ days**: Auto-delete old versions

### 5.3 CloudFront
- ✅ Using **PriceClass_100** (North America & Europe only)
- ✅ Compression enabled (reduces transfer costs)
- ✅ HTTP/2 enabled (better performance)

### 5.4 Lambda
- ✅ Reserved concurrency not set (uses on-demand)
- ✅ Memory set to 128MB (lowest cost)
- ✅ Timeout optimized per function

## Step 6: Monitoring & Alerts

### 6.1 Set Up CloudWatch Alarms
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name rigup-high-error-rate \
  --alarm-description "Alert when Lambda error rate is high" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# High API Gateway 4xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name rigup-high-4xx \
  --alarm-description "Alert on high 4xx errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### 6.2 View Logs
```bash
# View Lambda logs
serverless logs -f getJobs --tail

# View API Gateway logs
aws logs tail /aws/api-gateway/rigup-backend-dev
```

## Step 7: Security Best Practices

### 7.1 API Keys (Optional)
Add API key requirement for additional security:

```yaml
# In serverless.yml
provider:
  apiKeys:
    - rigup-api-key-${self:provider.stage}

functions:
  getJobs:
    events:
      - http:
          private: true  # Requires API key
```

### 7.2 CORS Configuration
Already configured for all endpoints. To restrict:

```yaml
cors:
  origin: 'https://your-frontend-domain.com'
  headers:
    - Content-Type
    - Authorization
```

### 7.3 Enable AWS WAF (Optional)
```bash
# Protect against common attacks
aws wafv2 create-web-acl \
  --name rigup-waf \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --rules file://waf-rules.json
```

## Step 8: Backup & Disaster Recovery

### 8.1 Automated Backups
DynamoDB Point-in-Time Recovery is enabled. To restore:

```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name rigup-backend-jobs-prod \
  --target-table-name rigup-backend-jobs-prod-restored \
  --restore-date-time 2024-01-01T00:00:00Z
```

### 8.2 Export Data to S3
Use the export endpoint:

```bash
# Export full backup
curl -X POST https://your-api/export/full

# Export specific job
curl -X POST https://your-api/export/diagram \
  -d '{"jobId": "123"}'
```

## Troubleshooting

### Issue: Equipment codes not showing
**Solution**: Ensure `equipmentId` follows format (SS01, CT03)

### Issue: High latency
**Solution**: Use CloudFront URL instead of API Gateway directly

### Issue: CORS errors
**Solution**: Check CloudFront and API Gateway CORS settings

### Issue: Upload fails
**Solution**: Check S3 bucket permissions and CORS configuration

### Issue: High costs
**Solutions**:
1. Enable CloudFront caching for GET requests
2. Move old S3 objects to Glacier
3. Use DynamoDB on-demand pricing
4. Set up billing alerts

## Clean Up (Remove Everything)

```bash
# Remove all AWS resources
serverless remove --stage dev

# Delete S3 buckets (must be empty first)
aws s3 rm s3://rigup-backend-storage-dev --recursive
aws s3 rm s3://rigup-backend-photos-dev --recursive
aws s3 rb s3://rigup-backend-storage-dev
aws s3 rb s3://rigup-backend-photos-dev
```

## Support & Monitoring Dashboard

Access AWS Console for:
- **CloudWatch**: Logs, metrics, alarms
- **X-Ray**: Trace requests through the system
- **Cost Explorer**: Monitor spending
- **DynamoDB**: View/edit data directly
- **S3**: Manage files and photos
- **CloudFront**: View cache statistics

## Performance Benchmarks

Expected performance with CloudFront:
- API Response: <100ms from cache
- Photo Upload: <2 seconds
- Diagram Save: <500ms
- Equipment List: <50ms from cache
- Global availability: 99.99% uptime