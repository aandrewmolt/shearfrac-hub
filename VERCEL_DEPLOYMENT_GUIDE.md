# Vercel Deployment Guide - Step by Step

## Prerequisites
- GitHub account (create one at github.com if needed)
- Vercel account (free at vercel.com - can sign up with GitHub)
- Your AWS API is already deployed and working ✅

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/well-rig-visualizer.git

# Push to GitHub
git push -u origin main
```

## Step 2: Sign Up/Login to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" 
3. Choose "Continue with GitHub" (easiest option)
4. Authorize Vercel to access your GitHub

## Step 3: Import Project to Vercel

1. In Vercel Dashboard, click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Select your `well-rig-visualizer` repository
4. Vercel will auto-detect it's a React/Vite project

## Step 4: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave empty)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 5: Set Environment Variables (CRITICAL!)

Click "Environment Variables" and add these:

```bash
# AWS API Configuration
VITE_AWS_API_URL=https://wmh8r4eixg.execute-api.us-east-1.amazonaws.com/dev
VITE_AWS_API_KEY=C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A
VITE_API_MODE=aws

# Database Configuration (your existing Turso settings)
VITE_TURSO_DATABASE_URL=YOUR_TURSO_URL_HERE
VITE_TURSO_AUTH_TOKEN=YOUR_TURSO_TOKEN_HERE

# Optional - for edge functions
VITE_SYNC_URL=https://your-app.vercel.app/api/sync
```

## Step 6: Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://well-rig-visualizer-xxx.vercel.app`

## Step 7: Configure App for AWS API

Create/update `.env.production` file locally:

```bash
# .env.production
VITE_API_MODE=aws
VITE_AWS_API_URL=https://wmh8r4eixg.execute-api.us-east-1.amazonaws.com/dev
VITE_AWS_API_KEY=C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A
```

## Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Open browser DevTools (F12)
3. Check Network tab for API calls
4. Should see calls going to AWS API Gateway

## Step 9: Custom Domain (Optional)

1. In Vercel project settings → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### If API calls fail:
1. Check browser console for CORS errors
2. Verify environment variables in Vercel settings
3. Make sure API key is included in requests

### If build fails:
1. Check build logs in Vercel dashboard
2. Common issue: Missing dependencies
   - Solution: `npm install` locally and commit package-lock.json

### If app shows "Local Mode" or connection errors:
1. Verify VITE_API_MODE=aws is set
2. Check that AWS API URL is correct
3. Ensure API key is properly configured

## Quick Test Commands

Test your API before deploying:

```bash
# Test from local machine
curl -H "x-api-key: C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A" \
  https://wmh8r4eixg.execute-api.us-east-1.amazonaws.com/dev/equipment

# Should return equipment data
```

## Auto-Deploy on Git Push

Once connected, Vercel will automatically deploy when you:
```bash
git add .
git commit -m "Update"
git push origin main
```

## Support

- Vercel Docs: https://vercel.com/docs
- Status Page: https://www.vercel-status.com
- Our AWS API Status: Check CloudWatch in AWS Console

---

## Current Status:
✅ AWS Lambda Functions: DEPLOYED
✅ API Gateway: CONFIGURED with throttling
✅ API Key: ACTIVE (C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A)
✅ Rate Limiting: 5 req/s, burst 10

Ready for Vercel deployment! 🚀