import React from 'react';
import { X, Filter, Users, Building2, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ContactFilterChipsProps {
  typeCounts: Record<string, number>;
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  onClearAll: () => void;
  customTypes: string[];
}

export function ContactFilterChips({
  typeCounts,
  selectedTypes,
  onTypeToggle,
  onClearAll,
  customTypes,
}: ContactFilterChipsProps) {
  const allTypes = ['client', 'frac', ...new Set(customTypes)];
  const totalContacts = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
  const filteredCount = selectedTypes.length > 0 
    ? selectedTypes.reduce((sum, type) => sum + (typeCounts[type] || 0), 0)
    : totalContacts;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Building2 className="h-3 w-3" />;
      case 'frac':
        return <HardHat className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-muted text-foreground hover:bg-success/20 border-border';
      case 'frac':
        return 'bg-muted text-accent hover:bg-accent/20 border-accent';
      default:
        return 'bg-muted text-foreground hover:bg-warning/20 border-border';
    }
  };

  return (
    <Card className="flex items-center gap-4 p-4 bg-muted">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Showing {filteredCount} of {totalContacts} contacts
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        {/* Quick filter chips */}
        <div className="flex flex-wrap gap-2">
          {allTypes.map(type => {
            const count = typeCounts[type] || 0;
            const isSelected = selectedTypes.includes(type);
            
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => onTypeToggle(type)}
                className={cn(
                  "h-8 px-3 gap-2 transition-all",
                  isSelected ? getTypeColor(type) : "hover:bg-muted"
                )}
              >
                {getTypeIcon(type)}
                <span className="capitalize">{type}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs",
                    isSelected ? "bg-card/20" : ""
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Advanced filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Filter className="h-3 w-3" />
              Filters
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Contact Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allTypes.map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => onTypeToggle(type)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {typeCounts[type] || 0}
                  </Badge>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters */}
      {selectedTypes.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active:</span>
          <div className="flex gap-1">
            {selectedTypes.map(type => (
              <Badge
                key={type}
                variant="secondary"
                className={cn("gap-1 pr-1", getTypeColor(type))}
              >
                <span className="capitalize">{type}</span>
                <Button
                  onClick={() => onTypeToggle(type)}
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0.5 hover:bg-foreground/10 rounded"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </Card>
  );
}