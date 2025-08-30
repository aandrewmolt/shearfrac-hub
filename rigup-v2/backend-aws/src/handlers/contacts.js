/**
 * Contacts Lambda Handlers
 * Manages contacts for jobs
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const CONTACTS_TABLE = process.env.CONTACTS_TABLE;

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

// List all contacts
module.exports.list = async (event) => {
  try {
    const params = {
      TableName: CONTACTS_TABLE,
    };
    
    // Filter by type if provided
    if (event.queryStringParameters?.type) {
      params.IndexName = 'type-index';
      params.KeyConditionExpression = '#type = :type';
      params.ExpressionAttributeNames = { '#type': 'type' };
      params.ExpressionAttributeValues = { ':type': event.queryStringParameters.type };
      
      const result = await dynamodb.query(params).promise();
      return createResponse(200, result.Items);
    }
    
    const result = await dynamodb.scan(params).promise();
    return createResponse(200, result.Items);
  } catch (error) {
    console.error('Error listing contacts:', error);
    return createResponse(500, { error: 'Failed to list contacts' });
  }
};

// Get single contact
module.exports.get = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: CONTACTS_TABLE,
      Key: { id },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return createResponse(404, { error: 'Contact not found' });
    }
    
    return createResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting contact:', error);
    return createResponse(500, { error: 'Failed to get contact' });
  }
};

// Create new contact
module.exports.create = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.name || !data.type) {
      return createResponse(400, { error: 'Name and type are required' });
    }
    
    const contact = {
      id: uuidv4(),
      type: data.type, // 'client', 'frac', 'custom'
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      phone2: data.phone2 || '',
      company: data.company || '',
      rig: data.rig || '',
      job_title: data.job_title || '',
      location: data.location || '',
      client_name: data.client_name || '',
      well_name: data.well_name || '',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by || 'system',
    };
    
    const params = {
      TableName: CONTACTS_TABLE,
      Item: contact,
    };
    
    await dynamodb.put(params).promise();
    
    return createResponse(201, contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return createResponse(500, { error: 'Failed to create contact' });
  }
};

// Update contact
module.exports.update = async (event) => {
  try {
    const { id } = event.pathParameters;
    const data = JSON.parse(event.body);
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    const fieldsToUpdate = [
      'type', 'name', 'email', 'phone', 'phone2',
      'company', 'rig', 'job_title', 'location',
      'client_name', 'well_name', 'notes'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        const attrName = field === 'type' || field === 'name' ? `#${field}` : field;
        if (field === 'type' || field === 'name') {
          expressionAttributeNames[`#${field}`] = field;
        }
        updateExpressions.push(`${attrName} = :${field}`);
        expressionAttributeValues[`:${field}`] = data[field];
      }
    });
    
    if (updateExpressions.length === 0) {
      return createResponse(400, { error: 'No fields to update' });
    }
    
    // Always update timestamp
    updateExpressions.push('updated_at = :updated_at');
    expressionAttributeValues[':updated_at'] = new Date().toISOString();
    
    const params = {
      TableName: CONTACTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    
    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    const result = await dynamodb.update(params).promise();
    
    return createResponse(200, result.Attributes);
  } catch (error) {
    console.error('Error updating contact:', error);
    return createResponse(500, { error: 'Failed to update contact' });
  }
};

// Delete contact
module.exports.delete = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: CONTACTS_TABLE,
      Key: { id },
    };
    
    await dynamodb.delete(params).promise();
    
    return createResponse(200, { message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return createResponse(500, { error: 'Failed to delete contact' });
  }
};