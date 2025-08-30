# AWS API Gateway Throttling Configuration

## Overview

This documentation covers the complete API Gateway throttling setup for the RigUp backend API. Throttling is implemented at multiple levels to prevent API abuse, ensure fair usage, and maintain system stability.

## Throttling Limits

### Default Limits (Stage-Level)
- **Rate Limit**: 5 requests per second (sustained)
- **Burst Limit**: 10 requests (maximum in a burst)

### Per-Endpoint Limits

#### Equipment Endpoints
| Endpoint | Method | Rate Limit | Burst Limit | Caching |
|----------|--------|------------|-------------|---------|
| `/equipment` | GET | 10 req/s | 20 requests | 60s |
| `/equipment` | POST | 2 req/s | 5 requests | No |
| `/equipment/{id}` | GET | 8 req/s | 15 requests | 120s |
| `/equipment/{id}` | PUT | 2 req/s | 5 requests | No |
| `/equipment/{id}` | DELETE | 1 req/s | 3 requests | No |
| `/equipment/{id}/status` | PATCH | 5 req/s | 10 requests | No |
| `/equipment/deploy` | POST | 3 req/s | 5 requests | No |
| `/equipment/return` | POST | 3 req/s | 5 requests | No |

#### Job Endpoints
| Endpoint | Method | Rate Limit | Burst Limit | Caching |
|----------|--------|------------|-------------|---------|
| `/jobs` | GET | 8 req/s | 15 requests | 30s |
| `/jobs` | POST | 2 req/s | 5 requests | No |
| `/jobs/{id}` | GET | 5 req/s | 10 requests | 60s |
| `/jobs/{id}` | PUT | 2 req/s | 5 requests | No |
| `/jobs/{id}` | DELETE | 1 req/s | 3 requests | No |
| `/jobs/{id}/diagram` | GET | 5 req/s | 10 requests | 120s |
| `/jobs/{id}/diagram` | PUT | 2 req/s | 5 requests | No |

#### Contact Endpoints
| Endpoint | Method | Rate Limit | Burst Limit | Caching |
|----------|--------|------------|-------------|---------|
| `/contacts` | GET | 5 req/s | 10 requests | 300s |
| `/contacts` | POST | 1 req/s | 3 requests | No |
| `/contacts/{id}` | GET | 4 req/s | 8 requests | 300s |
| `/contacts/{id}` | PUT | 1 req/s | 3 requests | No |
| `/contacts/{id}` | DELETE | 1 req/s | 2 requests | No |

#### Client Endpoints
| Endpoint | Method | Rate Limit | Burst Limit | Caching |
|----------|--------|------------|-------------|---------|
| `/clients` | GET | 5 req/s | 10 requests | 600s |
| `/clients` | POST | 1 req/s | 3 requests | No |

## Files Created

1. **`serverless-with-throttling.yml`** - Complete Serverless Framework configuration with throttling
2. **`api-gateway-throttling.template.json`** - CloudFormation template for throttling infrastructure
3. **`deploy-throttling.sh`** - Bash script to deploy throttling configuration
4. **`API_THROTTLING_DOCUMENTATION.md`** - This documentation file

## Deployment Instructions

### Prerequisites
1. AWS CLI installed and configured
2. Serverless Framework installed (`npm install -g serverless`)
3. Appropriate AWS IAM permissions

### Method 1: Using Serverless Framework (Recommended)

1. Navigate to the AWS backend directory:
   ```bash
   cd /path/to/project/aws
   ```

2. Replace your existing serverless.yml with the throttling version:
   ```bash
   cp serverless-with-throttling.yml serverless.yml
   ```

3. Deploy to AWS:
   ```bash
   serverless deploy --stage dev --region us-east-1
   ```

### Method 2: Using CloudFormation

1. Navigate to the AWS directory:
   ```bash
   cd /path/to/project/aws
   ```

2. Run the deployment script:
   ```bash
   ./deploy-throttling.sh
   ```

   Or manually deploy the CloudFormation stack:
   ```bash
   aws cloudformation deploy \
     --template-file api-gateway-throttling.template.json \
     --stack-name rigup-api-throttling-dev \
     --parameter-overrides \
       ApiGatewayId=YOUR_API_ID \
       StageName=dev \
       DefaultRateLimit=5 \
       DefaultBurstLimit=10 \
     --capabilities CAPABILITY_IAM
   ```

### Method 3: Using AWS Console

1. Open AWS API Gateway Console
2. Select your API (rigup-backend)
3. Go to "Stages" → Select your stage (dev/staging/prod)
4. Click on "Method Request" for each endpoint
5. Under "Settings", configure:
   - Throttling → Rate: [As per table above]
   - Throttling → Burst: [As per table above]
6. Deploy the API

## Monitoring

### CloudWatch Metrics

The following metrics are automatically tracked:

- **4XXError** - Tracks throttling errors (429 Too Many Requests)
- **5XXError** - Server errors
- **Count** - Total API calls
- **Latency** - API response time

### CloudWatch Alarms

Two alarms are automatically created:

1. **Throttling Alarm** - Triggers when 4XX errors exceed 50 in 5 minutes
2. **High Latency Alarm** - Triggers when average latency exceeds 1000ms

### View Metrics via AWS CLI

```bash
# View throttling metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiName,Value=YOUR_API_ID Name=Stage,Value=dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# View request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=YOUR_API_ID Name=Stage,Value=dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Client-Side Integration

### Using API Keys (Optional)

If API keys are enabled, include them in requests:

```javascript
// In your awsApiService.ts
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('aws_api_token');
  const apiKey = process.env.REACT_APP_AWS_API_KEY;
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(apiKey && { 'x-api-key': apiKey }),
  };
};
```

### Handling 429 Errors

The client-side rate limiter already handles this, but you can add retry logic:

```javascript
async function apiFetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  try {
    return await apiFetch(endpoint, options);
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      // Wait and retry
      const retryAfter = error.headers?.['Retry-After'] || 1;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiFetchWithRetry(endpoint, options, retries - 1);
    }
    throw error;
  }
}
```

## Usage Plans

### Free Tier
- **Quota**: 1,000 requests per day
- **Rate Limit**: 2 requests per second
- **Burst Limit**: 5 requests

### Premium Tier
- **Quota**: 10,000 requests per day
- **Rate Limit**: 10 requests per second
- **Burst Limit**: 20 requests

## Best Practices

1. **Cache GET Requests**: Use caching for read-heavy endpoints to reduce API calls
2. **Batch Operations**: Combine multiple operations when possible
3. **Client-Side Rate Limiting**: Implement client-side throttling as first defense
4. **Monitor Usage**: Regularly review CloudWatch metrics
5. **Gradual Limits**: Start with conservative limits and adjust based on usage patterns

## Troubleshooting

### Common Issues

1. **429 Too Many Requests**
   - Solution: Implement exponential backoff
   - Check if client-side rate limiting is working

2. **High Latency**
   - Solution: Enable caching for GET requests
   - Consider increasing Lambda memory/timeout

3. **Uneven Distribution**
   - Solution: Implement request queuing on client
   - Use API Gateway caching

### Testing Throttling

```bash
# Test rate limiting (will trigger throttling)
for i in {1..20}; do
  curl -X GET https://your-api-gateway-url/dev/equipment &
done
wait
```

## Cost Optimization

1. **Caching**: Reduces backend calls and costs
2. **Appropriate Limits**: Prevents unnecessary Lambda invocations
3. **CloudWatch Logs**: Set appropriate retention periods
4. **Usage Plans**: Implement API keys for heavy users

## Security Benefits

1. **DDoS Protection**: Limits prevent overwhelming the backend
2. **Cost Protection**: Prevents runaway costs from abuse
3. **Fair Usage**: Ensures all users get fair access
4. **Monitoring**: Alerts on unusual patterns

## Maintenance

### Updating Limits

1. Edit the appropriate configuration file
2. Redeploy using chosen method
3. Monitor metrics for impact
4. Adjust as needed

### Viewing Current Configuration

```bash
# Get current stage throttling settings
aws apigateway get-stage \
  --rest-api-id YOUR_API_ID \
  --stage-name dev \
  --query 'throttle'
```

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CloudWatch Metrics
3. Verify API Gateway configuration
4. Check client-side rate limiting

---

*Last Updated: [Current Date]*
*Version: 1.0*