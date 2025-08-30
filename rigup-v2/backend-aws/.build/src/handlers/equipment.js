/**
 * Equipment Lambda Handlers
 * Manages equipment with proper serial number codes (SS01, CT03, etc.)
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var dynamodb = new AWS.DynamoDB.DocumentClient();
var EQUIPMENT_TABLE = process.env.EQUIPMENT_TABLE;
var DEPLOYMENTS_TABLE = process.env.DEPLOYMENTS_TABLE;
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
// List all equipment with proper codes
module.exports.list = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var params, result, equipment, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                params = {
                    TableName: EQUIPMENT_TABLE,
                };
                return [4 /*yield*/, dynamodb.scan(params).promise()];
            case 1:
                result = _a.sent();
                equipment = result.Items.map(function (item) { return (__assign(__assign({}, item), { 
                    // Ensure equipmentId is the display code (SS01, CT03, etc.)
                    equipmentId: item.equipmentId || item.equipment_id, displayName: "".concat(item.equipmentId || item.equipment_id, " - ").concat(item.name || '').trim(), 
                    // Keep serial_number for backward compatibility
                    serial_number: item.equipmentId || item.equipment_id })); });
                return [2 /*return*/, createResponse(200, equipment)];
            case 2:
                error_1 = _a.sent();
                console.error('Error listing equipment:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to list equipment' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Get single equipment item
module.exports.get = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, params, result, equipment, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                params = {
                    TableName: EQUIPMENT_TABLE,
                    Key: { id: id },
                };
                return [4 /*yield*/, dynamodb.get(params).promise()];
            case 1:
                result = _a.sent();
                if (!result.Item) {
                    return [2 /*return*/, createResponse(404, { error: 'Equipment not found' })];
                }
                equipment = __assign(__assign({}, result.Item), { equipmentId: result.Item.equipmentId || result.Item.equipment_id, displayName: "".concat(result.Item.equipmentId || result.Item.equipment_id, " - ").concat(result.Item.name || '').trim(), serial_number: result.Item.equipmentId || result.Item.equipment_id });
                return [2 /*return*/, createResponse(200, equipment)];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting equipment:', error_2);
                return [2 /*return*/, createResponse(500, { error: 'Failed to get equipment' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Create new equipment with proper code
module.exports.create = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, equipment, checkParams, existing, params, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                data = JSON.parse(event.body);
                // Validate equipment code format
                if (!data.equipmentId || !/^[A-Z]{2}\d{2,3}$/.test(data.equipmentId)) {
                    return [2 /*return*/, createResponse(400, {
                            error: 'Equipment ID must be in format: SS01, CT03, etc. (2 letters + 2-3 digits)'
                        })];
                }
                equipment = {
                    id: uuidv4(),
                    equipmentId: data.equipmentId.toUpperCase(), // Ensure uppercase
                    equipment_id: data.equipmentId.toUpperCase(), // Backward compatibility
                    serial_number: data.equipmentId.toUpperCase(), // Backward compatibility
                    name: data.name || '',
                    type: data.type || 'general',
                    equipmentTypeId: data.equipmentTypeId || data.type_id,
                    storageLocationId: data.storageLocationId || data.location_id || 'shop',
                    status: data.status || 'available',
                    jobId: data.jobId || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    // Additional fields
                    purchase_date: data.purchase_date || null,
                    warranty_expiry: data.warranty_expiry || null,
                    red_tag_reason: data.red_tag_reason || null,
                    red_tag_photo: data.red_tag_photo || null,
                    notes: data.notes || '',
                };
                checkParams = {
                    TableName: EQUIPMENT_TABLE,
                    IndexName: 'equipmentId-index',
                    KeyConditionExpression: 'equipmentId = :equipmentId',
                    ExpressionAttributeValues: {
                        ':equipmentId': equipment.equipmentId,
                    },
                };
                return [4 /*yield*/, dynamodb.query(checkParams).promise()];
            case 1:
                existing = _a.sent();
                if (existing.Items && existing.Items.length > 0) {
                    return [2 /*return*/, createResponse(400, {
                            error: "Equipment with ID ".concat(equipment.equipmentId, " already exists")
                        })];
                }
                params = {
                    TableName: EQUIPMENT_TABLE,
                    Item: equipment,
                };
                return [4 /*yield*/, dynamodb.put(params).promise()];
            case 2:
                _a.sent();
                return [2 /*return*/, createResponse(201, equipment)];
            case 3:
                error_3 = _a.sent();
                console.error('Error creating equipment:', error_3);
                return [2 /*return*/, createResponse(500, { error: 'Failed to create equipment' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Update equipment status
module.exports.updateStatus = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, data, validStatuses, params, result, equipment, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                data = JSON.parse(event.body);
                validStatuses = ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'];
                if (!validStatuses.includes(data.status)) {
                    return [2 /*return*/, createResponse(400, {
                            error: "Invalid status. Must be one of: ".concat(validStatuses.join(', '))
                        })];
                }
                params = {
                    TableName: EQUIPMENT_TABLE,
                    Key: { id: id },
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
                return [4 /*yield*/, dynamodb.update(params).promise()];
            case 1:
                result = _a.sent();
                equipment = __assign(__assign({}, result.Attributes), { equipmentId: result.Attributes.equipmentId || result.Attributes.equipment_id, displayName: "".concat(result.Attributes.equipmentId || result.Attributes.equipment_id, " - ").concat(result.Attributes.name || '').trim() });
                return [2 /*return*/, createResponse(200, equipment)];
            case 2:
                error_4 = _a.sent();
                console.error('Error updating equipment status:', error_4);
                return [2 /*return*/, createResponse(500, { error: 'Failed to update equipment status' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Deploy equipment to job
module.exports.deploy = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data_1, deploymentId, deployment, updatePromises, deploymentParams, error_5;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                data_1 = JSON.parse(event.body);
                if (!data_1.equipmentIds || !data_1.jobId) {
                    return [2 /*return*/, createResponse(400, { error: 'Equipment IDs and Job ID are required' })];
                }
                deploymentId = uuidv4();
                deployment = {
                    id: deploymentId,
                    jobId: data_1.jobId,
                    equipmentIds: data_1.equipmentIds, // Array of equipment codes (SS01, CT03, etc.)
                    deployed_at: new Date().toISOString(),
                    deployed_by: data_1.deployed_by || 'system',
                    status: 'deployed',
                    notes: data_1.notes || '',
                };
                updatePromises = data_1.equipmentIds.map(function (equipmentId) { return __awaiter(_this, void 0, void 0, function () {
                    var queryParams, queryResult, item, updateParams;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                queryParams = {
                                    TableName: EQUIPMENT_TABLE,
                                    IndexName: 'equipmentId-index',
                                    KeyConditionExpression: 'equipmentId = :equipmentId',
                                    ExpressionAttributeValues: {
                                        ':equipmentId': equipmentId,
                                    },
                                };
                                return [4 /*yield*/, dynamodb.query(queryParams).promise()];
                            case 1:
                                queryResult = _a.sent();
                                if (queryResult.Items && queryResult.Items.length > 0) {
                                    item = queryResult.Items[0];
                                    updateParams = {
                                        TableName: EQUIPMENT_TABLE,
                                        Key: { id: item.id },
                                        UpdateExpression: 'SET #status = :status, jobId = :jobId, updated_at = :updated_at',
                                        ExpressionAttributeNames: {
                                            '#status': 'status',
                                        },
                                        ExpressionAttributeValues: {
                                            ':status': 'deployed',
                                            ':jobId': data_1.jobId,
                                            ':updated_at': new Date().toISOString(),
                                        },
                                    };
                                    return [2 /*return*/, dynamodb.update(updateParams).promise()];
                                }
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [4 /*yield*/, Promise.all(updatePromises)];
            case 1:
                _a.sent();
                deploymentParams = {
                    TableName: DEPLOYMENTS_TABLE,
                    Item: deployment,
                };
                return [4 /*yield*/, dynamodb.put(deploymentParams).promise()];
            case 2:
                _a.sent();
                return [2 /*return*/, createResponse(201, {
                        message: 'Equipment deployed successfully',
                        deploymentId: deploymentId,
                        equipmentIds: data_1.equipmentIds,
                    })];
            case 3:
                error_5 = _a.sent();
                console.error('Error deploying equipment:', error_5);
                return [2 /*return*/, createResponse(500, { error: 'Failed to deploy equipment' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Return equipment from job
module.exports.return = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, equipmentIds, deploymentParams, deploymentResult, updateDeploymentParams, updatePromises, error_6;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                data = JSON.parse(event.body);
                if (!data.deploymentId && !data.equipmentIds) {
                    return [2 /*return*/, createResponse(400, {
                            error: 'Either deployment ID or equipment IDs are required'
                        })];
                }
                equipmentIds = data.equipmentIds;
                if (!data.deploymentId) return [3 /*break*/, 3];
                deploymentParams = {
                    TableName: DEPLOYMENTS_TABLE,
                    Key: { id: data.deploymentId },
                };
                return [4 /*yield*/, dynamodb.get(deploymentParams).promise()];
            case 1:
                deploymentResult = _a.sent();
                if (!deploymentResult.Item) return [3 /*break*/, 3];
                equipmentIds = deploymentResult.Item.equipmentIds;
                updateDeploymentParams = {
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
                return [4 /*yield*/, dynamodb.update(updateDeploymentParams).promise()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                updatePromises = equipmentIds.map(function (equipmentId) { return __awaiter(_this, void 0, void 0, function () {
                    var queryParams, queryResult, item, updateParams;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                queryParams = {
                                    TableName: EQUIPMENT_TABLE,
                                    IndexName: 'equipmentId-index',
                                    KeyConditionExpression: 'equipmentId = :equipmentId',
                                    ExpressionAttributeValues: {
                                        ':equipmentId': equipmentId,
                                    },
                                };
                                return [4 /*yield*/, dynamodb.query(queryParams).promise()];
                            case 1:
                                queryResult = _a.sent();
                                if (queryResult.Items && queryResult.Items.length > 0) {
                                    item = queryResult.Items[0];
                                    updateParams = {
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
                                    return [2 /*return*/, dynamodb.update(updateParams).promise()];
                                }
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [4 /*yield*/, Promise.all(updatePromises)];
            case 4:
                _a.sent();
                return [2 /*return*/, createResponse(200, {
                        message: 'Equipment returned successfully',
                        equipmentIds: equipmentIds,
                    })];
            case 5:
                error_6 = _a.sent();
                console.error('Error returning equipment:', error_6);
                return [2 /*return*/, createResponse(500, { error: 'Failed to return equipment' })];
            case 6: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=equipment.js.map