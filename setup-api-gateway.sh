#!/bin/bash

# Complete API Gateway Setup with CORS
# This script creates all endpoints and enables CORS

API_ID="wmh8r4eixg"
REGION="us-east-1"
STAGE="dev"

echo "🔧 Setting up API Gateway: $API_ID"
echo "Region: $REGION"
echo "Stage: $STAGE"
echo ""

# Get the root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/'].id" --output text)

if [ -z "$ROOT_ID" ]; then
    echo "❌ Could not find root resource. Please check API ID."
    exit 1
fi

echo "Root resource ID: $ROOT_ID"
echo ""

# Function to create resource and add CORS
create_resource_with_cors() {
    local PARENT_ID=$1
    local PATH_PART=$2
    local FULL_PATH=$3
    
    echo "📝 Creating resource: $FULL_PATH"
    
    # Check if resource already exists
    RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?path=='$FULL_PATH'].id" \
        --output text)
    
    # Create resource if it doesn't exist
    if [ -z "$RESOURCE_ID" ]; then
        RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $PARENT_ID \
            --path-part "$PATH_PART" \
            --region $REGION \
            --query "id" \
            --output text)
        echo "  Created resource with ID: $RESOURCE_ID"
    else
        echo "  Resource already exists with ID: $RESOURCE_ID"
    fi
    
    echo "$RESOURCE_ID"
}

# Function to add method with Lambda integration
add_method_with_lambda() {
    local RESOURCE_ID=$1
    local HTTP_METHOD=$2
    local LAMBDA_NAME=$3
    
    echo "  Adding $HTTP_METHOD method with Lambda: $LAMBDA_NAME"
    
    # Delete method if it exists (to recreate)
    aws apigateway delete-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --region $REGION &>/dev/null
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --authorization-type NONE \
        --region $REGION &>/dev/null
    
    # Add Lambda integration
    LAMBDA_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$LAMBDA_NAME"
    
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
        --region $REGION &>/dev/null
    
    # Add method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=false,method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false" \
        --region $REGION &>/dev/null
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name $LAMBDA_NAME \
        --statement-id "apigateway-$HTTP_METHOD-$(date +%s)" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/$HTTP_METHOD/*" \
        --region $REGION &>/dev/null
    
    echo "    ✅ $HTTP_METHOD method added"
}

# Function to add OPTIONS method for CORS
add_options_method() {
    local RESOURCE_ID=$1
    
    echo "  Adding OPTIONS method for CORS"
    
    # Delete if exists
    aws apigateway delete-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION &>/dev/null
    
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION &>/dev/null
    
    # Add mock integration for OPTIONS
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
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
    
    # Add integration response with CORS headers
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,PATCH',method.response.header.Access-Control-Allow-Credentials='true'" \
        --response-templates '{"application/json":""}' \
        --region $REGION &>/dev/null
    
    echo "    ✅ OPTIONS method added"
}

# Create all resources and methods
echo "🚀 Creating API endpoints..."
echo ""

# Equipment endpoints
EQUIPMENT_ID=$(create_resource_with_cors $ROOT_ID "equipment" "/equipment")
add_method_with_lambda $EQUIPMENT_ID "GET" "rigup-v2-backend-aws-dev-getEquipment"
add_method_with_lambda $EQUIPMENT_ID "POST" "rigup-v2-backend-aws-dev-createEquipment"
add_options_method $EQUIPMENT_ID

# Equipment/{id} endpoints
EQUIPMENT_ITEM_ID=$(create_resource_with_cors $EQUIPMENT_ID "{id}" "/equipment/{id}")
add_method_with_lambda $EQUIPMENT_ITEM_ID "GET" "rigup-v2-backend-aws-dev-getEquipmentItem"
add_method_with_lambda $EQUIPMENT_ITEM_ID "PUT" "rigup-v2-backend-aws-dev-updateEquipment"
add_method_with_lambda $EQUIPMENT_ITEM_ID "DELETE" "rigup-v2-backend-aws-dev-deleteEquipment"
add_options_method $EQUIPMENT_ITEM_ID

# Equipment/{id}/status endpoint
EQUIPMENT_STATUS_ID=$(create_resource_with_cors $EQUIPMENT_ITEM_ID "status" "/equipment/{id}/status")
add_method_with_lambda $EQUIPMENT_STATUS_ID "PATCH" "rigup-v2-backend-aws-dev-updateEquipmentStatus"
add_options_method $EQUIPMENT_STATUS_ID

# Equipment/deploy endpoint
EQUIPMENT_DEPLOY_ID=$(create_resource_with_cors $EQUIPMENT_ID "deploy" "/equipment/deploy")
add_method_with_lambda $EQUIPMENT_DEPLOY_ID "POST" "rigup-v2-backend-aws-dev-deployEquipment"
add_options_method $EQUIPMENT_DEPLOY_ID

# Equipment/return endpoint
EQUIPMENT_RETURN_ID=$(create_resource_with_cors $EQUIPMENT_ID "return" "/equipment/return")
add_method_with_lambda $EQUIPMENT_RETURN_ID "POST" "rigup-v2-backend-aws-dev-returnEquipment"
add_options_method $EQUIPMENT_RETURN_ID

# Jobs endpoints
JOBS_ID=$(create_resource_with_cors $ROOT_ID "jobs" "/jobs")
add_method_with_lambda $JOBS_ID "GET" "rigup-v2-backend-aws-dev-getJobs"
add_method_with_lambda $JOBS_ID "POST" "rigup-v2-backend-aws-dev-createJob"
add_options_method $JOBS_ID

# Jobs/{id} endpoints
JOBS_ITEM_ID=$(create_resource_with_cors $JOBS_ID "{id}" "/jobs/{id}")
add_method_with_lambda $JOBS_ITEM_ID "GET" "rigup-v2-backend-aws-dev-getJob"
add_method_with_lambda $JOBS_ITEM_ID "PUT" "rigup-v2-backend-aws-dev-updateJob"
add_method_with_lambda $JOBS_ITEM_ID "DELETE" "rigup-v2-backend-aws-dev-deleteJob"
add_options_method $JOBS_ITEM_ID

# Jobs/{id}/diagram endpoint
JOBS_DIAGRAM_ID=$(create_resource_with_cors $JOBS_ITEM_ID "diagram" "/jobs/{id}/diagram")
add_method_with_lambda $JOBS_DIAGRAM_ID "GET" "rigup-v2-backend-aws-dev-getDiagram"
add_method_with_lambda $JOBS_DIAGRAM_ID "PUT" "rigup-v2-backend-aws-dev-saveDiagram"
add_options_method $JOBS_DIAGRAM_ID

# Jobs/{id}/photos endpoint
JOBS_PHOTOS_ID=$(create_resource_with_cors $JOBS_ITEM_ID "photos" "/jobs/{id}/photos")
add_method_with_lambda $JOBS_PHOTOS_ID "GET" "rigup-v2-backend-aws-dev-listJobPhotos"
add_options_method $JOBS_PHOTOS_ID

# Contacts endpoints
CONTACTS_ID=$(create_resource_with_cors $ROOT_ID "contacts" "/contacts")
add_method_with_lambda $CONTACTS_ID "GET" "rigup-v2-backend-aws-dev-getContacts"
add_method_with_lambda $CONTACTS_ID "POST" "rigup-v2-backend-aws-dev-createContact"
add_options_method $CONTACTS_ID

# Contacts/{id} endpoints
CONTACTS_ITEM_ID=$(create_resource_with_cors $CONTACTS_ID "{id}" "/contacts/{id}")
add_method_with_lambda $CONTACTS_ITEM_ID "GET" "rigup-v2-backend-aws-dev-getContact"
add_method_with_lambda $CONTACTS_ITEM_ID "PUT" "rigup-v2-backend-aws-dev-updateContact"
add_method_with_lambda $CONTACTS_ITEM_ID "DELETE" "rigup-v2-backend-aws-dev-deleteContact"
add_options_method $CONTACTS_ITEM_ID

# Clients endpoints
CLIENTS_ID=$(create_resource_with_cors $ROOT_ID "clients" "/clients")
add_method_with_lambda $CLIENTS_ID "GET" "rigup-v2-backend-aws-dev-getClients"
add_method_with_lambda $CLIENTS_ID "POST" "rigup-v2-backend-aws-dev-createClient"
add_options_method $CLIENTS_ID

# Health endpoint
HEALTH_ID=$(create_resource_with_cors $ROOT_ID "health" "/health")
add_method_with_lambda $HEALTH_ID "GET" "rigup-v2-backend-aws-dev-health"
add_options_method $HEALTH_ID

echo ""
echo "🚀 Deploying API to stage: $STAGE"
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Complete API setup with CORS" \
    --region $REGION

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API Gateway setup complete!"
    echo ""
    echo "API URL: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"
    echo ""
    echo "Test endpoints:"
    echo "  - https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/health"
    echo "  - https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/equipment"
    echo "  - https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/jobs"
else
    echo "❌ Failed to deploy API"
fi