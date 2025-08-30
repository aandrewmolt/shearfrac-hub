#!/bin/bash

# Apply throttling to existing API Gateway without full redeploy

API_ID="wmh8r4eixg"
STAGE="dev"
REGION="us-east-1"

echo "=== Applying API Gateway Throttling ==="
echo "API ID: $API_ID"
echo "Stage: $STAGE"
echo ""

# Create a usage plan with throttling
echo "Creating usage plan with throttling..."
USAGE_PLAN_ID=$(aws apigateway create-usage-plan \
  --name "rigup-throttling-plan" \
  --description "Throttling plan for RigUp API" \
  --throttle burstLimit=10,rateLimit=5 \
  --api-stages apiId=$API_ID,stage=$STAGE \
  --region $REGION \
  --query 'id' \
  --output text 2>/dev/null)

if [ ! -z "$USAGE_PLAN_ID" ]; then
  echo "✓ Usage plan created: $USAGE_PLAN_ID"
  
  # Create API key
  echo "Creating API key..."
  API_KEY_ID=$(aws apigateway create-api-key \
    --name "rigup-api-key-$(date +%s)" \
    --description "API key for RigUp" \
    --enabled \
    --region $REGION \
    --query 'id' \
    --output text 2>/dev/null)
  
  if [ ! -z "$API_KEY_ID" ]; then
    echo "✓ API key created: $API_KEY_ID"
    
    # Link API key to usage plan
    aws apigateway create-usage-plan-key \
      --usage-plan-id $USAGE_PLAN_ID \
      --key-id $API_KEY_ID \
      --key-type API_KEY \
      --region $REGION 2>/dev/null
    
    echo "✓ API key linked to usage plan"
    
    # Get the actual API key value
    API_KEY_VALUE=$(aws apigateway get-api-key \
      --api-key $API_KEY_ID \
      --include-value \
      --region $REGION \
      --query 'value' \
      --output text)
    
    echo ""
    echo "=== Throttling Applied Successfully ==="
    echo "Usage Plan ID: $USAGE_PLAN_ID"
    echo "API Key ID: $API_KEY_ID"
    echo "API Key Value: $API_KEY_VALUE"
    echo ""
    echo "Default limits: 5 requests/second, burst of 10"
    echo ""
    echo "NOTE: To enforce throttling, you need to:"
    echo "1. Make the API require an API key in API Gateway console"
    echo "2. Include the header 'x-api-key: $API_KEY_VALUE' in your requests"
    echo ""
    echo "Without requiring API keys, the throttling won't be enforced."
  fi
else
  echo "Usage plan might already exist. Checking..."
  
  # Check if usage plan already exists
  EXISTING_PLAN=$(aws apigateway get-usage-plans \
    --region $REGION \
    --query "items[?name=='rigup-throttling-plan'].id" \
    --output text)
  
  if [ ! -z "$EXISTING_PLAN" ]; then
    echo "✓ Usage plan already exists: $EXISTING_PLAN"
    
    # Update throttling limits
    aws apigateway update-usage-plan \
      --usage-plan-id $EXISTING_PLAN \
      --patch-operations \
        op=replace,path=/throttle/burstLimit,value=10 \
        op=replace,path=/throttle/rateLimit,value=5 \
      --region $REGION
    
    echo "✓ Updated throttling limits"
  fi
fi

echo ""
echo "=== Testing API ==="
echo "Sending test requests..."
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment)
  echo -n "$STATUS "
done
echo ""
echo ""
echo "Note: Without API key requirement, you'll see all 200s."
echo "Throttling only applies when API keys are required."