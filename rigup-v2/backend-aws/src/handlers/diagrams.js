/**
 * Diagram Lambda Handlers
 * Manages job diagrams with equipment assignments
 * Ensures equipment codes (SS01, CT03) are properly displayed on nodes
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const DIAGRAMS_TABLE = process.env.DIAGRAMS_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;

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

// Get diagram for a job
module.exports.get = async (event) => {
  try {
    const { id: jobId } = event.pathParameters;
    
    const params = {
      TableName: DIAGRAMS_TABLE,
      Key: { jobId },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return createResponse(200, { 
        jobId,
        nodes: [],
        edges: [],
        equipmentAssignment: {},
        message: 'No diagram found for this job' 
      });
    }
    
    // Ensure equipment codes are properly formatted in nodes
    const diagram = {
      ...result.Item,
      nodes: (result.Item.nodes || []).map(node => {
        // Ensure equipment IDs are displayed on nodes
        if (node.data) {
          // For main box nodes
          if (node.data.equipmentId) {
            node.data.displayId = node.data.equipmentId; // Show SS01, CT03, etc.
            node.data.label = node.data.equipmentId;
          }
          
          // For satellite nodes
          if (node.data.satelliteId) {
            node.data.displayId = node.data.satelliteId;
            node.data.label = node.data.satelliteId;
          }
          
          // For gauge nodes
          if (node.data.gaugeId) {
            node.data.displayId = node.data.gaugeId;
            node.data.label = node.data.gaugeId;
          }
          
          // For computer nodes with equipment
          if (node.data.computerId) {
            node.data.displayId = node.data.computerId;
            node.data.label = node.data.computerName || node.data.computerId;
          }
          
          // For well nodes with gauges
          if (node.data.wellGaugeId) {
            node.data.displayId = node.data.wellGaugeId;
            node.data.gaugeLabel = node.data.wellGaugeId;
          }
        }
        return node;
      }),
    };
    
    return createResponse(200, diagram);
  } catch (error) {
    console.error('Error getting diagram:', error);
    return createResponse(500, { error: 'Failed to get diagram' });
  }
};

// Save or update diagram
module.exports.save = async (event) => {
  try {
    const { id: jobId } = event.pathParameters;
    const data = JSON.parse(event.body);
    
    // Process nodes to ensure equipment codes are saved
    const processedNodes = (data.nodes || []).map(node => {
      if (node.data) {
        // Preserve equipment assignments with their codes
        const nodeData = { ...node.data };
        
        // Main box equipment
        if (data.equipmentAssignment?.mainBox) {
          if (node.type === 'shearstreamBox' || node.id === 'mainBox') {
            nodeData.equipmentId = data.equipmentAssignment.mainBox;
            nodeData.displayId = data.equipmentAssignment.mainBox;
            nodeData.label = data.equipmentAssignment.mainBox;
          }
        }
        
        // Satellite equipment
        if (data.equipmentAssignment?.satellite) {
          if (node.type === 'satellite' || node.id === 'satellite') {
            nodeData.satelliteId = data.equipmentAssignment.satellite;
            nodeData.displayId = data.equipmentAssignment.satellite;
            nodeData.label = data.equipmentAssignment.satellite;
          }
        }
        
        // Starlink equipment
        if (data.equipmentAssignment?.starlinks) {
          const starlinkId = Object.keys(data.equipmentAssignment.starlinks)
            .find(key => key === node.id || key === node.data?.starlinkId);
          if (starlinkId) {
            nodeData.equipmentId = data.equipmentAssignment.starlinks[starlinkId];
            nodeData.displayId = data.equipmentAssignment.starlinks[starlinkId];
            nodeData.label = data.equipmentAssignment.starlinks[starlinkId];
          }
        }
        
        // Customer computers
        if (data.equipmentAssignment?.customerComputers) {
          const computerId = Object.keys(data.equipmentAssignment.customerComputers)
            .find(key => key === node.id || key === node.data?.computerId);
          if (computerId) {
            nodeData.computerId = data.equipmentAssignment.customerComputers[computerId];
            nodeData.displayId = data.equipmentAssignment.customerComputers[computerId];
            nodeData.label = node.data?.computerName || 
              data.equipmentAssignment.customerComputers[computerId];
          }
        }
        
        // Well gauges
        if (data.equipmentAssignment?.wellGauges) {
          const wellId = Object.keys(data.equipmentAssignment.wellGauges)
            .find(key => key === node.id || node.id?.includes(key));
          if (wellId) {
            nodeData.wellGaugeId = data.equipmentAssignment.wellGauges[wellId];
            nodeData.displayId = data.equipmentAssignment.wellGauges[wellId];
            nodeData.gaugeLabel = data.equipmentAssignment.wellGauges[wellId];
          }
        }
        
        // Y-adapters
        if (data.equipmentAssignment?.yAdapters && node.type === 'yAdapter') {
          const yAdapterIndex = data.equipmentAssignment.yAdapters
            .findIndex((_, idx) => node.id === `yAdapter-${idx}`);
          if (yAdapterIndex >= 0) {
            nodeData.equipmentId = data.equipmentAssignment.yAdapters[yAdapterIndex];
            nodeData.displayId = data.equipmentAssignment.yAdapters[yAdapterIndex];
            nodeData.label = data.equipmentAssignment.yAdapters[yAdapterIndex];
          }
        }
        
        node.data = nodeData;
      }
      return node;
    });
    
    const diagram = {
      jobId,
      nodes: processedNodes,
      edges: data.edges || [],
      equipmentAssignment: data.equipmentAssignment || {},
      cableConfiguration: data.cableConfiguration || {},
      updated_at: new Date().toISOString(),
      
      // Store equipment codes at diagram level for quick access
      mainBoxId: data.equipmentAssignment?.mainBox || null,
      satelliteId: data.equipmentAssignment?.satellite || null,
      wellsideGaugeId: data.equipmentAssignment?.wellsideGauge || null,
      starlinkIds: data.equipmentAssignment?.starlinks || {},
      customerComputerIds: data.equipmentAssignment?.customerComputers || {},
      wellGaugeIds: data.equipmentAssignment?.wellGauges || {},
      yAdapterIds: data.equipmentAssignment?.yAdapters || [],
    };
    
    // Save diagram
    const diagramParams = {
      TableName: DIAGRAMS_TABLE,
      Item: diagram,
    };
    
    await dynamodb.put(diagramParams).promise();
    
    // Update job with equipment assignment summary
    const jobUpdateParams = {
      TableName: JOBS_TABLE,
      Key: { id: jobId },
      UpdateExpression: `SET 
        equipment_assignment = :equipment_assignment,
        main_box_id = :main_box_id,
        satellite_id = :satellite_id,
        wellside_gauge_id = :wellside_gauge_id,
        nodes = :nodes,
        edges = :edges,
        updated_at = :updated_at`,
      ExpressionAttributeValues: {
        ':equipment_assignment': data.equipmentAssignment || {},
        ':main_box_id': diagram.mainBoxId,
        ':satellite_id': diagram.satelliteId,
        ':wellside_gauge_id': diagram.wellsideGaugeId,
        ':nodes': processedNodes,
        ':edges': data.edges || [],
        ':updated_at': new Date().toISOString(),
      },
    };
    
    await dynamodb.update(jobUpdateParams).promise();
    
    return createResponse(200, { 
      message: 'Diagram saved successfully',
      diagram: diagram,
    });
  } catch (error) {
    console.error('Error saving diagram:', error);
    return createResponse(500, { error: 'Failed to save diagram' });
  }
};