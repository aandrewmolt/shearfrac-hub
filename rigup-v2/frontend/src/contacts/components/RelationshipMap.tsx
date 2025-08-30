import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Network, Zap, Users, Eye, Filter, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Contact } from '../types';
import { 
  analyzeContactRelationships, 
  NetworkData, 
  ContactNode, 
  ContactRelationship,
  ContactCluster,
  NetworkMetrics,
  findContactPath,
  getContactInfluencers
} from '../utils/relationshipAnalysis';
import { cn } from '@/lib/utils';

interface RelationshipMapProps {
  contacts: Contact[];
  onContactSelect?: (contact: Contact) => void;
  className?: string;
}

interface ViewSettings {
  showLabels: boolean;
  showClusters: boolean;
  minStrength: number;
  layout: 'force' | 'circular' | 'hierarchical';
  nodeSize: 'connections' | 'centrality' | 'fixed';
  colorBy: 'type' | 'company' | 'cluster';
}

interface NetworkVisualizationProps {
  networkData: NetworkData;
  viewSettings: ViewSettings;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  searchQuery: string;
}

function NetworkVisualization({ 
  networkData, 
  viewSettings, 
  selectedNode, 
  onNodeSelect,
  searchQuery 
}: NetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Filter nodes and relationships based on settings
  const filteredData = useMemo(() => {
    const filteredRelationships = networkData.relationships.filter(
      rel => rel.strength >= viewSettings.minStrength
    );

    const connectedNodeIds = new Set<string>();
    filteredRelationships.forEach(rel => {
      connectedNodeIds.add(rel.source);
      connectedNodeIds.add(rel.target);
    });

    const filteredNodes = networkData.nodes.filter(node => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          node.name.toLowerCase().includes(query) ||
          node.company.toLowerCase().includes(query) ||
          node.job.toLowerCase().includes(query)
        );
      }
      return connectedNodeIds.has(node.id) || filteredRelationships.length === 0;
    });

    return { nodes: filteredNodes, relationships: filteredRelationships };
  }, [networkData, viewSettings.minStrength, searchQuery]);

  // Simple force-directed layout simulation
  const layoutData = useMemo(() => {
    const { nodes, relationships } = filteredData;
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Initialize positions
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      nodePositions.set(node.id, {
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
      });
    });

    // Simple force simulation
    for (let iteration = 0; iteration < 100; iteration++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Repulsion between all nodes
      nodes.forEach(node1 => {
        nodes.forEach(node2 => {
          if (node1.id === node2.id) return;
          
          const pos1 = nodePositions.get(node1.id)!;
          const pos2 = nodePositions.get(node2.id)!;
          
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const repulsionForce = 1000 / (distance * distance);
          const force = forces.get(node1.id)!;
          force.x += (dx / distance) * repulsionForce;
          force.y += (dy / distance) * repulsionForce;
        });
      });

      // Attraction between connected nodes
      relationships.forEach(rel => {
        const pos1 = nodePositions.get(rel.source)!;
        const pos2 = nodePositions.get(rel.target)!;
        
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const attractionForce = (distance - 100) * 0.1 * rel.strength;
        
        const force1 = forces.get(rel.source)!;
        const force2 = forces.get(rel.target)!;
        
        force1.x -= (dx / distance) * attractionForce;
        force1.y -= (dy / distance) * attractionForce;
        force2.x += (dx / distance) * attractionForce;
        force2.y += (dy / distance) * attractionForce;
      });

      // Apply forces with damping
      const damping = 0.1;
      nodes.forEach(node => {
        const pos = nodePositions.get(node.id)!;
        const force = forces.get(node.id)!;
        
        pos.x += force.x * damping;
        pos.y += force.y * damping;
        
        // Keep nodes within bounds
        pos.x = Math.max(50, Math.min(dimensions.width - 50, pos.x));
        pos.y = Math.max(50, Math.min(dimensions.height - 50, pos.y));
      });
    }

    return { nodes, relationships, positions: nodePositions };
  }, [filteredData, dimensions]);

  const getNodeSize = (node: ContactNode) => {
    switch (viewSettings.nodeSize) {
      case 'connections':
        return Math.max(8, Math.min(30, node.connectionCount * 3));
      case 'centrality':
        return Math.max(8, Math.min(30, node.centralityScore * 2));
      default:
        return 12;
    }
  };

  const getNodeColor = (node: ContactNode) => {
    switch (viewSettings.colorBy) {
      case 'type': {
        const typeColors = {
          client: '#3B82F6',
          frac: '#10B981',
          coldbore: '#F59E0B',
          default: '#6B7280'
        };
        return typeColors[node.type as keyof typeof typeColors] || typeColors.default;
      }
      case 'company':
        return networkData.clusters.find(c => c.type === 'company' && c.contacts.includes(node.id))?.color || '#6B7280';
      case 'cluster': {
        const cluster = networkData.clusters.find(c => c.contacts.includes(node.id));
        return cluster?.color || '#6B7280';
      }
      default:
        return '#6B7280';
    }
  };

  const getRelationshipColor = (rel: ContactRelationship) => {
    const colors = {
      'same-company-job': '#10B981',
      'same-company': '#3B82F6',
      'same-crew': '#F59E0B',
      'same-job-different-company': '#8B5CF6',
      'same-title': '#EC4899',
      'potential-collaboration': '#6B7280',
    };
    return colors[rel.type] || colors['potential-collaboration'];
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full border rounded-lg bg-card"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* Relationships */}
        {layoutData.relationships.map(rel => {
          const sourcePos = layoutData.positions.get(rel.source);
          const targetPos = layoutData.positions.get(rel.target);
          
          if (!sourcePos || !targetPos) return null;

          return (
            <line
              key={rel.id}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={getRelationshipColor(rel)}
              strokeWidth={Math.max(1, rel.strength)}
              opacity={0.6}
              className="hover:opacity-100 transition-opacity"
            />
          );
        })}

        {/* Clusters (if enabled) */}
        {viewSettings.showClusters && networkData.clusters.map(cluster => {
          const clusterNodes = cluster.contacts.map(id => 
            layoutData.nodes.find(n => n.id === id)
          ).filter(Boolean);
          
          if (clusterNodes.length < 2) return null;

          const positions = clusterNodes.map(node => 
            layoutData.positions.get(node!.id)!
          ).filter(Boolean);

          if (positions.length < 2) return null;

          // Create a simple convex hull approximation
          const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
          const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
          
          const maxDistance = Math.max(
            ...positions.map(pos => 
              Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2)
            )
          );

          return (
            <circle
              key={`cluster-${cluster.id}`}
              cx={centerX}
              cy={centerY}
              r={maxDistance + 30}
              fill={cluster.color}
              opacity={0.1}
              stroke={cluster.color}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Nodes */}
        {layoutData.nodes.map(node => {
          const pos = layoutData.positions.get(node.id);
          if (!pos) return null;

          const isSelected = selectedNode === node.id;
          const isHighlighted = searchQuery && (
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.job.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={getNodeSize(node)}
                fill={getNodeColor(node)}
                stroke={isSelected ? '#000' : isHighlighted ? '#F59E0B' : '#fff'}
                strokeWidth={isSelected ? 3 : isHighlighted ? 2 : 1}
                className="cursor-pointer hover:stroke-black hover:stroke-2 transition-all"
                onClick={() => onNodeSelect(isSelected ? null : node.id)}
              />
              
              {viewSettings.showLabels && (
                <text
                  x={pos.x}
                  y={pos.y + getNodeSize(node) + 12}
                  textAnchor="middle"
                  className="text-xs fill-foreground pointer-events-none"
                  fontSize="10"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Node details overlay */}
      {selectedNode && (() => {
        const node = networkData.nodes.find(n => n.id === selectedNode);
        const pos = layoutData.positions.get(selectedNode);
        
        if (!node || !pos) return null;

        return (
          <div
            className="absolute bg-card border shadow-lg rounded-lg p-3 text-sm z-10 max-w-xs"
            style={{
              left: pos.x + 20,
              top: pos.y - 40,
              transform: pos.x > dimensions.width - 200 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="font-medium">{node.name}</div>
            <div className="text-muted-foreground">{node.company}</div>
            <div className="text-muted-foreground text-xs">{node.job}</div>
            {node.title && <div className="text-muted-foreground text-xs">{node.title}</div>}
            <div className="mt-2 pt-2 border-t text-xs">
              <div>Connections: {node.connectionCount}</div>
              <div>Centrality: {node.centralityScore.toFixed(1)}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function RelationshipMap({ contacts, onContactSelect, className }: RelationshipMapProps) {
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    showLabels: true,
    showClusters: true,
    minStrength: 1,
    layout: 'force',
    nodeSize: 'connections',
    colorBy: 'type',
  });
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const networkData = useMemo(() => {
    return analyzeContactRelationships(contacts);
  }, [contacts]);

  const selectedContact = useMemo(() => {
    if (!selectedNode) return null;
    return contacts.find(c => c.id === selectedNode) || null;
  }, [selectedNode, contacts]);

  const influencers = useMemo(() => {
    if (!selectedNode) return [];
    return getContactInfluencers(selectedNode, networkData.nodes, networkData.relationships);
  }, [selectedNode, networkData]);

  const connectionPath = useMemo(() => {
    if (!selectedContact || influencers.length === 0) return [];
    return findContactPath(selectedContact.id, influencers[0].id, networkData.relationships);
  }, [selectedContact, influencers, networkData.relationships]);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNode(nodeId);
    if (nodeId && onContactSelect) {
      const contact = contacts.find(c => c.id === nodeId);
      if (contact) {
        onContactSelect(contact);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Contact Relationship Network</h3>
          <Badge variant="outline">
            {networkData.nodes.length} contacts, {networkData.relationships.length} relationships
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Visualization Settings</SheetTitle>
                <SheetDescription>
                  Customize how the relationship network is displayed
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                <div className="space-y-3">
                  <Label>Display Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showLabels"
                        checked={viewSettings.showLabels}
                        onCheckedChange={(checked) => 
                          setViewSettings(prev => ({ ...prev, showLabels: checked as boolean }))
                        }
                      />
                      <Label htmlFor="showLabels">Show contact names</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showClusters"
                        checked={viewSettings.showClusters}
                        onCheckedChange={(checked) => 
                          setViewSettings(prev => ({ ...prev, showClusters: checked as boolean }))
                        }
                      />
                      <Label htmlFor="showClusters">Show cluster regions</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Minimum Relationship Strength: {viewSettings.minStrength}</Label>
                  <Slider
                    value={[viewSettings.minStrength]}
                    onValueChange={([value]) => 
                      setViewSettings(prev => ({ ...prev, minStrength: value }))
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Node Size Based On</Label>
                  <Select
                    value={viewSettings.nodeSize}
                    onValueChange={(value: ViewSettings['nodeSize']) => 
                      setViewSettings(prev => ({ ...prev, nodeSize: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connections">Connection Count</SelectItem>
                      <SelectItem value="centrality">Centrality Score</SelectItem>
                      <SelectItem value="fixed">Fixed Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Color Nodes By</Label>
                  <Select
                    value={viewSettings.colorBy}
                    onValueChange={(value: ViewSettings['colorBy']) => 
                      setViewSettings(prev => ({ ...prev, colorBy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="type">Contact Type</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="cluster">Cluster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <NetworkVisualization
                  networkData={networkData}
                  viewSettings={viewSettings}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  searchQuery={searchQuery}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Network Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Network Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contacts:</span>
                <span>{networkData.metrics.totalContacts}</span>
              </div>
              <div className="flex justify-between">
                <span>Relationships:</span>
                <span>{networkData.metrics.totalRelationships}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Connections:</span>
                <span>{networkData.metrics.averageConnections.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Density:</span>
                <span>{(networkData.metrics.networkDensity * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Largest Cluster:</span>
                <span>{networkData.metrics.largestCluster}</span>
              </div>
              <div className="flex justify-between">
                <span>Isolated Contacts:</span>
                <span>{networkData.metrics.isolatedContacts}</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Contact Details */}
          {selectedContact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Selected Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">{selectedContact.name}</div>
                  <div className="text-muted-foreground">{selectedContact.company}</div>
                  <div className="text-muted-foreground">{selectedContact.job}</div>
                </div>
                
                {influencers.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Key Connections:</div>
                    <div className="space-y-1">
                      {influencers.slice(0, 3).map(influencer => (
                        <div 
                          key={influencer.id}
                          className="text-xs p-2 bg-muted rounded cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedNode(influencer.id)}
                        >
                          <div className="font-medium">{influencer.name}</div>
                          <div className="text-muted-foreground">{influencer.company}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clusters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {networkData.clusters.slice(0, 5).map(cluster => (
                <div key={cluster.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <span className="truncate">{cluster.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cluster.contacts.length}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}