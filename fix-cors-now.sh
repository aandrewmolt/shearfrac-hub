#!/bin/bash

# Quick CORS fix for API Gateway
API_ID="wmh8r4eixg"
REGION="us-east-1"
STAGE="dev"

echo "🔧 Quick CORS Fix for API: $API_ID"
echo ""

# Get all resources
echo "Getting resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --max-items 500)

# Extract resource IDs and paths
echo "$RESOURCES" | jq -r '.items[] | "\(.id)|\(.path)"' | while IFS='|' read -r RESOURCE_ID RESOURCE_PATH; do
    
    if [ "$RESOURCE_PATH" == "/" ]; then
        continue
    fi
    
    echo "Processing: $RESOURCE_PATH"
    
    # For each HTTP method that exists
    for METHOD in GET POST PUT DELETE PATCH OPTIONS; do
        # Check if method exists
        aws apigateway get-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --region $REGION &>/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "  Fixing $METHOD..."
            
            if [ "$METHOD" == "OPTIONS" ]; then
                # Fix OPTIONS method for CORS preflight
                
                # Delete existing integration response
                aws apigateway delete-integration-response \
                    --rest-api-id $API_ID \
                    --resource-id $RESOURCE_ID \
                    --http-method OPTIONS \
                    --status-code 200 \
                    --region $REGION &>/dev/null 2>&1
                
                # Add new integration response with CORS headers
                aws apigateway put-integration-response \
                    --rest-api-id $API_ID \
                    --resource-id $RESOURCE_ID \
                    --http-method OPTIONS \
                    --status-code 200 \
                    --response-parameters '{
                        "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
                        "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS,PATCH'\''",
                        "method.response.header.Access-Control-Allow-Origin": "'\''*'\''"
                    }' \
                    --region $REGION &>/dev/null 2>&1
                
            else
                # For other methods, ensure integration response has CORS
                
                # Check if integration response exists
                aws apigateway get-integration-response \
                    --rest-api-id $API_ID \
                    --resource-id $RESOURCE_ID \
                    --http-method $METHOD \
                    --status-code 200 \
                    --region $REGION &>/dev/null 2>&1
                
                if [ $? -ne 0 ]; then
                    # Create integration response if it doesn't exist
                    aws apigateway put-integration-response \
                        --rest-api-id $API_ID \
                        --resource-id $RESOURCE_ID \
                        --http-method $METHOD \
                        --status-code 200 \
                        --region $REGION &>/dev/null 2>&1
                fi
            fi
        fi
    done
done

echo ""
echo "🚀 Deploying changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "CORS fix $(date)" \
    --region $REGION

echo "✅ Done! Test your API now."
echo ""
echo "If CORS still doesn't work, the Lambda functions need to return CORS headers."