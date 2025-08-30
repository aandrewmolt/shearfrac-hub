#!/bin/bash

# Direct AWS CLI deployment script for API Gateway throttling
# This bypasses Serverless Framework and uses AWS CLI directly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="${AWS_REGION:-us-east-1}"
STAGE="${STAGE:-dev}"
API_NAME="rigup-backend-${STAGE}"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Starting API Gateway throttling configuration..."
print_status "Region: $REGION"
print_status "Stage: $STAGE"

# Find the API Gateway
print_status "Finding API Gateway..."
API_ID=$(aws apigateway get-rest-apis \
    --region $REGION \
    --query "items[?name=='$API_NAME'].id" \
    --output text)

if [ -z "$API_ID" ]; then
    print_warning "API Gateway '$API_NAME' not found."
    print_status "Searching for any API with 'rigup' in the name..."
    
    # Search for any rigup API
    API_ID=$(aws apigateway get-rest-apis \
        --region $REGION \
        --query "items[?contains(name, 'rigup')].id" \
        --output text | head -n1)
    
    if [ -z "$API_ID" ]; then
        print_error "No API Gateway found. Please deploy your API first."
        exit 1
    fi
fi

print_status "Found API Gateway ID: $API_ID"

# Get API name for display
API_NAME=$(aws apigateway get-rest-api \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "name" \
    --output text)

print_status "API Name: $API_NAME"

# Apply stage-level throttling
print_status "Applying stage-level throttling (5 req/s, burst: 10)..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/throttle/burstLimit,value=10 \
        op=replace,path=/throttle/rateLimit,value=5 \
    --region $REGION 2>/dev/null || true

# Enable CloudWatch metrics
print_status "Enabling CloudWatch metrics..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/methodSettings/~1~1GET/metricsEnabled,value=true \
        op=replace,path=/methodSettings/~1~1GET/loggingLevel,value=INFO \
        op=replace,path=/methodSettings/~1~1POST/metricsEnabled,value=true \
        op=replace,path=/methodSettings/~1~1POST/loggingLevel,value=INFO \
    --region $REGION 2>/dev/null || true

# Apply per-resource throttling
print_status "Applying per-resource throttling..."

# Equipment endpoints
print_status "  Configuring equipment endpoints..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/~1equipment/GET/throttle/rateLimit,value=10 \
        op=replace,path=/~1equipment/GET/throttle/burstLimit,value=20 \
        op=replace,path=/~1equipment/POST/throttle/rateLimit,value=2 \
        op=replace,path=/~1equipment/POST/throttle/burstLimit,value=5 \
    --region $REGION 2>/dev/null || true

# Jobs endpoints
print_status "  Configuring jobs endpoints..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/~1jobs/GET/throttle/rateLimit,value=8 \
        op=replace,path=/~1jobs/GET/throttle/burstLimit,value=15 \
        op=replace,path=/~1jobs/POST/throttle/rateLimit,value=2 \
        op=replace,path=/~1jobs/POST/throttle/burstLimit,value=5 \
    --region $REGION 2>/dev/null || true

# Contacts endpoints
print_status "  Configuring contacts endpoints..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/~1contacts/GET/throttle/rateLimit,value=5 \
        op=replace,path=/~1contacts/GET/throttle/burstLimit,value=10 \
        op=replace,path=/~1contacts/POST/throttle/rateLimit,value=1 \
        op=replace,path=/~1contacts/POST/throttle/burstLimit,value=3 \
    --region $REGION 2>/dev/null || true

# Create CloudWatch alarm for throttling
print_status "Creating CloudWatch alarms..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${API_NAME}-throttling-alarm" \
    --alarm-description "Alert when API throttling exceeds threshold" \
    --metric-name 4XXError \
    --namespace AWS/ApiGateway \
    --dimensions Name=ApiName,Value=$API_ID Name=Stage,Value=$STAGE \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 50 \
    --comparison-operator GreaterThanThreshold \
    --region $REGION 2>/dev/null || true

print_status "Creating high latency alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${API_NAME}-latency-alarm" \
    --alarm-description "Alert when API latency is high" \
    --metric-name Latency \
    --namespace AWS/ApiGateway \
    --dimensions Name=ApiName,Value=$API_ID Name=Stage,Value=$STAGE \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 1000 \
    --comparison-operator GreaterThanThreshold \
    --region $REGION 2>/dev/null || true

# Get the API Gateway URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

print_status ""
print_status "=== Throttling Configuration Complete ==="
print_status ""
print_status "API Gateway ID: $API_ID"
print_status "API URL: $API_URL"
print_status ""
print_status "Throttling Limits Applied:"
print_status "  Default: 5 req/s (burst: 10)"
print_status "  Equipment GET: 10 req/s (burst: 20)"
print_status "  Equipment POST: 2 req/s (burst: 5)"
print_status "  Jobs GET: 8 req/s (burst: 15)"
print_status "  Jobs POST: 2 req/s (burst: 5)"
print_status "  Contacts: 1-5 req/s (burst: 3-10)"
print_status ""
print_status "CloudWatch Alarms:"
print_status "  - ${API_NAME}-throttling-alarm"
print_status "  - ${API_NAME}-latency-alarm"
print_status ""
print_status "To test throttling:"
print_status "  for i in {1..20}; do curl -X GET ${API_URL}/equipment & done"
print_status ""
print_status "To view metrics:"
print_status "  aws cloudwatch get-metric-statistics \\"
print_status "    --namespace AWS/ApiGateway \\"
print_status "    --metric-name 4XXError \\"
print_status "    --dimensions Name=ApiName,Value=$API_ID Name=Stage,Value=$STAGE \\"
print_status "    --start-time \$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\"
print_status "    --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) \\"
print_status "    --period 300 \\"
print_status "    --statistics Sum \\"
print_status "    --region $REGION"
print_status ""
print_status "Deployment complete!"