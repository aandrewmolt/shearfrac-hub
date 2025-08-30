/**
 * Equipment Lambda Handlers
 * Manages equipment with proper serial number codes (SS01, CT03, etc.)
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const EQUIPMENT_TABLE = process.env.EQUIPMENT_TABLE;
const DEPLOYMENTS_TABLE = process.env.DEPLOYMENTS_TABLE;

// Helper to create consistent responses with full CORS headers
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

// List all equipment with proper codes
module.exports.list = async (event) => {
  try {
    const params = {
      TableName: EQUIPMENT_TABLE,
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Ensure equipment codes are properly formatted
    const equipment = result.Items.map(item => ({
      ...item,
      // Ensure equipmentId is the display code (SS01, CT03, etc.)
      equipmentId: item.equipmentId || item.equipment_id,
      displayName: `${item.equipmentId || item.equipment_id} - ${item.name || ''}`.trim(),
      // Keep serial_number for backward compatibility
      serial_number: item.equipmentId || item.equipment_id,
      // Convert UNASSIGNED back to null for frontend
      jobId: item.jobId === 'UNASSIGNED' ? null : item.jobId,
    }));
    
    return createResponse(200, equipment);
  } catch (error) {
    console.error('Error listing equipment:', error);
    return createResponse(500, { error: 'Failed to list equipment' });
  }
};

// Get single equipment item
module.exports.get = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: EQUIPMENT_TABLE,
      Key: { id },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return createResponse(404, { error: 'Equipment not found' });
    }
    
    // Format equipment with proper code
    const equipment = {
      ...result.Item,
      equipmentId: result.Item.equipmentId || result.Item.equipment_id,
      displayName: `${result.Item.equipmentId || result.Item.equipment_id} - ${result.Item.name || ''}`.trim(),
      serial_number: result.Item.equipmentId || result.Item.equipment_id,
    };
    
    return createResponse(200, equipment);
  } catch (error) {
    console.error('Error getting equipment:', error);
    return createResponse(500, { error: 'Failed to get equipment' });
  }
};

// Create new equipment with proper code
module.exports.create = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    // Map from frontend format to backend format
    const equipmentCode = data.code || data.equipmentId || data.equipment_id;
    
    // Validate equipment code format - very flexible validation
    // Accepts: SS01, SS-01, SS-001, SS-0001, CTT-001, CTS-01, ABRA-001, PG1502-001, etc.
    // Pattern: 2-10 letters, optional dash/hyphen, 1-4 digits
    if (!equipmentCode) {
      return createResponse(400, { 
        error: 'Equipment code is required' 
      });
    }
    
    // Normalize the equipment code (keep dashes if present)
    const normalizedCode = equipmentCode.toUpperCase().trim();
    
    // Very flexible validation: letters/numbers followed by optional separator and numbers
    // Accepts: SS01, SS-01, ABRA-001, PG1502-001, CTS-01, etc.
    const validPattern = /^[A-Z0-9]{2,10}[-]?[0-9]{1,4}$/;
    if (!validPattern.test(normalizedCode)) {
      console.log('Equipment code validation failed:', normalizedCode);
      // Don't reject - just log and continue for maximum compatibility
    }
    
    const equipment = {
      id: uuidv4(),
      equipmentId: normalizedCode, // Keep the normalized format
      equipment_id: normalizedCode, // Backward compatibility
      serial_number: data.serial_number || normalizedCode, // Use provided or default to code
      name: data.name || '',
      type: data.type || 'general',
      equipmentTypeId: data.type || data.equipmentTypeId || data.type_id || data.typeId,
      storageLocationId: data.location_id || data.storageLocationId || data.locationId || 'shop',
      status: data.status || 'available',
      jobId: data.jobId || 'UNASSIGNED', // Use placeholder instead of null for GSI
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      
      // Additional fields
      purchase_date: data.purchase_date || null,
      warranty_expiry: data.warranty_expiry || null,
      red_tag_reason: data.red_tag_reason || null,
      red_tag_photo: data.red_tag_photo || null,
      notes: data.notes || '',
      
      // Support for gauge types and bulk equipment
      is_bulk: data.is_bulk || false,
      category: data.category || null,
    };
    
    // Check if equipment ID already exists (case-insensitive check)
    const checkParams = {
      TableName: EQUIPMENT_TABLE,
      IndexName: 'equipmentId-index',
      KeyConditionExpression: 'equipmentId = :equipmentId',
      ExpressionAttributeValues: {
        ':equipmentId': normalizedCode,
      },
    };
    
    try {
      const existing = await dynamodb.query(checkParams).promise();
      if (existing.Items && existing.Items.length > 0) {
        return createResponse(400, { 
          error: `Equipment with ID ${normalizedCode} already exists` 
        });
      }
    } catch (queryError) {
      // If index doesn't exist, skip the check
      console.log('Equipment ID index query failed, skipping duplicate check:', queryError);
    }
    
    const params = {
      TableName: EQUIPMENT_TABLE,
      Item: equipment,
    };
    
    await dynamodb.put(params).promise();
    
    return createResponse(201, equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    return createResponse(500, { error: 'Failed to create equipment' });
  }
};

// Update equipment (general update)
module.exports.update = async (event) => {
  try {
    const { id } = event.pathParameters;
    const data = JSON.parse(event.body);
    
    // Build update expression dynamically based on provided fields
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Map frontend fields to backend fields
    const fieldMappings = {
      name: 'name',
      type: 'type',
      status: 'status',
      jobId: 'jobId',
      location_id: 'storageLocationId',
      storageLocationId: 'storageLocationId',
      locationId: 'storageLocationId',
      serial_number: 'serial_number',
      notes: 'notes',
      is_bulk: 'is_bulk',
      category: 'category',
    };
    
    Object.keys(data).forEach(key => {
      const dbField = fieldMappings[key] || key;
      if (dbField && key !== 'id') {
        updateExpressions.push(`#${dbField} = :${dbField}`);
        expressionAttributeNames[`#${dbField}`] = dbField;
        expressionAttributeValues[`:${dbField}`] = data[key];
      }
    });
    
    // Always update the updated_at timestamp
    updateExpressions.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();
    
    const params = {
      TableName: EQUIPMENT_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    
    const result = await dynamodb.update(params).promise();
    
    // Format response with proper equipment code
    const equipment = {
      ...result.Attributes,
      equipmentId: result.Attributes.equipmentId || result.Attributes.equipment_id,
      displayName: `${result.Attributes.equipmentId || result.Attributes.equipment_id} - ${result.Attributes.name || ''}`.trim(),
    };
    
    return createResponse(200, equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return createResponse(500, { error: 'Failed to update equipment' });
  }
};

// Update equipment status
module.exports.updateStatus = async (event) => {
  try {
    const { id } = event.pathParameters;
    const data = JSON.parse(event.body);
    
    const validStatuses = ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'];
    if (!validStatuses.includes(data.status)) {
      return createResponse(400, { 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const params = {
      TableName: EQUIPMENT_TABLE,
      Key: { id },
      UpdateExpression: 'SET #status = :status, jobId = :jobId, updated_at = :updated_at',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': data.status,
        ':jobId': data.jobId || null,
        ':updated_at': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };
    
    const result = await dynamodb.update(params).promise();
    
    // Format response with proper equipment code
    const equipment = {
      ...result.Attributes,
      equipmentId: result.Attributes.equipmentId || result.Attributes.equipment_id,
      displayName: `${result.Attributes.equipmentId || result.Attributes.equipment_id} - ${result.Attributes.name || ''}`.trim(),
    };
    
    return createResponse(200, equipment);
  } catch (error) {
    console.error('Error updating equipment status:', error);
    return createResponse(500, { error: 'Failed to update equipment status' });
  }
};

// Deploy equipment to job
module.exports.deploy = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.equipmentIds || !data.jobId) {
      return createResponse(400, { error: 'Equipment IDs and Job ID are required' });
    }
    
    const deploymentId = uuidv4();
    const deployment = {
      id: deploymentId,
      jobId: data.jobId,
      equipmentIds: data.equipmentIds, // Array of equipment codes (SS01, CT03, etc.)
      deployed_at: new Date().toISOString(),
      deployed_by: data.deployed_by || 'system',
      status: 'deployed',
      notes: data.notes || '',
    };
    
    // Update equipment status to deployed
    const updatePromises = data.equipmentIds.map(async (equipmentId) => {
      // Find equipment by equipmentId code
      const queryParams = {
        TableName: EQUIPMENT_TABLE,
        IndexName: 'equipmentId-index',
        KeyConditionExpression: 'equipmentId = :equipmentId',
        ExpressionAttributeValues: {
          ':equipmentId': equipmentId,
        },
      };
      
      const queryResult = await dynamodb.query(queryParams).promise();
      if (queryResult.Items && queryResult.Items.length > 0) {
        const item = queryResult.Items[0];
        
        // Update status
        const updateParams = {
          TableName: EQUIPMENT_TABLE,
          Key: { id: item.id },
          UpdateExpression: 'SET #status = :status, jobId = :jobId, updated_at = :updated_at',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'deployed',
            ':jobId': data.jobId,
            ':updated_at': new Date().toISOString(),
          },
        };
        
        return dynamodb.update(updateParams).promise();
      }
    });
    
    await Promise.all(updatePromises);
    
    // Save deployment record
    const deploymentParams = {
      TableName: DEPLOYMENTS_TABLE,
      Item: deployment,
    };
    
    await dynamodb.put(deploymentParams).promise();
    
    return createResponse(201, { 
      message: 'Equipment deployed successfully',
      deploymentId: deploymentId,
      equipmentIds: data.equipmentIds,
    });
  } catch (error) {
    console.error('Error deploying equipment:', error);
    return createResponse(500, { error: 'Failed to deploy equipment' });
  }
};

// Return equipment from job
module.exports.return = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.deploymentId && !data.equipmentIds) {
      return createResponse(400, { 
        error: 'Either deployment ID or equipment IDs are required' 
      });
    }
    
    let equipmentIds = data.equipmentIds;
    
    // If deployment ID provided, get equipment IDs from deployment
    if (data.deploymentId) {
      const deploymentParams = {
        TableName: DEPLOYMENTS_TABLE,
        Key: { id: data.deploymentId },
      };
      
      const deploymentResult = await dynamodb.get(deploymentParams).promise();
      if (deploymentResult.Item) {
        equipmentIds = deploymentResult.Item.equipmentIds;
        
        // Update deployment status
        const updateDeploymentParams = {
          TableName: DEPLOYMENTS_TABLE,
          Key: { id: data.deploymentId },
          UpdateExpression: 'SET #status = :status, returned_at = :returned_at',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'returned',
            ':returned_at': new Date().toISOString(),
          },
        };
        
        await dynamodb.update(updateDeploymentParams).promise();
      }
    }
    
    // Update equipment status to available
    const updatePromises = equipmentIds.map(async (equipmentId) => {
      // Find equipment by equipmentId code
      const queryParams = {
        TableName: EQUIPMENT_TABLE,
        IndexName: 'equipmentId-index',
        KeyConditionExpression: 'equipmentId = :equipmentId',
        ExpressionAttributeValues: {
          ':equipmentId': equipmentId,
        },
      };
      
      const queryResult = await dynamodb.query(queryParams).promise();
      if (queryResult.Items && queryResult.Items.length > 0) {
        const item = queryResult.Items[0];
        
        // Update status
        const updateParams = {
          TableName: EQUIPMENT_TABLE,
          Key: { id: item.id },
          UpdateExpression: 'SET #status = :status, jobId = :jobId, updated_at = :updated_at',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'available',
            ':jobId': null,
            ':updated_at': new Date().toISOString(),
          },
        };
        
        return dynamodb.update(updateParams).promise();
      }
    });
    
    await Promise.all(updatePromises);
    
    return createResponse(200, { 
      message: 'Equipment returned successfully',
      equipmentIds: equipmentIds,
    });
  } catch (error) {
    console.error('Error returning equipment:', error);
    return createResponse(500, { error: 'Failed to return equipment' });
  }
};