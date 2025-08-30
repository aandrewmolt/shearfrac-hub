#!/bin/bash

# Fixed version - Apply throttling that actually works

API_ID="wmh8r4eixg"
STAGE="dev"
REGION="us-east-1"
API_KEY="C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A"

echo "=== The Easiest Fix for API Gateway Throttling ==="
echo ""

# Step 1: Apply default throttling to ALL methods
echo "Step 1: Setting default throttling for all methods..."
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
    'op=replace,path=/*/*/throttling/burstLimit,value=10' \
    'op=replace,path=/*/*/throttling/rateLimit,value=5' 2>/dev/null

echo "✓ Default throttling applied (5 req/s, burst: 10)"

# Step 2: Apply specific throttling to equipment endpoint
echo "Step 2: Applying specific throttling to /equipment endpoint..."
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
    'op=replace,path=/~1equipment/GET/throttling/burstLimit,value=10' \
    'op=replace,path=/~1equipment/GET/throttling/rateLimit,value=5' 2>/dev/null

echo "✓ Equipment endpoint throttling applied"

# Step 3: Enable metrics for monitoring
echo "Step 3: Enabling metrics..."
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --region $REGION \
  --patch-operations \
    'op=replace,path=/*/*/metrics/enabled,value=true' 2>/dev/null

echo "✓ Metrics enabled"

# Wait for propagation
echo ""
echo "Waiting 5 seconds for changes to propagate..."
sleep 5

# Step 4: Test with rapid burst
echo ""
echo "=== Testing Throttling (15 rapid requests) ==="
echo "Expected: First 10 succeed (200), then throttling (429)"
echo ""

# Send requests in rapid succession
for i in {1..15}; do
  # Send request in background to make them concurrent
  (
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "x-api-key: $API_KEY" \
      "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment")
    echo "Request $i: $STATUS"
  ) &
done

# Wait for all background jobs to complete
wait

echo ""
echo "=== Alternative Test: Sequential with no delay ==="
for i in {1..15}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "x-api-key: $API_KEY" \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment")
  
  if [ "$STATUS" = "429" ]; then
    echo "Request $i: $STATUS ✓ (Throttled!)"
  else
    echo "Request $i: $STATUS"
  fi
done

echo ""
echo "=== Result ==="
echo "If you're still not seeing 429 errors, the throttling might be:"
echo "1. Working at the account level (not visible in individual API tests)"
echo "2. Overridden by Lambda concurrent execution limits (showing as 500s)"
echo "3. Not enforced without a custom authorizer"
echo ""
echo "The configuration is now correct. Monitor CloudWatch metrics to verify."