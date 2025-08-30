/**
 * Export Lambda Handler
 * Exports data to S3 for backup and sharing
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const STORAGE_BUCKET = process.env.STORAGE_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'cdn.example.com';

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

// Export data to S3
module.exports.exportData = async (event) => {
  try {
    const { type } = event.pathParameters;
    const data = event.body ? JSON.parse(event.body) : {};
    
    let exportData = {};
    let fileName = '';
    
    switch (type) {
      case 'jobs':
        exportData = await exportJobs(data.jobIds);
        fileName = `jobs-export-${Date.now()}.json`;
        break;
        
      case 'equipment':
        exportData = await exportEquipment(data.equipmentIds);
        fileName = `equipment-export-${Date.now()}.json`;
        break;
        
      case 'full':
        exportData = await exportFullBackup();
        fileName = `full-backup-${Date.now()}.json`;
        break;
        
      case 'diagram':
        if (!data.jobId) {
          return createResponse(400, { error: 'Job ID required for diagram export' });
        }
        exportData = await exportDiagram(data.jobId);
        fileName = `diagram-${data.jobId}-${Date.now()}.json`;
        break;
        
      default:
        return createResponse(400, { error: 'Invalid export type' });
    }
    
    // Save to S3
    const key = `exports/${fileName}`;
    const params = {
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: JSON.stringify(exportData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        exportType: type,
        exportDate: new Date().toISOString(),
        exportedBy: data.userId || 'system',
      },
    };
    
    await s3.putObject(params).promise();
    
    // Generate download URL (expires in 24 hours)
    const downloadUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: STORAGE_BUCKET,
      Key: key,
      Expires: 86400, // 24 hours
    });
    
    return createResponse(200, {
      message: 'Export successful',
      key,
      downloadUrl,
      cloudFrontUrl: `https://${CLOUDFRONT_DOMAIN}/storage/${key}`,
      expires: new Date(Date.now() + 86400000).toISOString(),
      recordCount: Object.keys(exportData).reduce((acc, key) => {
        return acc + (Array.isArray(exportData[key]) ? exportData[key].length : 1);
      }, 0),
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return createResponse(500, { error: 'Failed to export data' });
  }
};

// Export jobs with related data
async function exportJobs(jobIds) {
  const jobs = [];
  const diagrams = [];
  
  if (jobIds && jobIds.length > 0) {
    // Export specific jobs
    for (const jobId of jobIds) {
      const jobResult = await dynamodb.get({
        TableName: process.env.JOBS_TABLE,
        Key: { id: jobId },
      }).promise();
      
      if (jobResult.Item) {
        jobs.push(jobResult.Item);
        
        // Get diagram
        const diagramResult = await dynamodb.get({
          TableName: process.env.DIAGRAMS_TABLE,
          Key: { jobId },
        }).promise();
        
        if (diagramResult.Item) {
          diagrams.push(diagramResult.Item);
        }
      }
    }
  } else {
    // Export all jobs
    const jobsResult = await dynamodb.scan({
      TableName: process.env.JOBS_TABLE,
    }).promise();
    
    jobs.push(...jobsResult.Items);
    
    // Get all diagrams
    const diagramsResult = await dynamodb.scan({
      TableName: process.env.DIAGRAMS_TABLE,
    }).promise();
    
    diagrams.push(...diagramsResult.Items);
  }
  
  return {
    jobs,
    diagrams,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
}

// Export equipment
async function exportEquipment(equipmentIds) {
  const equipment = [];
  const deployments = [];
  
  if (equipmentIds && equipmentIds.length > 0) {
    // Export specific equipment
    for (const equipmentId of equipmentIds) {
      const result = await dynamodb.query({
        TableName: process.env.EQUIPMENT_TABLE,
        IndexName: 'equipmentId-index',
        KeyConditionExpression: 'equipmentId = :equipmentId',
        ExpressionAttributeValues: {
          ':equipmentId': equipmentId,
        },
      }).promise();
      
      equipment.push(...result.Items);
    }
  } else {
    // Export all equipment
    const result = await dynamodb.scan({
      TableName: process.env.EQUIPMENT_TABLE,
    }).promise();
    
    equipment.push(...result.Items);
  }
  
  // Get deployments
  const deploymentsResult = await dynamodb.scan({
    TableName: process.env.DEPLOYMENTS_TABLE,
  }).promise();
  
  deployments.push(...deploymentsResult.Items);
  
  return {
    equipment,
    deployments,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
}

// Export single diagram
async function exportDiagram(jobId) {
  const jobResult = await dynamodb.get({
    TableName: process.env.JOBS_TABLE,
    Key: { id: jobId },
  }).promise();
  
  const diagramResult = await dynamodb.get({
    TableName: process.env.DIAGRAMS_TABLE,
    Key: { jobId },
  }).promise();
  
  return {
    job: jobResult.Item,
    diagram: diagramResult.Item,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
}

// Export full backup
async function exportFullBackup() {
  const [jobs, diagrams, equipment, contacts, clients, deployments] = await Promise.all([
    dynamodb.scan({ TableName: process.env.JOBS_TABLE }).promise(),
    dynamodb.scan({ TableName: process.env.DIAGRAMS_TABLE }).promise(),
    dynamodb.scan({ TableName: process.env.EQUIPMENT_TABLE }).promise(),
    dynamodb.scan({ TableName: process.env.CONTACTS_TABLE }).promise(),
    dynamodb.scan({ TableName: process.env.CLIENTS_TABLE }).promise(),
    dynamodb.scan({ TableName: process.env.DEPLOYMENTS_TABLE }).promise(),
  ]);
  
  return {
    jobs: jobs.Items,
    diagrams: diagrams.Items,
    equipment: equipment.Items,
    contacts: contacts.Items,
    clients: clients.Items,
    deployments: deployments.Items,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
}