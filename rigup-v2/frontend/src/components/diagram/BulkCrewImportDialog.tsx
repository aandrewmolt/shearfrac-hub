import React, { useState, useMemo } from 'react';
import { Check, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Contact, ShiftType } from '@/contacts/types';
import { cn } from '@/lib/utils';

interface BulkCrewImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onImportContacts: (contacts: Partial<Contact>[]) => void;
  jobName: string;
  client: string;
}

interface CrewMember {
  id: string;
  name: string;
  title: string;
  shift: ShiftType;
  selected: boolean;
}

export function BulkCrewImportDialog({
  open,
  onOpenChange,
  contacts,
  onImportContacts,
  jobName,
  client,
}: BulkCrewImportDialogProps) {
  const [importMode, setImportMode] = useState<'crew' | 'company' | 'template'>('crew');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCrew, setSelectedCrew] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [templateType, setTemplateType] = useState<'client' | 'frac'>('client');

  // Get unique frac companies and crews
  const { fracCompanies, crews } = useMemo(() => {
    const companies = new Set<string>();
    const crewsByCompany = new Map<string, Set<string>>();

    contacts.forEach(contact => {
      if (contact.type === 'frac' && contact.company) {
        companies.add(contact.company);
        
        if (contact.crew) {
          if (!crewsByCompany.has(contact.company)) {
            crewsByCompany.set(contact.company, new Set());
          }
          crewsByCompany.get(contact.company)!.add(contact.crew);
        }
      }
    });

    return {
      fracCompanies: companies ? Array.from(companies).sort() : [],
      crews: selectedCompany && crewsByCompany ? Array.from(crewsByCompany.get(selectedCompany) || []).sort() : [],
    };
  }, [contacts, selectedCompany]);

  // Get crew members based on selection
  const crewMembers = useMemo((): CrewMember[] => {
    if (importMode === 'crew' && selectedCompany && selectedCrew) {
      return contacts
        .filter(c => 
          c.type === 'frac' && 
          c.company === selectedCompany && 
          c.crew === selectedCrew
        )
        .map(c => ({
          id: c.id,
          name: c.name,
          title: 'title' in c ? c.title : '',
          shift: 'shift' in c ? c.shift as ShiftType : 'days',
          selected: true,
        }));
    } else if (importMode === 'company' && selectedCompany) {
      return contacts
        .filter(c => c.type === 'frac' && c.company === selectedCompany)
        .map(c => ({
          id: c.id,
          name: c.name,
          title: 'title' in c ? c.title : '',
          shift: 'shift' in c ? c.shift as ShiftType : 'days',
          selected: selectedMembers.has(c.id),
        }));
    }
    return [];
  }, [importMode, selectedCompany, selectedCrew, contacts, selectedMembers]);

  const handleSelectAll = () => {
    if (selectedMembers.size === crewMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(crewMembers.map(m => m.id)));
    }
  };

  const handleToggleMember = (memberId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMembers(newSet);
  };

  const handleImport = () => {
    if (importMode === 'template') {
      const templates: Partial<Contact>[] = [];
      
      if (templateType === 'client') {
        // Add Company Man templates
        templates.push(
          {
            type: 'client',
            name: '',
            title: 'Company Man',
            company: client,
            job: jobName,
            shift: 'days',
            phoneNumber: '',
            email: '',
          },
          {
            type: 'client',
            name: '',
            title: 'Company Man',
            company: client,
            job: jobName,
            shift: 'nights',
            phoneNumber: '',
            email: '',
          }
        );
      } else {
        // Add Frac crew templates
        templates.push(
          {
            type: 'frac',
            name: '',
            title: 'Engineer',
            company: '',
            crew: '',
            job: jobName,
            shift: 'days',
            phone: '',
            email: '',
          },
          {
            type: 'frac',
            name: '',
            title: 'E-Tech',
            company: '',
            crew: '',
            job: jobName,
            shift: 'days',
            phone: '',
            email: '',
          },
          {
            type: 'frac',
            name: '',
            title: 'Engineer',
            company: '',
            crew: '',
            job: jobName,
            shift: 'nights',
            phone: '',
            email: '',
          },
          {
            type: 'frac',
            name: '',
            title: 'E-Tech',
            company: '',
            crew: '',
            job: jobName,
            shift: 'nights',
            phone: '',
            email: '',
          }
        );
      }
      
      onImportContacts(templates);
    } else {
      // Import selected crew members
      const selectedContacts = crewMembers
        .filter(m => importMode === 'crew' ? true : selectedMembers.has(m.id))
        .map(m => contacts.find(c => c.id === m.id))
        .filter((c): c is Contact => c !== undefined);
      
      onImportContacts(selectedContacts);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Import existing contacts or create templates for {jobName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Mode Selection */}
          <div className="space-y-2">
            <Label>Import Type</Label>
            <Select value={importMode} onValueChange={(v) => setImportMode(v as 'clear' | 'merge')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crew">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Import Entire Crew
                  </div>
                </SelectItem>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Select from Company
                  </div>
                </SelectItem>
                <SelectItem value="template">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Create Templates
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mode-specific content */}
          {importMode === 'template' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={templateType} onValueChange={(v) => setTemplateType(v as 'drilling' | 'completions' | 'workover' | 'coil-tubing')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client Templates (2 Company Men)</SelectItem>
                    <SelectItem value="frac">Frac Templates (2 Engineers, 2 E-Techs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-card p-4 rounded">
                <p className="text-sm font-medium mb-2">Will create:</p>
                {templateType === 'client' ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Company Man (Day Shift) - {client}</li>
                    <li>• Company Man (Night Shift) - {client}</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Engineer (Day Shift)</li>
                    <li>• E-Tech (Day Shift)</li>
                    <li>• Engineer (Night Shift)</li>
                    <li>• E-Tech (Night Shift)</li>
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Company Selection */}
              <div className="space-y-2">
                <Label>Frac Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fracCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Crew Selection (for crew mode) */}
              {importMode === 'crew' && selectedCompany && (
                <div className="space-y-2">
                  <Label>Crew</Label>
                  <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crew..." />
                    </SelectTrigger>
                    <SelectContent>
                      {crews.map(crew => (
                        <SelectItem key={crew} value={crew}>
                          {crew}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Member List */}
              {crewMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {importMode === 'crew' ? 'Crew Members' : 'Select Contacts'}
                    </Label>
                    {importMode === 'company' && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedMembers.size === crewMembers.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                  
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <div className="space-y-2">
                      {crewMembers.map(member => (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded hover:bg-muted",
                            importMode === 'company' && !selectedMembers.has(member.id) && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {importMode === 'company' && (
                              <Checkbox
                                checked={selectedMembers.has(member.id)}
                                onCheckedChange={() => handleToggleMember(member.id)}
                              />
                            )}
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.title}</p>
                            </div>
                          </div>
                          <Badge variant={member.shift === 'days' ? 'default' : 'secondary'}>
                            {member.shift === 'off' ? 'Time-Off' : member.shift.charAt(0).toUpperCase() + member.shift.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={
              importMode !== 'template' && 
              (importMode === 'crew' ? !selectedCrew : selectedMembers.size === 0)
            }
          >
            {importMode === 'template' ? 'Create Templates' : `Import ${importMode === 'crew' ? crewMembers.length : selectedMembers.size} Contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}