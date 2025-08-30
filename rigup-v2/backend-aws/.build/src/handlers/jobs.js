/**
 * Jobs Lambda Handlers
 * Manages job creation, updates, and listing
 * Ensures proper job naming: Client + Pad = Job Name
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
var JOBS_TABLE = process.env.JOBS_TABLE;
var CLIENTS_TABLE = process.env.CLIENTS_TABLE;
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
// List all jobs
module.exports.list = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var params, result, jobs, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                params = {
                    TableName: JOBS_TABLE,
                };
                return [4 /*yield*/, dynamodb.scan(params).promise()];
            case 1:
                result = _a.sent();
                jobs = result.Items.map(function (job) { return (__assign(__assign({}, job), { name: job.pad ? "".concat(job.client, " - ").concat(job.pad) : job.name, displayName: job.pad ? "".concat(job.client, " - ").concat(job.pad, " ").concat(job.wellNumber || '').trim() : job.name })); });
                return [2 /*return*/, createResponse(200, jobs)];
            case 2:
                error_1 = _a.sent();
                console.error('Error listing jobs:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to list jobs' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Get single job
module.exports.get = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, params, result, job, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                params = {
                    TableName: JOBS_TABLE,
                    Key: { id: id },
                };
                return [4 /*yield*/, dynamodb.get(params).promise()];
            case 1:
                result = _a.sent();
                if (!result.Item) {
                    return [2 /*return*/, createResponse(404, { error: 'Job not found' })];
                }
                job = __assign(__assign({}, result.Item), { name: result.Item.pad ? "".concat(result.Item.client, " - ").concat(result.Item.pad) : result.Item.name, displayName: result.Item.pad ?
                        "".concat(result.Item.client, " - ").concat(result.Item.pad, " ").concat(result.Item.wellNumber || '').trim() :
                        result.Item.name });
                return [2 /*return*/, createResponse(200, job)];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting job:', error_2);
                return [2 /*return*/, createResponse(500, { error: 'Failed to get job' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Create new job
module.exports.create = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, jobName, displayName, job, params, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                data = JSON.parse(event.body);
                // Ensure client and pad are saved
                if (!data.client || !data.pad) {
                    return [2 /*return*/, createResponse(400, { error: 'Client and Pad are required' })];
                }
                if (!data.client) return [3 /*break*/, 2];
                return [4 /*yield*/, saveClient(data.client)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                jobName = "".concat(data.client, " - ").concat(data.pad);
                displayName = data.wellNumber ?
                    "".concat(data.client, " - ").concat(data.pad, " ").concat(data.wellNumber) :
                    jobName;
                job = {
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
                params = {
                    TableName: JOBS_TABLE,
                    Item: job,
                };
                return [4 /*yield*/, dynamodb.put(params).promise()];
            case 3:
                _a.sent();
                return [2 /*return*/, createResponse(201, job)];
            case 4:
                error_3 = _a.sent();
                console.error('Error creating job:', error_3);
                return [2 /*return*/, createResponse(500, { error: 'Failed to create job' })];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Update job
module.exports.update = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, data_1, jobName, displayName, updateExpressions_1, expressionAttributeNames_1, expressionAttributeValues_1, fieldsToUpdate, params, result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = event.pathParameters.id;
                data_1 = JSON.parse(event.body);
                jobName = data_1.name;
                displayName = data_1.displayName;
                if (!(data_1.client && data_1.pad)) return [3 /*break*/, 2];
                jobName = "".concat(data_1.client, " - ").concat(data_1.pad);
                displayName = data_1.wellNumber ?
                    "".concat(data_1.client, " - ").concat(data_1.pad, " ").concat(data_1.wellNumber) :
                    jobName;
                // Save client if new
                return [4 /*yield*/, saveClient(data_1.client)];
            case 1:
                // Save client if new
                _a.sent();
                _a.label = 2;
            case 2:
                updateExpressions_1 = [];
                expressionAttributeNames_1 = {};
                expressionAttributeValues_1 = {};
                // Update job name if client/pad changed
                if (jobName) {
                    updateExpressions_1.push('#name = :name');
                    expressionAttributeNames_1['#name'] = 'name';
                    expressionAttributeValues_1[':name'] = jobName;
                    updateExpressions_1.push('displayName = :displayName');
                    expressionAttributeValues_1[':displayName'] = displayName;
                }
                fieldsToUpdate = [
                    'client', 'pad', 'wellNumber', 'well_count', 'has_wellside_gauge',
                    'status', 'equipment_assignment', 'main_box_id', 'satellite_id',
                    'wellside_gauge_id', 'selected_cable_type', 'frac_baud_rate',
                    'gauge_baud_rate', 'frac_com_port', 'gauge_com_port',
                    'enhanced_config', 'company_computer_names', 'nodes', 'edges'
                ];
                fieldsToUpdate.forEach(function (field) {
                    if (data_1[field] !== undefined) {
                        var attrName = field === 'status' ? '#status' : field;
                        if (field === 'status') {
                            expressionAttributeNames_1['#status'] = 'status';
                        }
                        updateExpressions_1.push("".concat(attrName, " = :").concat(field));
                        expressionAttributeValues_1[":".concat(field)] = data_1[field];
                    }
                });
                // Always update the timestamp
                updateExpressions_1.push('updated_at = :updated_at');
                expressionAttributeValues_1[':updated_at'] = new Date().toISOString();
                params = {
                    TableName: JOBS_TABLE,
                    Key: { id: id },
                    UpdateExpression: "SET ".concat(updateExpressions_1.join(', ')),
                    ExpressionAttributeValues: expressionAttributeValues_1,
                    ReturnValues: 'ALL_NEW',
                };
                if (Object.keys(expressionAttributeNames_1).length > 0) {
                    params.ExpressionAttributeNames = expressionAttributeNames_1;
                }
                return [4 /*yield*/, dynamodb.update(params).promise()];
            case 3:
                result = _a.sent();
                return [2 /*return*/, createResponse(200, result.Attributes)];
            case 4:
                error_4 = _a.sent();
                console.error('Error updating job:', error_4);
                return [2 /*return*/, createResponse(500, { error: 'Failed to update job' })];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Delete job
module.exports.delete = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, params, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                params = {
                    TableName: JOBS_TABLE,
                    Key: { id: id },
                };
                return [4 /*yield*/, dynamodb.delete(params).promise()];
            case 1:
                _a.sent();
                return [2 /*return*/, createResponse(200, { message: 'Job deleted successfully' })];
            case 2:
                error_5 = _a.sent();
                console.error('Error deleting job:', error_5);
                return [2 /*return*/, createResponse(500, { error: 'Failed to delete job' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Helper function to save client
function saveClient(clientName) {
    return __awaiter(this, void 0, void 0, function () {
        var clientId, params, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    clientId = clientName.toLowerCase().replace(/\s+/g, '-');
                    params = {
                        TableName: CLIENTS_TABLE,
                        Item: {
                            id: clientId,
                            name: clientName,
                            created_at: new Date().toISOString(),
                        },
                        ConditionExpression: 'attribute_not_exists(id)',
                    };
                    return [4 /*yield*/, dynamodb.put(params).promise()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    // Client already exists, that's fine
                    if (error_6.code !== 'ConditionalCheckFailedException') {
                        console.error('Error saving client:', error_6);
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=jobs.js.map