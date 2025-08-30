#!/bin/bash

# Check and apply throttling to API Gateway

API_ID="wmh8r4eixg"
STAGE="dev"
REGION="us-east-1"

echo "=== Checking Current Throttling Settings ==="
aws apigateway get-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --query '{StageName:stageName,MethodSettings:methodSettings}' \
  --output json

echo ""
echo "=== Applying Throttling Settings ==="

# Apply default throttling to all methods
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
  op=replace,path=/\*/\*/throttling/burstLimit,value=10 \
  op=replace,path=/\*/\*/throttling/rateLimit,value=5 \
  op=replace,path=/\*/\*/metricsEnabled,value=true

echo ""
echo "=== Verifying Applied Settings ==="
aws apigateway get-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --query 'methodSettings' \
  --output json

echo ""
echo "=== Testing Throttling ==="
echo "API URL: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"
echo ""
echo "To test throttling, run this command:"
echo "for i in {1..15}; do curl -X GET https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment & done; wait"