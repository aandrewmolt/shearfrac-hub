#!/usr/bin/env python3

import boto3
import json
import sys

# Configuration
API_ID = "wmh8r4eixg"
REGION = "us-east-1"
STAGE = "dev"

# Correct Lambda function mappings
LAMBDA_MAPPINGS = {
    ('/equipment', 'GET'): 'rigup-backend-dev-getEquipment',
    ('/equipment', 'POST'): 'rigup-backend-dev-createEquipment',
    ('/equipment/{id}', 'GET'): 'rigup-backend-dev-getEquipmentItem',
    ('/equipment/{id}', 'PUT'): 'rigup-backend-dev-updateEquipment',
    ('/equipment/{id}/status', 'PATCH'): 'rigup-backend-dev-updateEquipmentStatus',
    ('/equipment/deploy', 'POST'): 'rigup-backend-dev-deployEquipment',
    ('/equipment/return', 'POST'): 'rigup-backend-dev-returnEquipment',
    ('/jobs', 'GET'): 'rigup-backend-dev-getJobs',
    ('/jobs', 'POST'): 'rigup-backend-dev-createJob',
    ('/jobs/{id}', 'GET'): 'rigup-backend-dev-getJob',
    ('/jobs/{id}', 'PUT'): 'rigup-backend-dev-updateJob',
    ('/jobs/{id}', 'DELETE'): 'rigup-backend-dev-deleteJob',
    ('/jobs/{id}/diagram', 'GET'): 'rigup-backend-dev-getDiagram',
    ('/jobs/{id}/diagram', 'PUT'): 'rigup-backend-dev-saveDiagram',
    ('/jobs/{id}/photos', 'GET'): 'rigup-backend-dev-listJobPhotos',
    ('/contacts', 'GET'): 'rigup-backend-dev-getContacts',
    ('/contacts', 'POST'): 'rigup-backend-dev-createContact',
    ('/contacts/{id}', 'GET'): 'rigup-backend-dev-getContact',
    ('/contacts/{id}', 'PUT'): 'rigup-backend-dev-updateContact',
    ('/contacts/{id}', 'DELETE'): 'rigup-backend-dev-deleteContact',
    ('/clients', 'GET'): 'rigup-backend-dev-getClients',
    ('/clients', 'POST'): 'rigup-backend-dev-createClient',
    ('/health', 'GET'): 'rigup-backend-dev-healthCheck',
    ('/photos/upload-url', 'POST'): 'rigup-backend-dev-getUploadUrl',
    ('/photos/{key}', 'GET'): 'rigup-backend-dev-getPhotoUrl',
    ('/photos/{key}', 'DELETE'): 'rigup-backend-dev-deletePhoto',
    ('/export/{type}', 'POST'): 'rigup-backend-dev-exportData',
    ('/import/{type}', 'POST'): 'rigup-backend-dev-importData',
}

client = boto3.client('apigateway', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)
sts_client = boto3.client('sts', region_name=REGION)

def get_account_id():
    return sts_client.get_caller_identity()['Account']

def fix_lambda_integration(resource_id, resource_path, http_method, lambda_name):
    """Fix Lambda integration for a specific method"""
    print(f"    Fixing {http_method} → {lambda_name}")
    
    try:
        account_id = get_account_id()
        lambda_arn = f"arn:aws:lambda:{REGION}:{account_id}:function:{lambda_name}"
        integration_uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
        
        # Delete existing integration
        try:
            client.delete_integration(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod=http_method
            )
        except:
            pass
        
        # Create new Lambda integration
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=http_method,
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=integration_uri
        )
        
        # Add Lambda permission
        try:
            lambda_client.add_permission(
                FunctionName=lambda_name,
                StatementId=f"apigateway-{http_method}-{resource_id}-{int(__import__('time').time())}",
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{account_id}:{API_ID}/*/{http_method}/*"
            )
        except Exception as e:
            if "ResourceConflictException" not in str(e):
                print(f"      Warning: Permission error: {str(e)}")
        
        print(f"      ✓ {http_method} connected to {lambda_name}")
        
    except Exception as e:
        print(f"      ✗ Error: {str(e)}")

def main():
    print(f"🔧 Fixing Lambda integrations for API: {API_ID}")
    print(f"   Region: {REGION}")
    print("")
    
    try:
        # Get all resources
        print("📋 Getting resources...")
        paginator = client.get_paginator('get_resources')
        page_iterator = paginator.paginate(restApiId=API_ID)
        
        resources = []
        for page in page_iterator:
            resources.extend(page['items'])
        
        print(f"   Found {len(resources)} resources")
        print("")
        
        # Create path to resource ID mapping
        path_to_resource = {}
        for resource in resources:
            path_to_resource[resource['path']] = resource
        
        # Fix each Lambda integration
        fixed_count = 0
        for (path, method), lambda_name in LAMBDA_MAPPINGS.items():
            if path in path_to_resource:
                resource = path_to_resource[path]
                resource_id = resource['id']
                methods = resource.get('resourceMethods', {})
                
                if method in methods:
                    print(f"📝 {path} {method}")
                    fix_lambda_integration(resource_id, path, method, lambda_name)
                    fixed_count += 1
                else:
                    print(f"⚠️  {path} {method} - Method not found")
            else:
                print(f"⚠️  {path} - Resource not found")
        
        if fixed_count > 0:
            # Deploy the API
            print("")
            print("🚀 Deploying API...")
            response = client.create_deployment(
                restApiId=API_ID,
                stageName=STAGE,
                description='Fix Lambda integrations'
            )
            
            print(f"✅ Deployment created: {response['id']}")
            print("")
            print(f"🎉 Fixed {fixed_count} Lambda integrations!")
            print(f"   API URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com/{STAGE}")
            print("")
            print("🧪 Test your API now - CORS should work!")
        else:
            print("❌ No integrations were fixed")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()