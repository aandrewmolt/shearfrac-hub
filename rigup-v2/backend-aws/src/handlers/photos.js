/**
 * Photo Management Lambda Handlers
 * Handles photo uploads to S3 with signed URLs
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET;
// CloudFront domain will be provided after deployment
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

// Get pre-signed URL for photo upload
module.exports.getUploadUrl = async (event) => {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.fileName || !data.fileType) {
      return createResponse(400, { error: 'File name and type are required' });
    }
    
    // Generate unique key for the photo
    const fileExtension = data.fileName.split('.').pop();
    const key = `${data.jobId || 'general'}/${uuidv4()}.${fileExtension}`;
    
    // Generate pre-signed URL for upload (expires in 5 minutes)
    const params = {
      Bucket: PHOTOS_BUCKET,
      Key: key,
      ContentType: data.fileType,
      Expires: 300, // 5 minutes
      Metadata: {
        jobId: data.jobId || '',
        uploadedBy: data.uploadedBy || 'unknown',
        originalName: data.fileName,
        section: data.section || 'general',
      },
    };
    
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    
    // Return both upload URL and the final URL through CloudFront
    return createResponse(200, {
      uploadUrl,
      key,
      photoUrl: `https://${CLOUDFRONT_DOMAIN}/photos/${key}`,
      expires: new Date(Date.now() + 300000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return createResponse(500, { error: 'Failed to generate upload URL' });
  }
};

// Get pre-signed URL for photo viewing (if private)
module.exports.getPhotoUrl = async (event) => {
  try {
    const { key } = event.pathParameters;
    
    // Check if photo exists
    const headParams = {
      Bucket: PHOTOS_BUCKET,
      Key: key,
    };
    
    try {
      await s3.headObject(headParams).promise();
    } catch (error) {
      if (error.code === 'NotFound') {
        return createResponse(404, { error: 'Photo not found' });
      }
      throw error;
    }
    
    // Generate pre-signed URL for viewing (expires in 1 hour)
    const params = {
      Bucket: PHOTOS_BUCKET,
      Key: key,
      Expires: 3600, // 1 hour
    };
    
    const viewUrl = await s3.getSignedUrlPromise('getObject', params);
    
    return createResponse(200, {
      url: viewUrl,
      cloudFrontUrl: `https://${CLOUDFRONT_DOMAIN}/photos/${key}`,
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return createResponse(500, { error: 'Failed to get photo URL' });
  }
};

// Delete photo
module.exports.delete = async (event) => {
  try {
    const { key } = event.pathParameters;
    
    const params = {
      Bucket: PHOTOS_BUCKET,
      Key: key,
    };
    
    await s3.deleteObject(params).promise();
    
    return createResponse(200, { message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return createResponse(500, { error: 'Failed to delete photo' });
  }
};

// List photos for a job
module.exports.listJobPhotos = async (event) => {
  try {
    const { id: jobId } = event.pathParameters;
    
    const params = {
      Bucket: PHOTOS_BUCKET,
      Prefix: `${jobId}/`,
      MaxKeys: 1000,
    };
    
    const result = await s3.listObjectsV2(params).promise();
    
    const photos = result.Contents.map(item => ({
      key: item.Key,
      url: `https://${CLOUDFRONT_DOMAIN}/photos/${item.Key}`,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag,
    }));
    
    return createResponse(200, photos);
  } catch (error) {
    console.error('Error listing photos:', error);
    return createResponse(500, { error: 'Failed to list photos' });
  }
};