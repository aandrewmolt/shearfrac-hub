/**
 * Photo Management Lambda Handlers
 * Handles photo uploads to S3 with signed URLs
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var AWS = require('aws-sdk');
var uuidv4 = require('uuid').v4;
var s3 = new AWS.S3();
var PHOTOS_BUCKET = process.env.PHOTOS_BUCKET;
// CloudFront domain will be provided after deployment
var CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'cdn.example.com';
// Helper to create consistent responses
var createResponse = function (statusCode, body) { return ({
    statusCode: statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
}); };
// Get pre-signed URL for photo upload
module.exports.getUploadUrl = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, fileExtension, key, params, uploadUrl, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = JSON.parse(event.body);
                if (!data.fileName || !data.fileType) {
                    return [2 /*return*/, createResponse(400, { error: 'File name and type are required' })];
                }
                fileExtension = data.fileName.split('.').pop();
                key = "".concat(data.jobId || 'general', "/").concat(uuidv4(), ".").concat(fileExtension);
                params = {
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
                return [4 /*yield*/, s3.getSignedUrlPromise('putObject', params)];
            case 1:
                uploadUrl = _a.sent();
                // Return both upload URL and the final URL through CloudFront
                return [2 /*return*/, createResponse(200, {
                        uploadUrl: uploadUrl,
                        key: key,
                        photoUrl: "https://".concat(CLOUDFRONT_DOMAIN, "/photos/").concat(key),
                        expires: new Date(Date.now() + 300000).toISOString(),
                    })];
            case 2:
                error_1 = _a.sent();
                console.error('Error generating upload URL:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to generate upload URL' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Get pre-signed URL for photo viewing (if private)
module.exports.getPhotoUrl = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var key, headParams, error_2, params, viewUrl, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                key = event.pathParameters.key;
                headParams = {
                    Bucket: PHOTOS_BUCKET,
                    Key: key,
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, s3.headObject(headParams).promise()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                if (error_2.code === 'NotFound') {
                    return [2 /*return*/, createResponse(404, { error: 'Photo not found' })];
                }
                throw error_2;
            case 4:
                params = {
                    Bucket: PHOTOS_BUCKET,
                    Key: key,
                    Expires: 3600, // 1 hour
                };
                return [4 /*yield*/, s3.getSignedUrlPromise('getObject', params)];
            case 5:
                viewUrl = _a.sent();
                return [2 /*return*/, createResponse(200, {
                        url: viewUrl,
                        cloudFrontUrl: "https://".concat(CLOUDFRONT_DOMAIN, "/photos/").concat(key),
                        expires: new Date(Date.now() + 3600000).toISOString(),
                    })];
            case 6:
                error_3 = _a.sent();
                console.error('Error getting photo URL:', error_3);
                return [2 /*return*/, createResponse(500, { error: 'Failed to get photo URL' })];
            case 7: return [2 /*return*/];
        }
    });
}); };
// Delete photo
module.exports.delete = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var key, params, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                key = event.pathParameters.key;
                params = {
                    Bucket: PHOTOS_BUCKET,
                    Key: key,
                };
                return [4 /*yield*/, s3.deleteObject(params).promise()];
            case 1:
                _a.sent();
                return [2 /*return*/, createResponse(200, { message: 'Photo deleted successfully' })];
            case 2:
                error_4 = _a.sent();
                console.error('Error deleting photo:', error_4);
                return [2 /*return*/, createResponse(500, { error: 'Failed to delete photo' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// List photos for a job
module.exports.listJobPhotos = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var jobId, params, result, photos, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                jobId = event.pathParameters.id;
                params = {
                    Bucket: PHOTOS_BUCKET,
                    Prefix: "".concat(jobId, "/"),
                    MaxKeys: 1000,
                };
                return [4 /*yield*/, s3.listObjectsV2(params).promise()];
            case 1:
                result = _a.sent();
                photos = result.Contents.map(function (item) { return ({
                    key: item.Key,
                    url: "https://".concat(CLOUDFRONT_DOMAIN, "/photos/").concat(item.Key),
                    size: item.Size,
                    lastModified: item.LastModified,
                    etag: item.ETag,
                }); });
                return [2 /*return*/, createResponse(200, photos)];
            case 2:
                error_5 = _a.sent();
                console.error('Error listing photos:', error_5);
                return [2 /*return*/, createResponse(500, { error: 'Failed to list photos' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=photos.js.map