/**
 * Clients Lambda Handlers
 * Manages client names for job creation
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
var dynamodb = new AWS.DynamoDB.DocumentClient();
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
// List all clients
module.exports.list = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var params, result, clients, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                params = {
                    TableName: CLIENTS_TABLE,
                };
                return [4 /*yield*/, dynamodb.scan(params).promise()];
            case 1:
                result = _a.sent();
                clients = result.Items.sort(function (a, b) {
                    return (a.name || '').localeCompare(b.name || '');
                });
                return [2 /*return*/, createResponse(200, clients)];
            case 2:
                error_1 = _a.sent();
                console.error('Error listing clients:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to list clients' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Create new client
module.exports.create = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var data, clientId, client, params, error_2, getParams, existing, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                data = JSON.parse(event.body);
                if (!data.name) {
                    return [2 /*return*/, createResponse(400, { error: 'Client name is required' })];
                }
                clientId = data.name.toLowerCase().replace(/\s+/g, '-');
                client = {
                    id: clientId,
                    name: data.name,
                    pads: data.pads || [], // Array of pad names for this client
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                params = {
                    TableName: CLIENTS_TABLE,
                    Item: client,
                    ConditionExpression: 'attribute_not_exists(id)',
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 6]);
                return [4 /*yield*/, dynamodb.put(params).promise()];
            case 2:
                _a.sent();
                return [2 /*return*/, createResponse(201, client)];
            case 3:
                error_2 = _a.sent();
                if (!(error_2.code === 'ConditionalCheckFailedException')) return [3 /*break*/, 5];
                getParams = {
                    TableName: CLIENTS_TABLE,
                    Key: { id: clientId },
                };
                return [4 /*yield*/, dynamodb.get(getParams).promise()];
            case 4:
                existing = _a.sent();
                return [2 /*return*/, createResponse(200, existing.Item)];
            case 5: throw error_2;
            case 6: return [3 /*break*/, 8];
            case 7:
                error_3 = _a.sent();
                console.error('Error creating client:', error_3);
                return [2 /*return*/, createResponse(500, { error: 'Failed to create client' })];
            case 8: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=clients.js.map