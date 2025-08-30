/**
 * Diagram Lambda Handlers
 * Manages job diagrams with equipment assignments
 * Ensures equipment codes (SS01, CT03) are properly displayed on nodes
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
var dynamodb = new AWS.DynamoDB.DocumentClient();
var DIAGRAMS_TABLE = process.env.DIAGRAMS_TABLE;
var JOBS_TABLE = process.env.JOBS_TABLE;
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
// Get diagram for a job
module.exports.get = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var jobId, params, result, diagram, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                jobId = event.pathParameters.id;
                params = {
                    TableName: DIAGRAMS_TABLE,
                    Key: { jobId: jobId },
                };
                return [4 /*yield*/, dynamodb.get(params).promise()];
            case 1:
                result = _a.sent();
                if (!result.Item) {
                    return [2 /*return*/, createResponse(200, {
                            jobId: jobId,
                            nodes: [],
                            edges: [],
                            equipmentAssignment: {},
                            message: 'No diagram found for this job'
                        })];
                }
                diagram = __assign(__assign({}, result.Item), { nodes: (result.Item.nodes || []).map(function (node) {
                        // Ensure equipment IDs are displayed on nodes
                        if (node.data) {
                            // For main box nodes
                            if (node.data.equipmentId) {
                                node.data.displayId = node.data.equipmentId; // Show SS01, CT03, etc.
                                node.data.label = node.data.equipmentId;
                            }
                            // For satellite nodes
                            if (node.data.satelliteId) {
                                node.data.displayId = node.data.satelliteId;
                                node.data.label = node.data.satelliteId;
                            }
                            // For gauge nodes
                            if (node.data.gaugeId) {
                                node.data.displayId = node.data.gaugeId;
                                node.data.label = node.data.gaugeId;
                            }
                            // For computer nodes with equipment
                            if (node.data.computerId) {
                                node.data.displayId = node.data.computerId;
                                node.data.label = node.data.computerName || node.data.computerId;
                            }
                            // For well nodes with gauges
                            if (node.data.wellGaugeId) {
                                node.data.displayId = node.data.wellGaugeId;
                                node.data.gaugeLabel = node.data.wellGaugeId;
                            }
                        }
                        return node;
                    }) });
                return [2 /*return*/, createResponse(200, diagram)];
            case 2:
                error_1 = _a.sent();
                console.error('Error getting diagram:', error_1);
                return [2 /*return*/, createResponse(500, { error: 'Failed to get diagram' })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Save or update diagram
module.exports.save = function (event) { return __awaiter(_this, void 0, void 0, function () {
    var jobId, data_1, processedNodes, diagram, diagramParams, jobUpdateParams, error_2;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 3, , 4]);
                jobId = event.pathParameters.id;
                data_1 = JSON.parse(event.body);
                processedNodes = (data_1.nodes || []).map(function (node) {
                    var _a, _b, _c, _d, _e, _f, _g;
                    if (node.data) {
                        // Preserve equipment assignments with their codes
                        var nodeData = __assign({}, node.data);
                        // Main box equipment
                        if ((_a = data_1.equipmentAssignment) === null || _a === void 0 ? void 0 : _a.mainBox) {
                            if (node.type === 'shearstreamBox' || node.id === 'mainBox') {
                                nodeData.equipmentId = data_1.equipmentAssignment.mainBox;
                                nodeData.displayId = data_1.equipmentAssignment.mainBox;
                                nodeData.label = data_1.equipmentAssignment.mainBox;
                            }
                        }
                        // Satellite equipment
                        if ((_b = data_1.equipmentAssignment) === null || _b === void 0 ? void 0 : _b.satellite) {
                            if (node.type === 'satellite' || node.id === 'satellite') {
                                nodeData.satelliteId = data_1.equipmentAssignment.satellite;
                                nodeData.displayId = data_1.equipmentAssignment.satellite;
                                nodeData.label = data_1.equipmentAssignment.satellite;
                            }
                        }
                        // Starlink equipment
                        if ((_c = data_1.equipmentAssignment) === null || _c === void 0 ? void 0 : _c.starlinks) {
                            var starlinkId = Object.keys(data_1.equipmentAssignment.starlinks)
                                .find(function (key) { var _a; return key === node.id || key === ((_a = node.data) === null || _a === void 0 ? void 0 : _a.starlinkId); });
                            if (starlinkId) {
                                nodeData.equipmentId = data_1.equipmentAssignment.starlinks[starlinkId];
                                nodeData.displayId = data_1.equipmentAssignment.starlinks[starlinkId];
                                nodeData.label = data_1.equipmentAssignment.starlinks[starlinkId];
                            }
                        }
                        // Customer computers
                        if ((_d = data_1.equipmentAssignment) === null || _d === void 0 ? void 0 : _d.customerComputers) {
                            var computerId = Object.keys(data_1.equipmentAssignment.customerComputers)
                                .find(function (key) { var _a; return key === node.id || key === ((_a = node.data) === null || _a === void 0 ? void 0 : _a.computerId); });
                            if (computerId) {
                                nodeData.computerId = data_1.equipmentAssignment.customerComputers[computerId];
                                nodeData.displayId = data_1.equipmentAssignment.customerComputers[computerId];
                                nodeData.label = ((_e = node.data) === null || _e === void 0 ? void 0 : _e.computerName) ||
                                    data_1.equipmentAssignment.customerComputers[computerId];
                            }
                        }
                        // Well gauges
                        if ((_f = data_1.equipmentAssignment) === null || _f === void 0 ? void 0 : _f.wellGauges) {
                            var wellId = Object.keys(data_1.equipmentAssignment.wellGauges)
                                .find(function (key) { var _a; return key === node.id || ((_a = node.id) === null || _a === void 0 ? void 0 : _a.includes(key)); });
                            if (wellId) {
                                nodeData.wellGaugeId = data_1.equipmentAssignment.wellGauges[wellId];
                                nodeData.displayId = data_1.equipmentAssignment.wellGauges[wellId];
                                nodeData.gaugeLabel = data_1.equipmentAssignment.wellGauges[wellId];
                            }
                        }
                        // Y-adapters
                        if (((_g = data_1.equipmentAssignment) === null || _g === void 0 ? void 0 : _g.yAdapters) && node.type === 'yAdapter') {
                            var yAdapterIndex = data_1.equipmentAssignment.yAdapters
                                .findIndex(function (_, idx) { return node.id === "yAdapter-".concat(idx); });
                            if (yAdapterIndex >= 0) {
                                nodeData.equipmentId = data_1.equipmentAssignment.yAdapters[yAdapterIndex];
                                nodeData.displayId = data_1.equipmentAssignment.yAdapters[yAdapterIndex];
                                nodeData.label = data_1.equipmentAssignment.yAdapters[yAdapterIndex];
                            }
                        }
                        node.data = nodeData;
                    }
                    return node;
                });
                diagram = {
                    jobId: jobId,
                    nodes: processedNodes,
                    edges: data_1.edges || [],
                    equipmentAssignment: data_1.equipmentAssignment || {},
                    cableConfiguration: data_1.cableConfiguration || {},
                    updated_at: new Date().toISOString(),
                    // Store equipment codes at diagram level for quick access
                    mainBoxId: ((_a = data_1.equipmentAssignment) === null || _a === void 0 ? void 0 : _a.mainBox) || null,
                    satelliteId: ((_b = data_1.equipmentAssignment) === null || _b === void 0 ? void 0 : _b.satellite) || null,
                    wellsideGaugeId: ((_c = data_1.equipmentAssignment) === null || _c === void 0 ? void 0 : _c.wellsideGauge) || null,
                    starlinkIds: ((_d = data_1.equipmentAssignment) === null || _d === void 0 ? void 0 : _d.starlinks) || {},
                    customerComputerIds: ((_e = data_1.equipmentAssignment) === null || _e === void 0 ? void 0 : _e.customerComputers) || {},
                    wellGaugeIds: ((_f = data_1.equipmentAssignment) === null || _f === void 0 ? void 0 : _f.wellGauges) || {},
                    yAdapterIds: ((_g = data_1.equipmentAssignment) === null || _g === void 0 ? void 0 : _g.yAdapters) || [],
                };
                diagramParams = {
                    TableName: DIAGRAMS_TABLE,
                    Item: diagram,
                };
                return [4 /*yield*/, dynamodb.put(diagramParams).promise()];
            case 1:
                _h.sent();
                jobUpdateParams = {
                    TableName: JOBS_TABLE,
                    Key: { id: jobId },
                    UpdateExpression: "SET \n        equipment_assignment = :equipment_assignment,\n        main_box_id = :main_box_id,\n        satellite_id = :satellite_id,\n        wellside_gauge_id = :wellside_gauge_id,\n        nodes = :nodes,\n        edges = :edges,\n        updated_at = :updated_at",
                    ExpressionAttributeValues: {
                        ':equipment_assignment': data_1.equipmentAssignment || {},
                        ':main_box_id': diagram.mainBoxId,
                        ':satellite_id': diagram.satelliteId,
                        ':wellside_gauge_id': diagram.wellsideGaugeId,
                        ':nodes': processedNodes,
                        ':edges': data_1.edges || [],
                        ':updated_at': new Date().toISOString(),
                    },
                };
                return [4 /*yield*/, dynamodb.update(jobUpdateParams).promise()];
            case 2:
                _h.sent();
                return [2 /*return*/, createResponse(200, {
                        message: 'Diagram saved successfully',
                        diagram: diagram,
                    })];
            case 3:
                error_2 = _h.sent();
                console.error('Error saving diagram:', error_2);
                return [2 /*return*/, createResponse(500, { error: 'Failed to save diagram' })];
            case 4: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=diagrams.js.map