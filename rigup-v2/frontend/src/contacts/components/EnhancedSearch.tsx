import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Clock, X, ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contact } from '../types';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  value: string;
  type: 'name' | 'company' | 'job' | 'email' | 'phone';
  count: number;
}

interface EnhancedSearchProps {
  contacts: Contact[];
  onSearch: (query: string, scope: string) => void;
  onAdvancedFilter: () => void;
  className?: string;
}

const SEARCH_SCOPES = [
  { value: 'all', label: 'All Fields' },
  { value: 'name', label: 'Names' },
  { value: 'company', label: 'Companies' },
  { value: 'job', label: 'Jobs' },
  { value: 'email', label: 'Emails' },
  { value: 'phone', label: 'Phone Numbers' },
];

export function EnhancedSearch({
  contacts,
  onSearch,
  onAdvancedFilter,
  className,
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<{ name: string; query: string; scope: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent and saved searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('contact_recent_searches');
    const saved = localStorage.getItem('contact_saved_searches');
    
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Generate search suggestions based on current query and scope
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    const suggestionMap = new Map<string, SearchSuggestion>();
    const queryLower = query.toLowerCase();

    contacts.forEach(contact => {
      const fieldsToCheck = scope === 'all' 
        ? ['name', 'company', 'job', 'email', 'phone']
        : [scope];

      fieldsToCheck.forEach(field => {
        const value = contact[field as keyof Contact] as string;
        if (value && value.toLowerCase().includes(queryLower)) {
          const key = `${field}:${value}`;
          if (suggestionMap.has(key)) {
            suggestionMap.get(key)!.count++;
          } else {
            suggestionMap.set(key, {
              value,
              type: field as 'name' | 'company' | 'job' | 'email' | 'phone',
              count: 1,
            });
          }
        }
      });
    });

    return suggestionMap && suggestionMap.size > 0 
      ? Array.from(suggestionMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 8) 
      : [];
  }, [query, scope, contacts]);

  const handleSearch = (searchQuery: string = query, searchScope: string = scope) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('contact_recent_searches', JSON.stringify(updatedRecent));
    }
    
    onSearch(searchQuery, searchScope);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    handleSearch(suggestion.value, suggestion.type);
  };

  const saveCurrentSearch = () => {
    if (!query.trim()) return;
    
    const searchName = prompt('Enter a name for this search:');
    if (searchName) {
      const newSaved = [
        ...savedSearches,
        { name: searchName, query, scope }
      ];
      setSavedSearches(newSaved);
      localStorage.setItem('contact_saved_searches', JSON.stringify(newSaved));
    }
  };

  const loadSavedSearch = (saved: { name: string; query: string; scope: string }) => {
    setQuery(saved.query);
    setScope(saved.scope);
    handleSearch(saved.query, saved.scope);
  };

  const deleteSavedSearch = (index: number) => {
    const updated = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updated);
    localStorage.setItem('contact_saved_searches', JSON.stringify(updated));
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('', scope);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {/* Search scope selector */}
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-32 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_SCOPES.map(scopeOption => (
              <SelectItem key={scopeOption.value} value={scopeOption.value}>
                {scopeOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search input with suggestions */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={`Search ${SEARCH_SCOPES.find(s => s.value === scope)?.label.toLowerCase() || 'contacts'}...`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {showSuggestions && (query.trim() || recentSearches.length > 0 || savedSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg max-h-96 overflow-y-auto">
              <Command>
                <CommandList>
                  {query.trim() && suggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={`${suggestion.type}-${suggestion.value}-${index}`}
                          onSelect={() => handleSuggestionSelect(suggestion)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{suggestion.value}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.count}
                              </Badge>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {recentSearches.length > 0 && (
                    <CommandGroup heading="Recent Searches">
                      {recentSearches.slice(0, 3).map((recent, index) => (
                        <CommandItem
                          key={`recent-${index}`}
                          onSelect={() => {
                            setQuery(recent);
                            handleSearch(recent);
                          }}
                          className="cursor-pointer"
                        >
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          {recent}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {savedSearches.length > 0 && (
                    <CommandGroup heading="Saved Searches">
                      {savedSearches.map((saved, index) => (
                        <CommandItem
                          key={`saved-${index}`}
                          onSelect={() => loadSavedSearch(saved)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-primary" />
                              <span>{saved.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedSearch(index);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {query.trim() && suggestions.length === 0 && (
                    <CommandEmpty>No suggestions found.</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {query.trim() && (
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentSearch}
              className="h-10"
            >
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvancedFilter}
            className="h-10 gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}