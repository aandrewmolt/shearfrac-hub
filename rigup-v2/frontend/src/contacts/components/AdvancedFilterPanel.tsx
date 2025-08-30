import React, { useState, useMemo } from 'react';
import { Calendar, X, Users, Building2, Briefcase, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Contact } from '../types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface AdvancedFilters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  companies: string[];
  jobs: string[];
  shifts: string[];
  hasEmail: boolean | null;
  hasPhone: boolean | null;
  lastUpdatedDays?: number;
}

interface AdvancedFilterPanelProps {
  contacts: Contact[];
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedFilterPanel({
  contacts,
  filters,
  onFiltersChange,
  open,
  onOpenChange,
}: AdvancedFilterPanelProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(filters.dateRange.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(filters.dateRange.to);

  // Extract unique values from contacts
  const uniqueValues = useMemo(() => {
    const companies = new Set<string>();
    const jobs = new Map<string, { company: string; count: number }>();
    
    contacts.forEach(contact => {
      if (contact.company) {
        companies.add(contact.company);
      }
      if (contact.job && contact.company) {
        const jobKey = `${contact.company} - ${contact.job}`;
        if (jobs.has(jobKey)) {
          jobs.get(jobKey)!.count++;
        } else {
          jobs.set(jobKey, { company: contact.company, count: 1 });
        }
      }
    });

    return {
      companies: companies && companies.size > 0 ? Array.from(companies).sort() : [],
      jobs: jobs && jobs.size > 0 ? Array.from(jobs.entries()).map(([key, data]) => ({
        key,
        label: key,
        company: data.company,
        count: data.count
      })).sort((a, b) => b.count - a.count) : [],
    };
  }, [contacts]);

  const handleCompanyToggle = (company: string) => {
    const updated = filters.companies.includes(company)
      ? filters.companies.filter(c => c !== company)
      : [...filters.companies, company];
    
    onFiltersChange({ ...filters, companies: updated });
  };

  const handleJobToggle = (jobKey: string) => {
    const updated = filters.jobs.includes(jobKey)
      ? filters.jobs.filter(j => j !== jobKey)
      : [...filters.jobs, jobKey];
    
    onFiltersChange({ ...filters, jobs: updated });
  };

  const handleShiftToggle = (shift: string) => {
    const updated = filters.shifts.includes(shift)
      ? filters.shifts.filter(s => s !== shift)
      : [...filters.shifts, shift];
    
    onFiltersChange({ ...filters, shifts: updated });
  };

  const handleDateRangeChange = () => {
    onFiltersChange({
      ...filters,
      dateRange: { from: dateFrom, to: dateTo }
    });
  };

  const clearAllFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({
      dateRange: {},
      companies: [],
      jobs: [],
      shifts: [],
      hasEmail: null,
      hasPhone: null,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.companies.length > 0) count++;
    if (filters.jobs.length > 0) count++;
    if (filters.shifts.length > 0) count++;
    if (filters.hasEmail !== null) count++;
    if (filters.hasPhone !== null) count++;
    if (filters.lastUpdatedDays) count++;
    return count;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Apply advanced filters to find specific contacts
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last Updated Date Range
            </Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button size="sm" onClick={handleDateRangeChange} className="w-full">
              Apply Date Range
            </Button>
          </div>

          {/* Companies Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies ({uniqueValues.companies.length})
            </Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {uniqueValues.companies.map(company => (
                <div key={company} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company}`}
                    checked={filters.companies.includes(company)}
                    onCheckedChange={() => handleCompanyToggle(company)}
                  />
                  <Label
                    htmlFor={`company-${company}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {company}
                  </Label>
                </div>
              ))}
            </div>
            {filters.companies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.companies.map(company => (
                  <Badge key={company} variant="secondary" className="text-xs">
                    {company}
                    <Button
                      onClick={() => handleCompanyToggle(company)}
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 hover:bg-gray-300 rounded"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Jobs Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs ({uniqueValues.jobs.length})
            </Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
              {uniqueValues.jobs.map(({ key, label, count }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-${key}`}
                    checked={filters.jobs.includes(key)}
                    onCheckedChange={() => handleJobToggle(key)}
                  />
                  <Label
                    htmlFor={`job-${key}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Shifts Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Shifts
            </Label>
            <div className="flex flex-wrap gap-2">
              {['days', 'nights', 'off'].map(shift => (
                <div key={shift} className="flex items-center space-x-2">
                  <Checkbox
                    id={`shift-${shift}`}
                    checked={filters.shifts.includes(shift)}
                    onCheckedChange={() => handleShiftToggle(shift)}
                  />
                  <Label
                    htmlFor={`shift-${shift}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {shift === 'off' ? 'Time-Off' : shift}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Contact Information</Label>
            <div className="space-y-2">
              <Select
                value={filters.hasEmail === null ? 'any' : filters.hasEmail.toString()}
                onValueChange={(value) => {
                  const hasEmail = value === 'any' ? null : value === 'true';
                  onFiltersChange({ ...filters, hasEmail });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Email status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="true">Has Email</SelectItem>
                  <SelectItem value="false">No Email</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.hasPhone === null ? 'any' : filters.hasPhone.toString()}
                onValueChange={(value) => {
                  const hasPhone = value === 'any' ? null : value === 'true';
                  onFiltersChange({ ...filters, hasPhone });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Phone status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="true">Has Phone</SelectItem>
                  <SelectItem value="false">No Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Last Updated Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Last Updated</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Today', days: 1 },
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 },
              ].map(({ label, days }) => (
                <Button
                  key={days}
                  variant={filters.lastUpdatedDays === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      lastUpdatedDays: filters.lastUpdatedDays === days ? undefined : days
                    });
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-6 border-t">
          <Button onClick={clearAllFilters} variant="outline" className="flex-1">
            Clear All
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}