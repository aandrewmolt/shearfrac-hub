import React, { useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Contact, ContactType, ShiftType } from '../types';

const baseSchema = z.object({
  id: z.string().optional(),
  notes: z.string().optional(),
});

const clientSchema = baseSchema.extend({
  type: z.literal('client'),
  title: z.string().min(1, 'Title is required'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
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
  shift: z.enum(['days', 'nights', 'off']),
  title: z.string().min(1, 'Title is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  job: z.string().min(1, 'Job is required'),
  dateOfRotation: z.string().optional(),
});

const customSchema = baseSchema.extend({
  type: z.literal('custom'),
  customType: z.string().min(1, 'Custom type is required'),
  company: z.string().min(1, 'Company is required'),
  crew: z.string().min(1, 'Crew is required'),
  name: z.string().min(1, 'Name is required'),
  shift: z.enum(['days', 'nights', 'off']),
  title: z.string().min(1, 'Title is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  job: z.string().min(1, 'Job is required'),
  dateOfRotation: z.string().optional(),
});

const contactSchema = z.discriminatedUnion('type', [
  clientSchema,
  fracSchema,
  customSchema,
]);

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  contactType: ContactType | string;
  customTypes: string[];
  open: boolean;
  onClose: () => void;
  onSubmit: (contact: Contact) => void;
}

export function ContactForm({
  contact,
  contactType,
  customTypes,
  open,
  onClose,
  onSubmit,
}: ContactFormProps) {
  const isCustom = contactType !== 'client' && contactType !== 'frac';
  const actualType = isCustom ? 'custom' : contactType;

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
      type: actualType as ContactType,
      customType: isCustom ? contactType : undefined,
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    if (contact) {
      reset(contact);
    } else {
      reset({
        type: actualType as ContactType,
        customType: isCustom ? contactType : undefined,
      });
    }
  }, [contact, actualType, contactType, isCustom, reset]);

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
          <div className="grid gap-4 py-4">
            <input type="hidden" {...register('type')} />
            
            {watchType === 'custom' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customType" className="text-right">
                  Type
                </Label>
                <Select
                  value={watch('customType')}
                  onValueChange={(value) => setValue('customType', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select custom type" />
                  </SelectTrigger>
                  <SelectContent>
                    {customTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {watchType === 'client' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    className="col-span-3"
                  />
                  {errors.title && (
                    <p className="col-start-2 col-span-3 text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>
              </>
            )}

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
              <Input
                id="company"
                {...register('company')}
                className="col-span-3"
              />
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
              <Input
                id="crew"
                {...register('crew')}
                className="col-span-3"
              />
              {errors.crew && (
                <p className="col-start-2 col-span-3 text-sm text-red-500">
                  {errors.crew.message}
                </p>
              )}
            </div>

            {(watchType === 'frac' || watchType === 'custom') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  className="col-span-3"
                />
                {errors.title && (
                  <p className="col-start-2 col-span-3 text-sm text-red-500">
                    {errors.title.message}
                  </p>
                )}
              </div>
            )}

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
              <Input
                id="job"
                {...register('job')}
                className="col-span-3"
              />
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