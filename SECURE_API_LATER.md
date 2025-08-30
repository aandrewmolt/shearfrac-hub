# Additional API Security (Optional - After Deployment)

## 1. Restrict API Key to Your Domain

After Vercel deployment, in AWS Console:

1. Go to API Gateway → Your API → API Keys
2. Edit your API key
3. Add domain restrictions:
   - Allowed referrers: `https://your-app.vercel.app/*`
   - Allowed referrers: `https://yourdomain.com/*`

## 2. Add CORS Domain Restriction

```javascript
// In Lambda functions, update CORS headers:
headers: {
  'Access-Control-Allow-Origin': 'https://your-app.vercel.app',
  // Instead of '*'
}
```

## 3. Monitor Usage

Set up CloudWatch alarms:
- Alert if requests > 1000/hour
- Alert if 4xx errors > 100/hour
- Alert if unique IPs > expected

## 4. Alternative: Proxy Through Vercel (More Secure)

Create `/api/proxy.js` in Vercel:

```javascript
export default async function handler(req, res) {
  // Keep API key server-side only
  const response = await fetch(`${process.env.AWS_API_URL}${req.url}`, {
    headers: {
      'x-api-key': process.env.AWS_API_KEY_SECRET // Not VITE_ prefixed
    }
  });
  
  return res.json(await response.json());
}
```

Then the frontend calls `/api/proxy` instead of AWS directly.

## Current Setup Is Fine For Now

Your current setup with:
- ✅ Rate limiting (5 req/s)
- ✅ API key requirement
- ✅ Burst protection (10 requests)

Is standard practice and secure enough for deployment!