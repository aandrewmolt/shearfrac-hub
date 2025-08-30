
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Briefcase, Home } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';

interface EquipmentListFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterLocation: string;
  setFilterLocation: (location: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  data: {
    storageLocations: unknown[];
    equipmentTypes: unknown[];
  };
  onClearFilters: () => void;
  getCategoryColor: (category: string) => string;
}

const EquipmentListFilters: React.FC<EquipmentListFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterLocation,
  setFilterLocation,
  filterCategory,
  setFilterCategory,
  data,
  onClearFilters,
  getCategoryColor,
}) => {
  const { jobs } = useJobs();
  const uniqueCategories = [...new Set((data?.equipmentTypes || []).map(type => type.category))];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="deployed">Deployed</SelectItem>
            <SelectItem value="red-tagged">Red Tagged</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {/* Storage Locations */}
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Storage Locations</div>
            {(data?.storageLocations || []).map(location => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex items-center gap-2">
                  <Home className="h-3 w-3" />
                  {location.name}
                </div>
              </SelectItem>
            ))}
            {/* Jobs */}
            {jobs.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Jobs</div>
                {(jobs || []).map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      {job.name}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>
                <Badge className={getCategoryColor(category)}>
                  {category}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default EquipmentListFilters;
