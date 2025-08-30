import React, { useMemo } from 'react';
import { Contact } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Phone, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsGroupedViewProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

// Generate consistent colors for companies
function getCompanyColor(company: string): string {
  const colors = [
    'bg-muted border-border text-blue-900',
    'bg-muted border-border text-green-900',
    'bg-muted border-purple-300 text-purple-900',
    'bg-muted border-border text-yellow-900',
    'bg-pink-100 border-pink-300 text-pink-900',
    'bg-indigo-100 border-indigo-300 text-indigo-900',
    'bg-muted border-red-300 text-red-900',
    'bg-muted border-border text-orange-900',
    'bg-teal-100 border-teal-300 text-teal-900',
    'bg-cyan-100 border-cyan-300 text-cyan-900',
  ];
  
  const hash = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function ContactsGroupedView({ contacts, onEdit, onDelete }: ContactsGroupedViewProps) {
  // Group contacts by company and then by crew
  const groupedContacts = useMemo(() => {
    const groups = new Map<string, Map<string, Contact[]>>();
    
    contacts.forEach(contact => {
      const company = contact.company;
      const crew = 'crew' in contact ? contact.crew : 'No Crew';
      
      if (!groups.has(company)) {
        groups.set(company, new Map());
      }
      
      const companyGroup = groups.get(company)!;
      if (!companyGroup.has(crew)) {
        companyGroup.set(crew, []);
      }
      
      companyGroup.get(crew)!.push(contact);
    });
    
    return groups;
  }, [contacts]);

  return (
    <div className="space-y-6">
      {Array.from(groupedContacts.entries()).map(([company, crews]) => {
        const companyColorClass = getCompanyColor(company);
        const totalContacts = Array.from(crews.values()).reduce((sum, contacts) => sum + contacts.length, 0);
        
        return (
          <Card key={company} className={cn("border-2", companyColorClass)}>
            <CardHeader className={cn("pb-3", companyColorClass.replace('100', '50'))}>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span>{company}</span>
                  <Badge variant="secondary" className="ml-2">
                    {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {Array.from(crews.entries()).map(([crew, crewContacts]) => (
                <div key={`${company}-${crew}`} className="mb-4 last:mb-0">
                  {crew !== 'No Crew' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-muted-foreground">Crew: {crew}</span>
                      <Badge variant="outline" className="text-xs">
                        {crewContacts.length}
                      </Badge>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crewContacts.map(contact => (
                      <Card
                        key={contact.id}
                        className="p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">{contact.name}</h4>
                            {'title' in contact && contact.title && (
                              <p className="text-sm text-muted-foreground">{contact.title}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onEdit(contact)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => onDelete(contact.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${contact.phone}`} className="hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${contact.email}`} className="hover:underline truncate">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {'dateOfRotation' in contact && contact.dateOfRotation && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Rotation: {new Date(contact.dateOfRotation).toLocaleDateString()}</span>
                            </div>
                          )}
                          {contact.shift && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                contact.shift === 'days' && "bg-muted text-foreground border-border",
                                contact.shift === 'nights' && "bg-muted text-foreground border-border",
                                contact.shift === 'off' && "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {contact.shift === 'off' ? 'Time-Off' : contact.shift}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}