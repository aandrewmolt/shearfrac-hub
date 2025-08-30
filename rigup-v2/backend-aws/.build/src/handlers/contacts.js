/**
 * Contacts Lambda Handlers
 * Manages contacts for jobs
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
var dynamodb = new AWS.DynamoDB.DocumentClient();
var CONTACTS_TABLE = process.env.CONTACTS_TABLE;
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
// List all contacts
module.exports.list = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var params, result_1, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                params = {
                    TableName: CONTACTS_TABLE,
                };
                if (!((_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.type)) return [3 /*break*/, 2];
                params.IndexName = 'type-index';
                params.KeyConditionExpression = '#type = :type';
                params.ExpressionAttributeNames = { '#type': 'type' };
                params.ExpressionAttributeValues = { ':type': event.queryStringParameters.type };
                return [4 /*yield*/, dynamodb.query(params).promise()];
            case 1:
                result_1 = _b.sent();
                return [2 /*return*/, createResponse(200, result_1.Items)];
            case 2: return [4 /*yield*/, dynamodb.scan(params).promise()];
            case 3:
                result = _b.sent();
                return [2 /*return*/, createResponse(200, result.Items)];
            case 4:
                error_1 = _b.sent();
                console.error('Error listing contacts:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to list contacts' })];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Get single contact
module.exports.get = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, params, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                params = {
                    TableName: CONTACTS_TABLE,
                    Key: { id: id },
                };
                return [4 /*yield*/, dynamodb.get(params).promise()];
            case 1:
                result = _a.sent();
                if (!result.Item) {
                    return [2 /*return*/, createResponse(404, { error: 'Contact not found' })];
                }
                return [2 /*return*/, createResponse(200, result.Item)];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting contact:', error_2);
                return [2 /*return*/, createResponse(500, { error: 'Failed to get contact' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Create new contact
module.exports.create = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, contact, params, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = JSON.parse(event.body);
                if (!data.name || !data.type) {
                    return [2 /*return*/, createResponse(400, { error: 'Name and type are required' })];
                }
                contact = {
                    id: uuidv4(),
                    type: data.type, // 'client', 'frac', 'custom'
                    name: data.name,
                    email: data.email || '',
                    phone: data.phone || '',
                    phone2: data.phone2 || '',
                    company: data.company || '',
                    rig: data.rig || '',
                    job_title: data.job_title || '',
                    location: data.location || '',
                    client_name: data.client_name || '',
                    well_name: data.well_name || '',
                    notes: data.notes || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: data.created_by || 'system',
                };
                params = {
                    TableName: CONTACTS_TABLE,
                    Item: contact,
                };
                return [4 /*yield*/, dynamodb.put(params).promise()];
            case 1:
                _a.sent();
                return [2 /*return*/, createResponse(201, contact)];
            case 2:
                error_3 = _a.sent();
                console.error('Error creating contact:', error_3);
                return [2 /*return*/, createResponse(500, { error: 'Failed to create contact' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Update contact
module.exports.update = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, data_1, updateExpressions_1, expressionAttributeNames_1, expressionAttributeValues_1, fieldsToUpdate, params, result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                data_1 = JSON.parse(event.body);
                updateExpressions_1 = [];
                expressionAttributeNames_1 = {};
                expressionAttributeValues_1 = {};
                fieldsToUpdate = [
                    'type', 'name', 'email', 'phone', 'phone2',
                    'company', 'rig', 'job_title', 'location',
                    'client_name', 'well_name', 'notes'
                ];
                fieldsToUpdate.forEach(function (field) {
                    if (data_1[field] !== undefined) {
                        var attrName = field === 'type' || field === 'name' ? "#".concat(field) : field;
                        if (field === 'type' || field === 'name') {
                            expressionAttributeNames_1["#".concat(field)] = field;
                        }
                        updateExpressions_1.push("".concat(attrName, " = :").concat(field));
                        expressionAttributeValues_1[":".concat(field)] = data_1[field];
                    }
                });
                if (updateExpressions_1.length === 0) {
                    return [2 /*return*/, createResponse(400, { error: 'No fields to update' })];
                }
                // Always update timestamp
                updateExpressions_1.push('updated_at = :updated_at');
                expressionAttributeValues_1[':updated_at'] = new Date().toISOString();
                params = {
                    TableName: CONTACTS_TABLE,
                    Key: { id: id },
                    UpdateExpression: "SET ".concat(updateExpressions_1.join(', ')),
                    ExpressionAttributeValues: expressionAttributeValues_1,
                    ReturnValues: 'ALL_NEW',
                };
                if (Object.keys(expressionAttributeNames_1).length > 0) {
                    params.ExpressionAttributeNames = expressionAttributeNames_1;
                }
                return [4 /*yield*/, dynamodb.update(params).promise()];
            case 1:
                result = _a.sent();
                return [2 /*return*/, createResponse(200, result.Attributes)];
            case 2:
                error_4 = _a.sent();
                console.error('Error updating contact:', error_4);
                return [2 /*return*/, createResponse(500, { error: 'Failed to update contact' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Delete contact
module.exports.delete = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var id, params, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = event.pathParameters.id;
                params = {
                    TableName: CONTACTS_TABLE,
                    Key: { id: id },
                };
                return [4 /*yield*/, dynamodb.delete(params).promise()];
            case 1:
                _a.sent();
                return [2 /*return*/, createResponse(200, { message: 'Contact deleted successfully' })];
            case 2:
                error_5 = _a.sent();
                console.error('Error deleting contact:', error_5);
                return [2 /*return*/, createResponse(500, { error: 'Failed to delete contact' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=contacts.js.map