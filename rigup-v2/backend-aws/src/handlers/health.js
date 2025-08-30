/**
 * Health Check Handler
 * Simple endpoint to verify API is running
 */

// Helper to create consistent responses with CORS headers
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body),
});

// Health check endpoint
module.exports.check = async (event) => {
  return createResponse(200, {
    status: 'healthy',
    message: 'RigUp API is running',
    timestamp: new Date().toISOString(),
    stage: process.env.STAGE || 'dev',
    region: process.env.REGION || 'us-east-1',
  });
};

// OPTIONS handler for CORS preflight
module.exports.options = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': true,
    },
    body: '',
  };
};