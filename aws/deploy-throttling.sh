#!/bin/bash

# AWS API Gateway Throttling Deployment Script
# This script deploys throttling configurations to AWS API Gateway

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="rigup-api-throttling"
TEMPLATE_FILE="api-gateway-throttling.template.json"
REGION="${AWS_REGION:-us-east-1}"
STAGE="${STAGE:-dev}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Starting API Gateway throttling deployment..."
print_status "Region: $REGION"
print_status "Stage: $STAGE"

# Get the API Gateway ID
print_status "Finding API Gateway ID..."
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='rigup-backend-$STAGE'].id" --output text)

if [ -z "$API_ID" ]; then
    print_error "API Gateway not found. Make sure the API is deployed first."
    print_status "You can deploy the API using: serverless deploy --stage $STAGE"
    exit 1
fi

print_status "Found API Gateway ID: $API_ID"

# Deploy CloudFormation stack for throttling
print_status "Deploying CloudFormation stack for throttling configuration..."

aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME-$STAGE \
    --parameter-overrides \
        ApiGatewayId=$API_ID \
        StageName=$STAGE \
        DefaultRateLimit=5 \
        DefaultBurstLimit=10 \
    --region $REGION \
    --capabilities CAPABILITY_IAM

if [ $? -eq 0 ]; then
    print_status "CloudFormation stack deployed successfully!"
else
    print_error "CloudFormation deployment failed!"
    exit 1
fi

# Get the API Key from the stack outputs
print_status "Retrieving API Key..."
API_KEY_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME-$STAGE \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" \
    --output text)

if [ ! -z "$API_KEY_ID" ]; then
    API_KEY_VALUE=$(aws apigateway get-api-key \
        --api-key $API_KEY_ID \
        --include-value \
        --region $REGION \
        --query "value" \
        --output text)
    
    print_status "API Key created: $API_KEY_VALUE"
    print_warning "Save this API key securely. You'll need it for API requests."
fi

# Apply throttling using AWS CLI (alternative method)
print_status "Applying additional throttling settings via AWS CLI..."

# Update stage throttling settings
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/throttle/burstLimit,value=10 \
        op=replace,path=/throttle/rateLimit,value=5 \
    --region $REGION

# Enable CloudWatch metrics
print_status "Enabling CloudWatch metrics for monitoring..."
aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --patch-operations \
        op=replace,path=/methodSettings/~1~1GET/metricsEnabled,value=true \
        op=replace,path=/methodSettings/~1~1GET/loggingLevel,value=INFO \
    --region $REGION

print_status "Throttling configuration deployed successfully!"
print_status ""
print_status "=== Throttling Configuration Summary ==="
print_status "Default Rate Limit: 5 requests/second"
print_status "Default Burst Limit: 10 requests"
print_status ""
print_status "Per-Endpoint Limits:"
print_status "  Equipment GET: 10 req/s (burst: 20)"
print_status "  Equipment POST/PUT: 2 req/s (burst: 5)"
print_status "  Equipment DELETE: 1 req/s (burst: 3)"
print_status "  Jobs GET: 8 req/s (burst: 15)"
print_status "  Jobs POST/PUT: 2 req/s (burst: 5)"
print_status "  Contacts GET: 5 req/s (burst: 10)"
print_status "  Contacts POST/PUT: 1 req/s (burst: 3)"
print_status ""
print_status "CloudWatch Alarms:"
print_status "  - $STACK_NAME-$STAGE-throttling-alarm"
print_status "  - $STACK_NAME-$STAGE-high-latency-alarm"
print_status ""
print_status "To monitor throttling:"
print_status "  aws cloudwatch get-metric-statistics \\"
print_status "    --namespace AWS/ApiGateway \\"
print_status "    --metric-name 4XXError \\"
print_status "    --dimensions Name=ApiName,Value=$API_ID Name=Stage,Value=$STAGE \\"
print_status "    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\"
print_status "    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\"
print_status "    --period 300 \\"
print_status "    --statistics Sum"
print_status ""
print_status "Deployment complete!"