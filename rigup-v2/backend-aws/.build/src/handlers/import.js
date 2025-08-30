/**
 * Import Lambda Handler
 * Imports data from S3 backups
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
var s3 = new AWS.S3();
var dynamodb = new AWS.DynamoDB.DocumentClient();
var STORAGE_BUCKET = process.env.STORAGE_BUCKET;
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
// Import data from S3
module.exports.importData = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var type, data, params, s3Result, importData, imported, _a, _i, _b, job, _c, _d, diagram, _e, _f, item, tables, _g, _h, _j, key, tableName, _k, _l, item, error_1;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                _m.trys.push([0, 25, , 26]);
                type = event.pathParameters.type;
                data = event.body ? JSON.parse(event.body) : {};
                if (!data.key) {
                    return [2 /*return*/, createResponse(400, { error: 'S3 key is required for import' })];
                }
                params = {
                    Bucket: STORAGE_BUCKET,
                    Key: data.key,
                };
                return [4 /*yield*/, s3.getObject(params).promise()];
            case 1:
                s3Result = _m.sent();
                importData = JSON.parse(s3Result.Body.toString());
                imported = 0;
                _a = type;
                switch (_a) {
                    case 'jobs': return [3 /*break*/, 2];
                    case 'equipment': return [3 /*break*/, 11];
                    case 'full': return [3 /*break*/, 16];
                }
                return [3 /*break*/, 23];
            case 2:
                if (!importData.jobs) return [3 /*break*/, 6];
                _i = 0, _b = importData.jobs;
                _m.label = 3;
            case 3:
                if (!(_i < _b.length)) return [3 /*break*/, 6];
                job = _b[_i];
                return [4 /*yield*/, dynamodb.put({
                        TableName: process.env.JOBS_TABLE,
                        Item: job,
                    }).promise()];
            case 4:
                _m.sent();
                imported++;
                _m.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                if (!importData.diagrams) return [3 /*break*/, 10];
                _c = 0, _d = importData.diagrams;
                _m.label = 7;
            case 7:
                if (!(_c < _d.length)) return [3 /*break*/, 10];
                diagram = _d[_c];
                return [4 /*yield*/, dynamodb.put({
                        TableName: process.env.DIAGRAMS_TABLE,
                        Item: diagram,
                    }).promise()];
            case 8:
                _m.sent();
                _m.label = 9;
            case 9:
                _c++;
                return [3 /*break*/, 7];
            case 10: return [3 /*break*/, 24];
            case 11:
                if (!importData.equipment) return [3 /*break*/, 15];
                _e = 0, _f = importData.equipment;
                _m.label = 12;
            case 12:
                if (!(_e < _f.length)) return [3 /*break*/, 15];
                item = _f[_e];
                return [4 /*yield*/, dynamodb.put({
                        TableName: process.env.EQUIPMENT_TABLE,
                        Item: item,
                    }).promise()];
            case 13:
                _m.sent();
                imported++;
                _m.label = 14;
            case 14:
                _e++;
                return [3 /*break*/, 12];
            case 15: return [3 /*break*/, 24];
            case 16:
                tables = {
                    jobs: process.env.JOBS_TABLE,
                    diagrams: process.env.DIAGRAMS_TABLE,
                    equipment: process.env.EQUIPMENT_TABLE,
                    contacts: process.env.CONTACTS_TABLE,
                    clients: process.env.CLIENTS_TABLE,
                    deployments: process.env.DEPLOYMENTS_TABLE,
                };
                _g = 0, _h = Object.entries(tables);
                _m.label = 17;
            case 17:
                if (!(_g < _h.length)) return [3 /*break*/, 22];
                _j = _h[_g], key = _j[0], tableName = _j[1];
                if (!(importData[key] && Array.isArray(importData[key]))) return [3 /*break*/, 21];
                _k = 0, _l = importData[key];
                _m.label = 18;
            case 18:
                if (!(_k < _l.length)) return [3 /*break*/, 21];
                item = _l[_k];
                return [4 /*yield*/, dynamodb.put({
                        TableName: tableName,
                        Item: item,
                    }).promise()];
            case 19:
                _m.sent();
                imported++;
                _m.label = 20;
            case 20:
                _k++;
                return [3 /*break*/, 18];
            case 21:
                _g++;
                return [3 /*break*/, 17];
            case 22: return [3 /*break*/, 24];
            case 23: return [2 /*return*/, createResponse(400, { error: 'Invalid import type' })];
            case 24: return [2 /*return*/, createResponse(200, {
                    message: 'Import successful',
                    imported: imported,
                    source: data.key,
                })];
            case 25:
                error_1 = _m.sent();
                console.error('Error importing data:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to import data' })];
            case 26: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=import.js.map