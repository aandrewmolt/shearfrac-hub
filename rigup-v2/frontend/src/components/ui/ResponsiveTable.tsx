import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  priority?: 'high' | 'medium' | 'low'; // For responsive hiding
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  onRowClick?: (item: T) => void;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
  }>;
  emptyMessage?: string;
  loading?: boolean;
  cardView?: boolean; // Force card view even on desktop
  getRowId: (item: T) => string;
  selectedRows?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  bulkActions?: React.ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  actions,
  emptyMessage = 'No items found',
  loading = false,
  cardView = false,
  getRowId,
  selectedRows = [],
  onSelectRow,
  bulkActions,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const showAsCards = isMobile || cardView;

  // Filter columns by priority for mobile
  const visibleColumns = React.useMemo(() => {
    if (!isMobile) return columns;
    return columns.filter(col => col.priority === 'high' || !col.priority);
  }, [columns, isMobile]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Card view for mobile
  if (showAsCards) {
    return (
      <div className="space-y-3">
        {selectedRows.length > 0 && bulkActions && (
          <div className="sticky top-0 z-10 bg-card border rounded-lg p-3 shadow-sm">
            {bulkActions}
          </div>
        )}
        
        {data.map((item) => {
          const id = getRowId(item);
          const isSelected = selectedRows.includes(id);
          
          return (
            <Card
              key={id}
              className={cn(
                "relative transition-all",
                onRowClick && "cursor-pointer hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4">
                {/* Selection checkbox */}
                {onSelectRow && (
                  <div className="absolute top-4 left-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        onSelectRow(id, checked as boolean);
                      }}
                      className="h-4 w-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                {/* Card content */}
                <div className={cn("space-y-2", onSelectRow && "pl-8")}>
                  {columns.map((column) => {
                    const value = column.render(item);
                    
                    // Skip rendering if value is null/undefined
                    if (value === null || value === undefined) return null;
                    
                    // Determine if this is the primary field (first high priority column)
                    const isPrimary = column.priority === 'high' && 
                      columns.findIndex(c => c.priority === 'high') === columns.indexOf(column);
                    
                    return (
                      <div key={column.key} className={cn(
                        "flex",
                        isPrimary ? "flex-col" : "flex-row justify-between items-start"
                      )}>
                        {!isPrimary && (
                          <span className="text-sm text-muted-foreground font-medium">
                            {column.header}:
                          </span>
                        )}
                        <div className={cn(
                          isPrimary ? "text-base font-semibold" : "text-sm text-right",
                          "flex-1"
                        )}>
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Actions */}
                {actions && actions.length > 0 && (
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, idx) => {
                          const Icon = action.icon;
                          return (
                            <DropdownMenuItem
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              className={cn(
                                action.variant === 'destructive' && "text-destructive"
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4 mr-2" />}
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                {/* Row click indicator */}
                {onRowClick && !actions && (
                  <div className="absolute top-1/2 right-4 -translate-y-1/2">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="w-full">
      {selectedRows.length > 0 && bulkActions && (
        <div className="mb-4 p-3 bg-muted border rounded-lg">
          {bulkActions}
        </div>
      )}
      
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectRow && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === data.length && data.length > 0}
                    onCheckedChange={(checked) => {
                      data.forEach(item => {
                        onSelectRow(getRowId(item), checked as boolean);
                      });
                    }}
                    className="h-4 w-4 text-foreground rounded border-border"
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.width
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-20 text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const id = getRowId(item);
              const isSelected = selectedRows.includes(id);
              
              return (
                <TableRow
                  key={id}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-muted"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {onSelectRow && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          onSelectRow(id, checked as boolean);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right"
                      )}
                    >
                      {column.render(item)}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, idx) => {
                            const Icon = action.icon;
                            return (
                              <DropdownMenuItem
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(item);
                                }}
                                className={cn(
                                  action.variant === 'destructive' && "text-destructive"
                                )}
                              >
                                {Icon && <Icon className="h-4 w-4 mr-2" />}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}