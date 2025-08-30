/**
 * Import Lambda Handler
 * Imports data from S3 backups
 */

const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const STORAGE_BUCKET = process.env.STORAGE_BUCKET;

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

// Import data from S3
module.exports.importData = async (event) => {
  try {
    const { type } = event.pathParameters;
    const data = event.body ? JSON.parse(event.body) : {};
    
    if (!data.key) {
      return createResponse(400, { error: 'S3 key is required for import' });
    }
    
    // Get file from S3
    const params = {
      Bucket: STORAGE_BUCKET,
      Key: data.key,
    };
    
    const s3Result = await s3.getObject(params).promise();
    const importData = JSON.parse(s3Result.Body.toString());
    
    let imported = 0;
    
    switch (type) {
      case 'jobs':
        // Import jobs and diagrams
        if (importData.jobs) {
          for (const job of importData.jobs) {
            await dynamodb.put({
              TableName: process.env.JOBS_TABLE,
              Item: job,
            }).promise();
            imported++;
          }
        }
        if (importData.diagrams) {
          for (const diagram of importData.diagrams) {
            await dynamodb.put({
              TableName: process.env.DIAGRAMS_TABLE,
              Item: diagram,
            }).promise();
          }
        }
        break;
        
      case 'equipment':
        // Import equipment
        if (importData.equipment) {
          for (const item of importData.equipment) {
            await dynamodb.put({
              TableName: process.env.EQUIPMENT_TABLE,
              Item: item,
            }).promise();
            imported++;
          }
        }
        break;
        
      case 'full':
        // Import everything
        const tables = {
          jobs: process.env.JOBS_TABLE,
          diagrams: process.env.DIAGRAMS_TABLE,
          equipment: process.env.EQUIPMENT_TABLE,
          contacts: process.env.CONTACTS_TABLE,
          clients: process.env.CLIENTS_TABLE,
          deployments: process.env.DEPLOYMENTS_TABLE,
        };
        
        for (const [key, tableName] of Object.entries(tables)) {
          if (importData[key] && Array.isArray(importData[key])) {
            for (const item of importData[key]) {
              await dynamodb.put({
                TableName: tableName,
                Item: item,
              }).promise();
              imported++;
            }
          }
        }
        break;
        
      default:
        return createResponse(400, { error: 'Invalid import type' });
    }
    
    return createResponse(200, {
      message: 'Import successful',
      imported,
      source: data.key,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return createResponse(500, { error: 'Failed to import data' });
  }
};