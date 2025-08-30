/**
 * Jobs Lambda Handlers
 * Manages job creation, updates, and listing
 * Ensures proper job naming: Client + Pad = Job Name
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const JOBS_TABLE = process.env.JOBS_TABLE;
const CLIENTS_TABLE = process.env.CLIENTS_TABLE;

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

// List all jobs
module.exports.list = async (event) => {
  try {
    const params = {
      TableName: JOBS_TABLE,
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Format job names properly
    const jobs = result.Items.map(job => ({
      ...job,
      name: job.pad ? `${job.client} - ${job.pad}` : job.name,
      displayName: job.pad ? `${job.client} - ${job.pad} ${job.wellNumber || ''}`.trim() : job.name,
    }));
    
    return createResponse(200, jobs);
  } catch (error) {
    console.error('Error listing jobs:', error);
    return createResponse(500, { error: 'Failed to list jobs' });
  }
};

// Get single job
module.exports.get = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: JOBS_TABLE,
      Key: { id },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return createResponse(404, { error: 'Job not found' });
    }
    
    // Format job name
    const job = {
      ...result.Item,
      name: result.Item.pad ? `${result.Item.client} - ${result.Item.pad}` : result.Item.name,
      displayName: result.Item.pad ? 
        `${result.Item.client} - ${result.Item.pad} ${result.Item.wellNumber || ''}`.trim() : 
        result.Item.name,
    };
    
    return createResponse(200, job);
  } catch (error) {
    console.error('Error getting job:', error);
    return createResponse(500, { error: 'Failed to get job' });
  }
};

// Create new job
module.exports.create = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    // Ensure client and pad are saved
    if (!data.client || !data.pad) {
      return createResponse(400, { error: 'Client and Pad are required' });
    }
    
    // Save client if new
    if (data.client) {
      await saveClient(data.client);
    }
    
    // Generate job name from client + pad
    const jobName = `${data.client} - ${data.pad}`;
    const displayName = data.wellNumber ? 
      `${data.client} - ${data.pad} ${data.wellNumber}` : 
      jobName;
    
    const job = {
      id: uuidv4(),
      name: jobName,
      displayName: displayName,
      client: data.client,
      pad: data.pad,
      wellNumber: data.wellNumber || '',
      well_count: data.well_count || 0,
      has_wellside_gauge: data.has_wellside_gauge || false,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Equipment assignments with proper codes (SS01, CT03, etc.)
      equipment_assignment: data.equipment_assignment || {},
      
      // Store equipment codes separately for easy access
      main_box_id: data.main_box_id || null,
      satellite_id: data.satellite_id || null,
      wellside_gauge_id: data.wellside_gauge_id || null,
      
      // Cable configuration
      selected_cable_type: data.selected_cable_type || null,
      
      // Communication settings
      frac_baud_rate: data.frac_baud_rate || '9600',
      gauge_baud_rate: data.gauge_baud_rate || '9600',
      frac_com_port: data.frac_com_port || 'COM1',
      gauge_com_port: data.gauge_com_port || 'COM2',
      
      // Additional configuration
      enhanced_config: data.enhanced_config || {},
      company_computer_names: data.company_computer_names || {},
    };
    
    const params = {
      TableName: JOBS_TABLE,
      Item: job,
    };
    
    await dynamodb.put(params).promise();
    
    return createResponse(201, job);
  } catch (error) {
    console.error('Error creating job:', error);
    return createResponse(500, { error: 'Failed to create job' });
  }
};

// Update job
module.exports.update = async (event) => {
  try {
    const { id } = event.pathParameters;
    const data = JSON.parse(event.body);
    
    // If client or pad changes, update job name
    let jobName = data.name;
    let displayName = data.displayName;
    
    if (data.client && data.pad) {
      jobName = `${data.client} - ${data.pad}`;
      displayName = data.wellNumber ? 
        `${data.client} - ${data.pad} ${data.wellNumber}` : 
        jobName;
      
      // Save client if new
      await saveClient(data.client);
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Update job name if client/pad changed
    if (jobName) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = jobName;
      
      updateExpressions.push('displayName = :displayName');
      expressionAttributeValues[':displayName'] = displayName;
    }
    
    // Update other fields
    const fieldsToUpdate = [
      'client', 'pad', 'wellNumber', 'well_count', 'has_wellside_gauge',
      'status', 'equipment_assignment', 'main_box_id', 'satellite_id',
      'wellside_gauge_id', 'selected_cable_type', 'frac_baud_rate',
      'gauge_baud_rate', 'frac_com_port', 'gauge_com_port',
      'enhanced_config', 'company_computer_names', 'nodes', 'edges'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        const attrName = field === 'status' ? '#status' : field;
        if (field === 'status') {
          expressionAttributeNames['#status'] = 'status';
        }
        updateExpressions.push(`${attrName} = :${field}`);
        expressionAttributeValues[`:${field}`] = data[field];
      }
    });
    
    // Always update the timestamp
    updateExpressions.push('updated_at = :updated_at');
    expressionAttributeValues[':updated_at'] = new Date().toISOString();
    
    const params = {
      TableName: JOBS_TABLE,
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
    console.error('Error updating job:', error);
    return createResponse(500, { error: 'Failed to update job' });
  }
};

// Delete job
module.exports.delete = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: JOBS_TABLE,
      Key: { id },
    };
    
    await dynamodb.delete(params).promise();
    
    return createResponse(200, { message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return createResponse(500, { error: 'Failed to delete job' });
  }
};

// Helper function to save client
async function saveClient(clientName) {
  try {
    const clientId = clientName.toLowerCase().replace(/\s+/g, '-');
    
    const params = {
      TableName: CLIENTS_TABLE,
      Item: {
        id: clientId,
        name: clientName,
        created_at: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };
    
    await dynamodb.put(params).promise();
  } catch (error) {
    // Client already exists, that's fine
    if (error.code !== 'ConditionalCheckFailedException') {
      console.error('Error saving client:', error);
    }
  }
}