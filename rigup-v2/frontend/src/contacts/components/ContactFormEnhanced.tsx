import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnhancedCombobox } from './EnhancedCombobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Contact, ContactType, ShiftType } from '../types';
import { useTursoJobs } from '../hooks/useTursoJobs';
import { 
  getUniqueTitles, 
  getUniqueCompanies, 
  getUniqueCrews
} from '../utils/contactHelpers';

const baseSchema = z.object({
  id: z.string().optional(),
  notes: z.string().optional(),
});

const clientSchema = baseSchema.extend({
  type: z.literal('client'),
  title: z.string().min(1, 'Title is required'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  job: z.string().min(1, 'Job is required'),
  shift: z.enum(['days', 'nights', 'off']).optional(),
  crew: z.string().optional(),
  dateOfRotation: z.string().optional(),
});

const fracSchema = baseSchema.extend({
  type: z.literal('frac'),
  company: z.string().min(1, 'Company is required'),
  crew: z.string().min(1, 'Crew is required'),
  name: z.string().min(1, 'Name is required'),
  shift: z.enum(['days', 'nights', 'off']).optional(),
  title: z.string().min(1, 'Title is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  job: z.string().min(1, 'Job is required'),
  dateOfRotation: z.string().optional(),
});

const customSchema = baseSchema.extend({
  type: z.string().min(1), // Any string type (coldbore, wireline, etc.)
  company: z.string().min(1, 'Company is required'),
  crew: z.string().min(1, 'Crew is required'),
  name: z.string().min(1, 'Name is required'),
  shift: z.enum(['days', 'nights', 'off']).optional(),
  title: z.string().min(1, 'Title is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  job: z.string().min(1, 'Job is required'),
  dateOfRotation: z.string().optional(),
});

const contactSchema = z.union([
  clientSchema,
  fracSchema,
  customSchema,
]);

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormEnhancedProps {
  contact?: Contact;
  contactType: ContactType | string;
  customTypes: string[];
  existingContacts: Contact[];
  open: boolean;
  onClose: () => void;
  onSubmit: (contact: Contact) => void;
}

export function ContactFormEnhanced({
  contact,
  contactType,
  customTypes,
  existingContacts,
  open,
  onClose,
  onSubmit,
}: ContactFormEnhancedProps) {
  const isCustom = contactType !== 'client' && contactType !== 'frac';
  const effectiveType = contact?.type || contactType;

  const { jobs, getJobsByClient, getClients, loading: jobsLoading } = useTursoJobs();
  const [selectedCompany, setSelectedCompany] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {
      type: effectiveType as ContactType,
    },
  });

  const watchType = watch('type');
  const watchCompany = watch('company');

  // Get unique values from existing contacts
  const uniqueTitles = useMemo(() => getUniqueTitles(existingContacts), [existingContacts]);
  const uniqueCompanies = useMemo(() => getUniqueCompanies(existingContacts), [existingContacts]);
  const uniqueCrews = useMemo(() => getUniqueCrews(existingContacts), [existingContacts]);
  
  // Get companies from both Turso jobs and existing contacts
  const allCompanies = useMemo(() => {
    const contactCompanies = getUniqueCompanies(existingContacts) || [];
    const jobClients = getClients() || [];
    const allCompanies = [...(contactCompanies || []), ...(jobClients || [])];
    return allCompanies.length > 0 ? [...new Set(allCompanies)].sort() : [];
  }, [existingContacts, getClients]);

  // Get all jobs (not filtered by company)
  const availableJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      console.log('No jobs available in ContactFormEnhanced');
      return [];
    }
    
    // Check the actual type being used
    const typeToCheck = watchType || effectiveType;
    console.log('Type check:', { watchType, effectiveType, typeToCheck });
    
    // For non-client contacts (frac, coldbore, etc), show ALL jobs
    // For client contacts, show only their jobs
    if (typeToCheck === 'client' && watchCompany) {
      return getJobsByClient(watchCompany);
    }
    
    // For all other contact types, show all jobs
    console.log('Available jobs for non-client contact:', jobs);
    return jobs.map(job => job.name);
  }, [watchType, effectiveType, watchCompany, getJobsByClient, jobs]);

  useEffect(() => {
    if (contact) {
      reset(contact);
      setSelectedCompany(contact.company);
    } else {
      reset({
        type: effectiveType as ContactType,
      });
    }
  }, [contact, effectiveType, reset]);

  useEffect(() => {
    if (watchCompany !== selectedCompany) {
      setSelectedCompany(watchCompany);
    }
  }, [watchCompany, selectedCompany]);

  // Debug effect to log jobs
  useEffect(() => {
    console.log('ContactFormEnhanced Debug:', {
      jobsLoading,
      jobsLength: jobs?.length,
      jobs,
      contactType,
      effectiveType,
      watchType,
      availableJobs
    });
  }, [jobs, jobsLoading, contactType, effectiveType, watchType, availableJobs]);

  const onFormSubmit = (data: ContactFormData) => {
    const now = new Date();
    const completeContact: Contact = {
      ...data,
      id: data.id || uuidv4(),
      lastUpdatedDate: now.toISOString(),
      lastUpdatedTime: now.toLocaleTimeString(),
    } as Contact;

    onSubmit(completeContact);
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
          <DialogDescription>
            {contact ? 'Update the contact information below.' : 'Fill in the contact details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <input type="hidden" {...register('type')} />

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                {...register('name')}
                className="col-span-3"
              />
              {errors.name && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <div className="col-span-3">
                <EnhancedCombobox
                  value={watch('company') || ''}
                  options={allCompanies}
                  placeholder="Select or type company/client"
                  onSelect={(value) => {
                    setValue('company', value);
                    // Only reset job if it's a client contact type
                    if (watchType === 'client') {
                      setValue('job', '');
                    }
                  }}
                />
              </div>
              {errors.company && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="crew" className="text-right">
                Crew
              </Label>
              <div className="col-span-3">
                <EnhancedCombobox
                  value={watch('crew') || ''}
                  options={uniqueCrews}
                  placeholder="Select or type crew"
                  onSelect={(value) => setValue('crew', value)}
                />
              </div>
              {errors.crew && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.crew.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                <EnhancedCombobox
                  value={watch('title') || ''}
                  options={uniqueTitles}
                  placeholder="Select or type title"
                  onSelect={(value) => setValue('title', value)}
                />
              </div>
              {errors.title && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                className="col-span-3"
              />
              {errors.phone && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="col-span-3"
              />
              {errors.email && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="job" className="text-right">
                Job
              </Label>
              <div className="col-span-3">
                {jobsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading jobs...
                  </p>
                ) : availableJobs && availableJobs.length > 0 ? (
                  <EnhancedCombobox
                    value={watch('job') || ''}
                    options={availableJobs}
                    placeholder={watchType === 'client' ? "Select your job" : "Select any job to assign this contact to"}
                    onSelect={(value) => setValue('job', value)}
                    allowCustom={false}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No jobs found in the job mapper.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please create a job in the Cable Jobs section first.
                    </p>
                  </div>
                )}
              </div>
              {errors.job && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.job.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shift" className="text-right">
                Shift
              </Label>
              <Select
                value={watch('shift')}
                onValueChange={(value) => setValue('shift', value as ShiftType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="nights">Nights</SelectItem>
                  <SelectItem value="off">Time-Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateOfRotation" className="text-right">
                Date of Rotation
              </Label>
              <Input
                id="dateOfRotation"
                type="date"
                {...register('dateOfRotation')}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {contact ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}