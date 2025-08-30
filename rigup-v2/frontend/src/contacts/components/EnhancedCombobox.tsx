import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';

interface EnhancedComboboxProps {
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  allowCustom?: boolean;
  className?: string;
}

export function EnhancedCombobox({
  value,
  options,
  placeholder,
  onSelect,
  allowCustom = true,
  className,
}: EnhancedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue('');
    setShowCustomInput(false);
  }, [open]);

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setOpen(false);
    setInputValue('');
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (inputValue.trim()) {
      handleSelect(inputValue.trim());
    }
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className={cn(
            "truncate",
            !value && "text-muted-foreground"
          )}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command ref={commandRef}>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim() && allowCustom) {
                e.preventDefault();
                e.stopPropagation();
                // If there's an exact match, select it
                const exactMatch = options.find(opt => opt.toLowerCase() === inputValue.trim().toLowerCase());
                if (exactMatch) {
                  handleSelect(exactMatch);
                } else if (!options.includes(inputValue.trim())) {
                  // If no match and it's a new value, create it
                  handleSelect(inputValue.trim());
                }
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom ? (
                <div className="p-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    No matching options found.
                  </p>
                  {inputValue.trim() && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setShowCustomInput(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{inputValue}"
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center py-6 text-muted-foreground">
                  No results found.
                </p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option}</span>
                </CommandItem>
              ))}
              {allowCustom && inputValue.trim() && !options.includes(inputValue.trim()) && (
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue.trim())}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create "{inputValue.trim()}"</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        {showCustomInput && (
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter custom value..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSubmit();
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                disabled={!inputValue.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}