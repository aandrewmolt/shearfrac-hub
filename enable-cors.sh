#!/bin/bash

# Enable CORS for API Gateway using AWS CLI

# Set your API ID (extracted from your URL)
API_ID="wmh8r4eixg"
REGION="us-east-1"
STAGE="dev"

echo "🔧 Enabling CORS for API Gateway: $API_ID"
echo "Region: $REGION"
echo "Stage: $STAGE"
echo ""

# First, get all resources
echo "📋 Getting API resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[].id" --output text)

if [ -z "$RESOURCES" ]; then
    echo "❌ No resources found. Please check API ID and region."
    exit 1
fi

echo "Found resources: $RESOURCES"
echo ""

# Function to add CORS to a resource method
add_cors_to_method() {
    local RESOURCE_ID=$1
    local HTTP_METHOD=$2
    
    echo "  Adding CORS to $HTTP_METHOD method..."
    
    # Add method response for 200
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=false,method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false" \
        --region $REGION 2>/dev/null
    
    # Add integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,PATCH'" \
        --region $REGION 2>/dev/null
}

# Function to add OPTIONS method for CORS preflight
add_options_method() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo "📝 Processing resource: $RESOURCE_PATH"
    
    # Check if OPTIONS method already exists
    aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION &>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "  Creating OPTIONS method..."
        
        # Create OPTIONS method
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --authorization-type NONE \
            --region $REGION &>/dev/null
        
        # Add method response
        aws apigateway put-method-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --status-code 200 \
            --response-parameters "method.response.header.Access-Control-Allow-Origin=false,method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Credentials=false" \
            --response-models '{"application/json":"Empty"}' \
            --region $REGION &>/dev/null
        
        # Add mock integration
        aws apigateway put-integration \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --type MOCK \
            --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
            --region $REGION &>/dev/null
        
        # Add integration response
        aws apigateway put-integration-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --status-code 200 \
            --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,PATCH',method.response.header.Access-Control-Allow-Credentials='true'" \
            --response-templates '{"application/json":""}' \
            --region $REGION &>/dev/null
        
        echo "  ✅ OPTIONS method created"
    else
        echo "  OPTIONS method already exists"
    fi
    
    # Add CORS to other methods
    for METHOD in GET POST PUT DELETE PATCH; do
        aws apigateway get-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --region $REGION &>/dev/null
        
        if [ $? -eq 0 ]; then
            add_cors_to_method $RESOURCE_ID $METHOD
        fi
    done
}

# Process each resource
for RESOURCE_ID in $RESOURCES; do
    # Get resource details
    RESOURCE_PATH=$(aws apigateway get-resource \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --region $REGION \
        --query "path" \
        --output text)
    
    # Skip root resource
    if [ "$RESOURCE_PATH" != "/" ]; then
        add_options_method $RESOURCE_ID $RESOURCE_PATH
    fi
done

echo ""
echo "🚀 Deploying API to stage: $STAGE"
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Enable CORS on all endpoints" \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ CORS enabled and API deployed successfully!"
    echo ""
    echo "Test your API at: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"
else
    echo "❌ Failed to deploy API"
fi