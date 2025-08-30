
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { useAdvancedEquipmentSearch } from '@/hooks/useAdvancedEquipmentSearch';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobLocationIntegration } from '@/hooks/useJobLocationIntegration';

const AdvancedSearchPanel: React.FC = () => {
  const { data } = useInventory();
  const { getLocationName } = useJobLocationIntegration();
  const {
    searchFilters,
    searchResults,
    updateFilter,
    clearFilters,
    getFilterSummary,
    hasActiveFilters,
    resultCount
  } = useAdvancedEquipmentSearch();

  const categories = [...new Set(data.equipmentTypes.map(t => t.category))];
  const statuses = ['available', 'deployed', 'red-tagged', 'maintenance', 'retired'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Equipment Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Search */}
          <div>
            <Label>Search Equipment</Label>
            <Input
              placeholder="Search by name, ID, serial number, notes..."
              value={searchFilters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={searchFilters.category} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={searchFilters.status} onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Select value={searchFilters.location} onValueChange={(value) => updateFilter('location', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {data.storageLocations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipment Type</Label>
              <Select value={searchFilters.equipmentType} onValueChange={(value) => updateFilter('equipmentType', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {data.equipmentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="individual-only"
                checked={searchFilters.showIndividualOnly}
                onCheckedChange={(checked) => updateFilter('showIndividualOnly', checked)}
              />
              <Label htmlFor="individual-only">Individual equipment only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-only"
                checked={searchFilters.showBulkOnly}
                onCheckedChange={(checked) => updateFilter('showBulkOnly', checked)}
              />
              <Label htmlFor="bulk-only">Bulk equipment only</Label>
            </div>
          </div>

          {/* Filter Summary and Clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                {getFilterSummary().map((filter, index) => (
                  <Badge key={index} variant="secondary">
                    {filter}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <Badge variant="outline">{resultCount} items found</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="mx-auto h-8 w-8 mb-2" />
              <p>No equipment matches your search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item) => {
                const equipmentType = data.equipmentTypes.find(t => t.id === item.typeId);
                const locationName = getLocationName(item.locationId);
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.displayName}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Type: {equipmentType?.name} • Category: {equipmentType?.category}</p>
                        <p>Location: {locationName} • Status: {item.status}</p>
                        {item.type === 'bulk' && <p>Quantity: {item.quantity}</p>}
                        {item.serialNumber && <p>Serial: {item.serialNumber}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={item.type === 'individual' ? 'default' : 'secondary'}>
                        {item.type === 'individual' ? 'Individual' : 'Bulk'}
                      </Badge>
                      <Badge variant={
                        item.status === 'available' ? 'default' :
                        item.status === 'deployed' ? 'secondary' :
                        item.status === 'red-tagged' ? 'destructive' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSearchPanel;
