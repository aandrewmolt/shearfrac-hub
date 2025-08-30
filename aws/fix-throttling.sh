#!/bin/bash

# The easiest fix - Apply method-level throttling directly to enforce limits

API_ID="wmh8r4eixg"
STAGE="dev"
REGION="us-east-1"

echo "=== Fixing API Gateway Throttling ==="
echo "This script applies method-level throttling to enforce rate limits"
echo ""

# Apply method-level throttling (the key to making it work!)
echo "Setting up method-level throttling..."

# Apply throttling to ALL methods using wildcards
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
    op=replace,path=/\*/\*/throttling/burstLimit,value=10 \
    op=replace,path=/\*/\*/throttling/rateLimit,value=5 \
    op=replace,path=/\*/\*/metricsEnabled,value=true

echo "✓ Applied default throttling to all methods (5 req/s, burst: 10)"

# Apply specific throttling to equipment endpoint
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
    op=replace,path=/~1equipment/GET/throttling/burstLimit,value=10 \
    op=replace,path=/~1equipment/GET/throttling/rateLimit,value=5

echo "✓ Applied specific throttling to /equipment GET endpoint"

# Verify the settings
echo ""
echo "=== Verifying Throttling Settings ==="
aws apigateway get-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --query 'methodSettings' \
  --output json

echo ""
echo "=== Testing Throttling ==="
echo "Sending 15 rapid requests (should see 429 errors after 10)..."
echo ""

# Test with the API key
API_KEY="C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A"

for i in {1..15}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "x-api-key: $API_KEY" \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment")
  
  if [ "$STATUS" = "429" ]; then
    echo "Request $i: $STATUS ✓ (Rate limit working!)"
  else
    echo "Request $i: $STATUS"
  fi
  
  # Small delay to avoid connection issues
  sleep 0.1
done

echo ""
echo "Done! If you see 429 errors above, throttling is now working."
echo "If not, wait 60 seconds for changes to propagate and run this script again."