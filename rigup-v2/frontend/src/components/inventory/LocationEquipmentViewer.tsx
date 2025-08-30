
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Briefcase, Package, Search, Filter } from 'lucide-react';
import { useJobLocationIntegration } from '@/hooks/useJobLocationIntegration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LocationEquipmentViewer: React.FC = () => {
  const { 
    allLocations, 
    getEquipmentSummaryByLocation, 
    getEquipmentByLocation,
    isJobLocation 
  } = useJobLocationIntegration();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'storage' | 'job'>('all');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const filteredLocations = allLocations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'storage' && location.locationType === 'storage') ||
      (filterType === 'job' && location.locationType === 'job');
    
    return matchesSearch && matchesFilter;
  });

  const toggleLocationExpansion = (locationId: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cables': return 'bg-muted text-foreground';
      case 'gauges': return 'bg-muted text-foreground';
      case 'adapters': return 'bg-muted text-foreground';
      case 'communication': return 'bg-muted text-accent';
      case 'power': return 'bg-muted text-foreground';
      default: return 'bg-card text-corporate-light';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(value: unknown) => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterType === 'all' ? 'All Locations' : 
                 filterType === 'storage' ? 'Storage Only' : 'Jobs Only'}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="storage">Storage Locations</SelectItem>
            <SelectItem value="job">Job Sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => {
          const equipmentSummary = getEquipmentSummaryByLocation(location.id);
          const { totalItems } = getEquipmentByLocation(location.id);
          const isExpanded = expandedLocations.has(location.id);
          const locationIsJob = isJobLocation(location.id);

          return (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {locationIsJob ? (
                      <Briefcase className="h-4 w-4 text-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-foreground" />
                    )}
                    <span className="truncate">{location.name}</span>
                  </div>
                  <Badge variant={locationIsJob ? "default" : "secondary"} className="text-xs">
                    {locationIsJob ? 'Job' : 'Storage'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-corporate-silver" />
                    <span className="text-sm text-corporate-silver">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {equipmentSummary.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLocationExpansion(location.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {isExpanded ? 'Hide' : 'Show'} Details
                    </Button>
                  )}
                </div>

                {isExpanded && equipmentSummary.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    {equipmentSummary.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          <span className="truncate">{item.typeName}</span>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!isExpanded && equipmentSummary.length > 0 && (
                  <div className="text-xs text-corporate-silver">
                    {equipmentSummary.length} equipment type{equipmentSummary.length !== 1 ? 's' : ''}
                  </div>
                )}

                {equipmentSummary.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">
                    No equipment at this location
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-corporate-silver">No locations found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LocationEquipmentViewer;
