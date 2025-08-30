import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  RowSelectionState,
  ExpandedState,
  getExpandedRowModel,
  HeaderContext,
  CellContext,
} from '@tanstack/react-table';
import { 
  ArrowUpDown, 
  ChevronDown, 
  GripVertical, 
  MoreHorizontal,
  Phone,
  Mail,
  Copy,
  Download,
  Trash2,
  Edit,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Contact, ContactColumn } from '../types';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactsTableEnhancedProps {
  contacts: Contact[];
  columns: ContactColumn[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onColumnOrderChange?: (columns: ContactColumn[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function ContactsTableEnhanced({
  contacts,
  columns,
  onEdit,
  onDelete,
  onColumnOrderChange,
  onBulkDelete,
}: ContactsTableEnhancedProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    type: false, // Hide type column by default
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.sort((a, b) => (a.order || 0) - (b.order || 0)).map(col => col.id)
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pageSize, setPageSize] = useState(10);

  // Helper functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportToCsv = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : contacts;
    
    const headers = columns.filter(col => col.visible !== false).map(col => col.label).join(',');
    const rows = dataToExport.map(contact => 
      columns.filter(col => col.visible !== false).map(col => {
        const value = contact[col.key as keyof Contact];
        return value ? `"${value}"` : '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Contacts exported to CSV');
  };

  const tableColumns = useMemo<ColumnDef<Contact>[]>(() => {
    const baseColumns: ColumnDef<Contact>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'expand',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : null;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ];

    const dataColumns = columns
      .filter(col => col.visible !== false)
      .map((col) => ({
        id: col.id,
        accessorKey: col.key,
        header: ({ column }: HeaderContext<Contact, unknown>) => {
          if (!col.sortable) return col.label;
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {col.label}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }: CellContext<Contact, unknown>) => {
          const value = row.getValue(col.id);
          
          // Special rendering for different fields
          if (col.key === 'shift' && value) {
            const shiftColors = {
              days: 'bg-muted text-foreground',
              nights: 'bg-muted text-foreground',
              off: 'bg-muted text-foreground',
            };
            return (
              <Badge className={cn('capitalize', shiftColors[value as keyof typeof shiftColors])}>
                {value === 'off' ? 'Time-Off' : (value as string)}
              </Badge>
            );
          }
          
          if (col.key === 'email' && value) {
            return (
              <div className="flex items-center gap-2">
                <a href={`mailto:${value}`} className="text-foreground hover:underline">
                  {value as string}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(value as string)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            );
          }
          
          if (col.key === 'phone' && value) {
            return (
              <div className="flex items-center gap-2">
                <a href={`tel:${value}`} className="text-foreground hover:underline">
                  {value as string}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(value as string)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            );
          }
          
          if (col.key === 'lastUpdatedDate' && value) {
            return new Date(value as string).toLocaleDateString();
          }
          
          if (col.key === 'type') {
            const contact = row.original;
            const typeLabel = contact.type;
            const getTypeColor = (type: string) => {
              switch (type) {
                case 'client':
                  return 'bg-muted text-foreground';
                case 'frac':
                  return 'bg-muted text-purple-800';
                default:
                  return 'bg-muted text-foreground';
              }
            };
            return (
              <Badge className={cn('capitalize', getTypeColor(contact.type))}>
                {typeLabel}
              </Badge>
            );
          }
          
          return value as string;
        },
      }));

    const actionsColumn: ColumnDef<Contact> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contact = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyToClipboard(contact.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              {contact.email && (
                <DropdownMenuItem onClick={() => window.location.href = `mailto:${contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
              )}
              {contact.phone && (
                <DropdownMenuItem onClick={() => window.location.href = `tel:${contact.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(contact.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    };

    return [...baseColumns, ...dataColumns, actionsColumn];
  }, [columns, onEdit, onDelete]);

  const table = useReactTable({
    data: contacts,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      columnOrder,
      rowSelection,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: () => undefined,
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Input
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedIds = Object.keys(rowSelection).map(idx => 
                      contacts[parseInt(idx)]?.id
                    ).filter(Boolean);
                    onBulkDelete?.(selectedIds);
                    setRowSelection({});
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(row.getIsExpanded() && "border-b-0")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={tableColumns.length} className="bg-muted/50">
                          <div className="p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Contact Details
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              {Object.entries(row.original).map(([key, value]) => {
                                if (!value || key === 'id') return null;
                                return (
                                  <div key={key}>
                                    <span className="font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>{' '}
                                    <span className="text-muted-foreground">{value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}