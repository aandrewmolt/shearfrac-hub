
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useJobs } from '@/hooks/useJobs';
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateJob: (jobData: { name: string; client: string; pad: string; wellCount: number; hasWellsideGauge: boolean }) => void;
}

const JobCreationDialog: React.FC<JobCreationDialogProps> = ({ 
  open, 
  onOpenChange, 
  onCreateJob 
}) => {
  const [newJobPad, setNewJobPad] = useState('');
  const [newJobClient, setNewJobClient] = useState('');
  const [newJobWells, setNewJobWells] = useState('1');
  const [hasWellsideGauge, setHasWellsideGauge] = useState(false);
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState('');
  
  const { jobs } = useJobs();
  
  // Reset search value when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setClientSearchValue('');
      setClientComboOpen(false);
    }
  }, [open]);
  
  // Get unique clients from existing jobs
  const existingClients = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const clients = (jobs || [])
      .map(job => job.client)
      .filter((client): client is string => !!client);
    return clients.length > 0 ? [...new Set(clients)].sort() : [];
  }, [jobs]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearchValue.trim()) return existingClients;
    const searchLower = clientSearchValue.toLowerCase();
    return (existingClients || []).filter(client => 
      client && client.toLowerCase().includes(searchLower)
    );
  }, [existingClients, clientSearchValue]);

  const createJob = () => {
    if (!newJobClient.trim()) {
      toast.error('Please select or enter a client');
      return;
    }
    
    if (!newJobPad.trim()) {
      toast.error('Please enter a pad name');
      return;
    }

    const wellCount = parseInt(newJobWells);
    if (wellCount < 0 || wellCount > 10) {
      toast.error('Wells must be between 0 and 10');
      return;
    }

    // Create job name as "Client - Pad"
    const jobName = `${newJobClient.trim()} - ${newJobPad.trim()}`;

    onCreateJob({
      name: jobName,
      client: newJobClient.trim(),
      pad: newJobPad.trim(),
      wellCount: wellCount,
      hasWellsideGauge,
    });
    
    setNewJobPad('');
    setNewJobClient('');
    setNewJobWells('1');
    setHasWellsideGauge(false);
    setClientSearchValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientComboOpen}
                  className="w-full justify-between mt-1"
                >
                  {newJobClient || "Select or create client..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search or type new client..." 
                    value={clientSearchValue}
                    onValueChange={(value) => {
                      setClientSearchValue(value);
                      if (!existingClients.some(client => client.toLowerCase() === value.toLowerCase())) {
                        setNewJobClient(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && clientSearchValue.trim()) {
                        e.preventDefault();
                        e.stopPropagation();
                        // If there's an exact match, select it
                        const exactMatch = existingClients.find(client => 
                          client.toLowerCase() === clientSearchValue.trim().toLowerCase()
                        );
                        if (exactMatch) {
                          setNewJobClient(exactMatch);
                        } else {
                          // If no match, use the new value
                          setNewJobClient(clientSearchValue.trim());
                        }
                        setClientSearchValue('');
                        setClientComboOpen(false);
                      }
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setNewJobClient(clientSearchValue);
                          setClientSearchValue('');
                          setClientComboOpen(false);
                        }}
                      >
                        Create "{clientSearchValue}"
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredClients && Array.isArray(filteredClients) && filteredClients.map((client) => (
                        <CommandItem
                          key={client}
                          value={client}
                          onSelect={(currentValue) => {
                            setNewJobClient(currentValue);
                            setClientSearchValue('');
                            setClientComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newJobClient === client ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {client}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="padName">Pad Name</Label>
            <Input
              id="padName"
              value={newJobPad}
              onChange={(e) => setNewJobPad(e.target.value)}
              placeholder="e.g. Mohawk 1, Green Beret 24..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wellCount">Number of Wells</Label>
            <Select value={newJobWells} onValueChange={setNewJobWells}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select number of wells" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(11)].map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? 'Well' : 'Wells'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wellsideGauge"
              checked={hasWellsideGauge}
              onCheckedChange={(checked) => setHasWellsideGauge(checked as boolean)}
            />
            <Label htmlFor="wellsideGauge">Include Wellside Gauge</Label>
          </div>
          <Button onClick={createJob} className="w-full">
            Create Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobCreationDialog;
