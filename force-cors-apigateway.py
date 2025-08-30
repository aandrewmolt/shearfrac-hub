#!/usr/bin/env python3

import boto3
import json
import sys

# Configuration
API_ID = "wmh8r4eixg"
REGION = "us-east-1"
STAGE = "dev"

client = boto3.client('apigateway', region_name=REGION)

def add_cors_to_method(resource_id, http_method):
    """Add CORS to a specific method"""
    print(f"    Adding CORS to {http_method}...")
    
    try:
        # First, ensure method response exists
        try:
            client.put_method_response(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod=http_method,
                statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Origin': False,
                    'method.response.header.Access-Control-Allow-Headers': False,
                    'method.response.header.Access-Control-Allow-Methods': False
                }
            )
        except:
            pass  # Method response might already exist
        
        # Add/Update integration response
        try:
            client.delete_integration_response(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod=http_method,
                statusCode='200'
            )
        except:
            pass
        
        client.put_integration_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=http_method,
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS,PATCH'"
            }
        )
        print(f"      ✓ {http_method} configured")
        
    except Exception as e:
        print(f"      ✗ Error with {http_method}: {str(e)}")

def add_options_method(resource_id, resource_path):
    """Add OPTIONS method for CORS preflight"""
    print(f"    Configuring OPTIONS for {resource_path}...")
    
    try:
        # Delete existing OPTIONS method if it exists
        try:
            client.delete_method(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod='OPTIONS'
            )
        except:
            pass
        
        # Create OPTIONS method
        client.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        
        # Add mock integration
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={
                'application/json': '{"statusCode": 200}'
            }
        )
        
        # Add method response
        client.put_method_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': False,
                'method.response.header.Access-Control-Allow-Headers': False,
                'method.response.header.Access-Control-Allow-Methods': False,
                'method.response.header.Access-Control-Allow-Credentials': False
            },
            responseModels={
                'application/json': 'Empty'
            }
        )
        
        # Add integration response with CORS headers
        client.put_integration_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS,PATCH'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'"
            },
            responseTemplates={
                'application/json': ''
            }
        )
        print(f"      ✓ OPTIONS configured")
        
    except Exception as e:
        print(f"      ✗ Error with OPTIONS: {str(e)}")

def main():
    print(f"🔧 Forcing CORS on API Gateway: {API_ID}")
    print(f"   Region: {REGION}")
    print(f"   Stage: {STAGE}")
    print("")
    
    # Get all resources
    print("📋 Getting resources...")
    try:
        paginator = client.get_paginator('get_resources')
        page_iterator = paginator.paginate(restApiId=API_ID)
        
        resources = []
        for page in page_iterator:
            resources.extend(page['items'])
        
        print(f"   Found {len(resources)} resources")
        print("")
        
        # Process each resource
        for resource in resources:
            resource_id = resource['id']
            resource_path = resource.get('path', '/')
            
            if resource_path == '/':
                continue
            
            print(f"📝 Processing: {resource_path}")
            
            # Get methods for this resource
            methods = resource.get('resourceMethods', {})
            
            # Add OPTIONS if not present
            if 'OPTIONS' not in methods:
                add_options_method(resource_id, resource_path)
            else:
                # Fix existing OPTIONS
                add_cors_to_method(resource_id, 'OPTIONS')
            
            # Add CORS to other methods
            for method in methods:
                if method != 'OPTIONS':
                    add_cors_to_method(resource_id, method)
            
            print("")
        
        # Deploy the API
        print("🚀 Deploying API...")
        response = client.create_deployment(
            restApiId=API_ID,
            stageName=STAGE,
            description=f'CORS fix deployment'
        )
        
        print(f"✅ Deployment created: {response['id']}")
        print("")
        print(f"🎉 CORS configuration complete!")
        print(f"   API URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com/{STAGE}")
        print("")
        print("Test your endpoints now. If CORS still fails, check that:")
        print("1. Lambda functions are returning CORS headers")
        print("2. Lambda functions have proper permissions")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()