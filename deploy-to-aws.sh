#!/bin/bash

echo "🚀 Deploying RigUp to AWS..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run: aws configure${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials configured${NC}"

# Deploy Backend
echo ""
echo "📦 Deploying Backend to AWS Lambda..."
echo "--------------------------------------"
cd rigup-v2/backend-aws

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Deploy with Serverless
echo "Deploying with Serverless Framework..."
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework not found globally. Using npx...${NC}"
    npx serverless deploy --stage dev --region us-east-1
else
    serverless deploy --stage dev --region us-east-1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    
    # Get the API endpoint
    API_URL=$(npx serverless info --stage dev --region us-east-1 | grep "endpoint:" | head -1 | awk '{print $2}')
    echo -e "${GREEN}API Endpoint: $API_URL${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

cd ../..

# Build Frontend
echo ""
echo "🎨 Building Frontend..."
echo "----------------------"

# Update .env with the API endpoint
echo "Updating frontend API configuration..."
if [ ! -z "$API_URL" ]; then
    echo "VITE_API_URL=$API_URL" > .env.production
    echo -e "${GREEN}✅ API URL configured: $API_URL${NC}"
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build the frontend
echo "Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully!${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Deploy Frontend to S3 + CloudFront (Optional)
echo ""
echo "🌐 Frontend Deployment Options:"
echo "--------------------------------"
echo "1. Deploy to AWS S3 + CloudFront"
echo "2. Deploy to Vercel (recommended)"
echo "3. Skip frontend deployment"
echo ""
read -p "Choose option (1-3): " deploy_option

case $deploy_option in
    1)
        echo "Deploying to AWS S3..."
        # Create S3 bucket for frontend
        BUCKET_NAME="rigup-frontend-$(date +%s)"
        aws s3 mb s3://$BUCKET_NAME --region us-east-1
        
        # Configure bucket for static website hosting
        aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
        
        # Upload built files
        aws s3 sync dist/ s3://$BUCKET_NAME --acl public-read
        
        # Get the website URL
        WEBSITE_URL="http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
        echo -e "${GREEN}✅ Frontend deployed to: $WEBSITE_URL${NC}"
        ;;
    2)
        echo "Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm i -g vercel
        fi
        vercel --prod
        ;;
    3)
        echo "Skipping frontend deployment..."
        echo -e "${YELLOW}ℹ️  Frontend built at: ./dist${NC}"
        echo "You can deploy it manually later."
        ;;
esac

echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "📝 Summary:"
echo "-----------"
if [ ! -z "$API_URL" ]; then
    echo "✅ Backend API: $API_URL"
fi
if [ ! -z "$WEBSITE_URL" ]; then
    echo "✅ Frontend URL: $WEBSITE_URL"
fi
echo ""
echo "Next steps:"
echo "1. Test the equipment creation endpoint"
echo "2. Verify gauge types are working"
echo "3. Check equipment filtering shows only available items"
echo ""
echo "Test command:"
echo "curl -X POST $API_URL/equipment \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"code\":\"SS-001\",\"name\":\"ShearStream Box 001\",\"type\":\"shearstream-box\",\"status\":\"available\"}'"