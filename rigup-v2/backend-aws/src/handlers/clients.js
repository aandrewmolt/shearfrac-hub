/**
 * Clients Lambda Handlers
 * Manages client names for job creation
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const CLIENTS_TABLE = process.env.CLIENTS_TABLE;

// Helper to create consistent responses
// Helper to create consistent responses with full CORS
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

// List all clients
module.exports.list = async (event) => {
  try {
    const params = {
      TableName: CLIENTS_TABLE,
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Sort clients alphabetically
    const clients = result.Items.sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
    
    return createResponse(200, clients);
  } catch (error) {
    console.error('Error listing clients:', error);
    return createResponse(500, { error: 'Failed to list clients' });
  }
};

// Create new client
module.exports.create = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.name) {
      return createResponse(400, { error: 'Client name is required' });
    }
    
    // Generate ID from name (lowercase, hyphenated)
    const clientId = data.name.toLowerCase().replace(/\s+/g, '-');
    
    const client = {
      id: clientId,
      name: data.name,
      pads: data.pads || [], // Array of pad names for this client
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const params = {
      TableName: CLIENTS_TABLE,
      Item: client,
      ConditionExpression: 'attribute_not_exists(id)',
    };
    
    try {
      await dynamodb.put(params).promise();
      return createResponse(201, client);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        // Client already exists, return it
        const getParams = {
          TableName: CLIENTS_TABLE,
          Key: { id: clientId },
        };
        const existing = await dynamodb.get(getParams).promise();
        return createResponse(200, existing.Item);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return createResponse(500, { error: 'Failed to create client' });
  }
};