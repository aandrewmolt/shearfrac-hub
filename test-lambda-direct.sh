#!/bin/bash

# Test Lambda functions directly to see if they return CORS headers

REGION="us-east-1"

echo "Testing Lambda functions directly..."
echo ""

# Test equipment list function
echo "=== Testing Equipment Lambda ==="
RESPONSE=$(aws lambda invoke \
    --function-name rigup-v2-backend-aws-dev-getEquipment \
    --region $REGION \
    --cli-binary-format raw-in-base64-out \
    --payload '{"httpMethod":"GET","headers":{},"path":"/equipment"}' \
    /tmp/equipment-response.json 2>&1)

if [ -f /tmp/equipment-response.json ]; then
    echo "Response:"
    cat /tmp/equipment-response.json | jq '.'
    echo ""
    echo "CORS Headers in response:"
    cat /tmp/equipment-response.json | jq '.headers'
else
    echo "Error invoking Lambda: $RESPONSE"
fi

echo ""
echo "=== Testing Jobs Lambda ==="
RESPONSE=$(aws lambda invoke \
    --function-name rigup-v2-backend-aws-dev-getJobs \
    --region $REGION \
    --cli-binary-format raw-in-base64-out \
    --payload '{"httpMethod":"GET","headers":{},"path":"/jobs"}' \
    /tmp/jobs-response.json 2>&1)

if [ -f /tmp/jobs-response.json ]; then
    echo "Response:"
    cat /tmp/jobs-response.json | jq '.statusCode,.headers' | head -20
else
    echo "Error invoking Lambda: $RESPONSE"
fi