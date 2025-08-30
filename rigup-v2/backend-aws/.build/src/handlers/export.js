/**
 * Export Lambda Handler
 * Exports data to S3 for backup and sharing
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
var dynamodb = new AWS.DynamoDB.DocumentClient();
var STORAGE_BUCKET = process.env.STORAGE_BUCKET;
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
// Export data to S3
module.exports.exportData = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var type, data, exportData_1, fileName, _a, key, params, downloadUrl, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 13, , 14]);
                type = event.pathParameters.type;
                data = event.body ? JSON.parse(event.body) : {};
                exportData_1 = {};
                fileName = '';
                _a = type;
                switch (_a) {
                    case 'jobs': return [3 /*break*/, 1];
                    case 'equipment': return [3 /*break*/, 3];
                    case 'full': return [3 /*break*/, 5];
                    case 'diagram': return [3 /*break*/, 7];
                }
                return [3 /*break*/, 9];
            case 1: return [4 /*yield*/, exportJobs(data.jobIds)];
            case 2:
                exportData_1 = _b.sent();
                fileName = "jobs-export-".concat(Date.now(), ".json");
                return [3 /*break*/, 10];
            case 3: return [4 /*yield*/, exportEquipment(data.equipmentIds)];
            case 4:
                exportData_1 = _b.sent();
                fileName = "equipment-export-".concat(Date.now(), ".json");
                return [3 /*break*/, 10];
            case 5: return [4 /*yield*/, exportFullBackup()];
            case 6:
                exportData_1 = _b.sent();
                fileName = "full-backup-".concat(Date.now(), ".json");
                return [3 /*break*/, 10];
            case 7:
                if (!data.jobId) {
                    return [2 /*return*/, createResponse(400, { error: 'Job ID required for diagram export' })];
                }
                return [4 /*yield*/, exportDiagram(data.jobId)];
            case 8:
                exportData_1 = _b.sent();
                fileName = "diagram-".concat(data.jobId, "-").concat(Date.now(), ".json");
                return [3 /*break*/, 10];
            case 9: return [2 /*return*/, createResponse(400, { error: 'Invalid export type' })];
            case 10:
                key = "exports/".concat(fileName);
                params = {
                    Bucket: STORAGE_BUCKET,
                    Key: key,
                    Body: JSON.stringify(exportData_1, null, 2),
                    ContentType: 'application/json',
                    Metadata: {
                        exportType: type,
                        exportDate: new Date().toISOString(),
                        exportedBy: data.userId || 'system',
                    },
                };
                return [4 /*yield*/, s3.putObject(params).promise()];
            case 11:
                _b.sent();
                return [4 /*yield*/, s3.getSignedUrlPromise('getObject', {
                        Bucket: STORAGE_BUCKET,
                        Key: key,
                        Expires: 86400, // 24 hours
                    })];
            case 12:
                downloadUrl = _b.sent();
                return [2 /*return*/, createResponse(200, {
                        message: 'Export successful',
                        key: key,
                        downloadUrl: downloadUrl,
                        cloudFrontUrl: "https://".concat(CLOUDFRONT_DOMAIN, "/storage/").concat(key),
                        expires: new Date(Date.now() + 86400000).toISOString(),
                        recordCount: Object.keys(exportData_1).reduce(function (acc, key) {
                            return acc + (Array.isArray(exportData_1[key]) ? exportData_1[key].length : 1);
                        }, 0),
                    })];
            case 13:
                error_1 = _b.sent();
                console.error('Error exporting data:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to export data' })];
            case 14: return [2 /*return*/];
        }
    });
}); };
// Export jobs with related data
function exportJobs(jobIds) {
    return __awaiter(this, void 0, void 0, function () {
        var jobs, diagrams, _i, jobIds_1, jobId, jobResult, diagramResult, jobsResult, diagramsResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jobs = [];
                    diagrams = [];
                    if (!(jobIds && jobIds.length > 0)) return [3 /*break*/, 6];
                    _i = 0, jobIds_1 = jobIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < jobIds_1.length)) return [3 /*break*/, 5];
                    jobId = jobIds_1[_i];
                    return [4 /*yield*/, dynamodb.get({
                            TableName: process.env.JOBS_TABLE,
                            Key: { id: jobId },
                        }).promise()];
                case 2:
                    jobResult = _a.sent();
                    if (!jobResult.Item) return [3 /*break*/, 4];
                    jobs.push(jobResult.Item);
                    return [4 /*yield*/, dynamodb.get({
                            TableName: process.env.DIAGRAMS_TABLE,
                            Key: { jobId: jobId },
                        }).promise()];
                case 3:
                    diagramResult = _a.sent();
                    if (diagramResult.Item) {
                        diagrams.push(diagramResult.Item);
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [3 /*break*/, 9];
                case 6: return [4 /*yield*/, dynamodb.scan({
                        TableName: process.env.JOBS_TABLE,
                    }).promise()];
                case 7:
                    jobsResult = _a.sent();
                    jobs.push.apply(jobs, jobsResult.Items);
                    return [4 /*yield*/, dynamodb.scan({
                            TableName: process.env.DIAGRAMS_TABLE,
                        }).promise()];
                case 8:
                    diagramsResult = _a.sent();
                    diagrams.push.apply(diagrams, diagramsResult.Items);
                    _a.label = 9;
                case 9: return [2 /*return*/, {
                        jobs: jobs,
                        diagrams: diagrams,
                        exportDate: new Date().toISOString(),
                        version: '2.0',
                    }];
            }
        });
    });
}
// Export equipment
function exportEquipment(equipmentIds) {
    return __awaiter(this, void 0, void 0, function () {
        var equipment, deployments, _i, equipmentIds_1, equipmentId, result, result, deploymentsResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    equipment = [];
                    deployments = [];
                    if (!(equipmentIds && equipmentIds.length > 0)) return [3 /*break*/, 5];
                    _i = 0, equipmentIds_1 = equipmentIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < equipmentIds_1.length)) return [3 /*break*/, 4];
                    equipmentId = equipmentIds_1[_i];
                    return [4 /*yield*/, dynamodb.query({
                            TableName: process.env.EQUIPMENT_TABLE,
                            IndexName: 'equipmentId-index',
                            KeyConditionExpression: 'equipmentId = :equipmentId',
                            ExpressionAttributeValues: {
                                ':equipmentId': equipmentId,
                            },
                        }).promise()];
                case 2:
                    result = _a.sent();
                    equipment.push.apply(equipment, result.Items);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, dynamodb.scan({
                        TableName: process.env.EQUIPMENT_TABLE,
                    }).promise()];
                case 6:
                    result = _a.sent();
                    equipment.push.apply(equipment, result.Items);
                    _a.label = 7;
                case 7: return [4 /*yield*/, dynamodb.scan({
                        TableName: process.env.DEPLOYMENTS_TABLE,
                    }).promise()];
                case 8:
                    deploymentsResult = _a.sent();
                    deployments.push.apply(deployments, deploymentsResult.Items);
                    return [2 /*return*/, {
                            equipment: equipment,
                            deployments: deployments,
                            exportDate: new Date().toISOString(),
                            version: '2.0',
                        }];
            }
        });
    });
}
// Export single diagram
function exportDiagram(jobId) {
    return __awaiter(this, void 0, void 0, function () {
        var jobResult, diagramResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dynamodb.get({
                        TableName: process.env.JOBS_TABLE,
                        Key: { id: jobId },
                    }).promise()];
                case 1:
                    jobResult = _a.sent();
                    return [4 /*yield*/, dynamodb.get({
                            TableName: process.env.DIAGRAMS_TABLE,
                            Key: { jobId: jobId },
                        }).promise()];
                case 2:
                    diagramResult = _a.sent();
                    return [2 /*return*/, {
                            job: jobResult.Item,
                            diagram: diagramResult.Item,
                            exportDate: new Date().toISOString(),
                            version: '2.0',
                        }];
            }
        });
    });
}
// Export full backup
function exportFullBackup() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, jobs, diagrams, equipment, contacts, clients, deployments;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        dynamodb.scan({ TableName: process.env.JOBS_TABLE }).promise(),
                        dynamodb.scan({ TableName: process.env.DIAGRAMS_TABLE }).promise(),
                        dynamodb.scan({ TableName: process.env.EQUIPMENT_TABLE }).promise(),
                        dynamodb.scan({ TableName: process.env.CONTACTS_TABLE }).promise(),
                        dynamodb.scan({ TableName: process.env.CLIENTS_TABLE }).promise(),
                        dynamodb.scan({ TableName: process.env.DEPLOYMENTS_TABLE }).promise(),
                    ])];
                case 1:
                    _a = _b.sent(), jobs = _a[0], diagrams = _a[1], equipment = _a[2], contacts = _a[3], clients = _a[4], deployments = _a[5];
                    return [2 /*return*/, {
                            jobs: jobs.Items,
                            diagrams: diagrams.Items,
                            equipment: equipment.Items,
                            contacts: contacts.Items,
                            clients: clients.Items,
                            deployments: deployments.Items,
                            exportDate: new Date().toISOString(),
                            version: '2.0',
                        }];
            }
        });
    });
}
//# sourceMappingURL=export.js.map