'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { mockReminderTemplates } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  notificationMessage: z.string().min(1, 'Notification message is required'),
  repeatRules: z.string().optional(),
  triggerTimestamp: z.date().optional(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;
type ReminderTemplate = Omit<ReminderFormValues, 'triggerTimestamp' | 'repeatRules'>;


export default function NewReminderPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      description: '',
      notificationMessage: '',
      repeatRules: 'Never',
    },
  });

  const handleTemplateClick = (template: ReminderTemplate) => {
    form.setValue('title', template.title);
    form.setValue('description', template.description || '');
    form.setValue('notificationMessage', template.notificationMessage);
  };

  const onSubmit = async (values: ReminderFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a reminder.',
      });
      return;
    }

    try {
      const remindersCol = collection(firestore, `users/${user.uid}/reminders`);
      const reminderData: any = {
        title: values.title,
        description: values.description || '',
        notificationMessage: values.notificationMessage,
        userId: user.uid,
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
        triggerIds: [],
        priority: 3,
        repeatRules: values.repeatRules === 'Never' ? '' : values.repeatRules,
      };

      // Only add triggerTimestamp if it's a valid date
      if (values.triggerTimestamp) {
        reminderData.triggerTimestamp = Timestamp.fromDate(values.triggerTimestamp);
      } else {
        // Explicitly ensure it's not in the object if not set
        delete reminderData.triggerTimestamp;
      }


      await addDocumentNonBlocking(remindersCol, reminderData);

      toast({
        title: 'Reminder Created',
        description: `Your reminder "${values.title}" has been saved.`,
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save your reminder. Please try again.',
      });
    }
  };

  const resetForm = () => {
    form.reset({
      title: '',
      description: '',
      notificationMessage: '',
      repeatRules: 'Never',
      triggerTimestamp: undefined,
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/reminders">
                <ArrowLeft />
                <span className="sr-only">Back to Reminders</span>
            </Link>
         </Button>
        <div>
            <h1 className="font-headline text-2xl font-bold">New Reminder</h1>
            <p className="text-muted-foreground mt-1">
                Fill out the details below or start with a template.
            </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'><Sparkles className='w-5 h-5 text-primary' /> Quick Start Templates</CardTitle>
            <CardDescription>Click a template to populate the form below.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2">
                {mockReminderTemplates.map((template) => (
                    <Button key={template.title} variant="outline" onClick={() => handleTemplateClick(template)}>
                        {template.title}
                    </Button>
                ))}
            </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Reminder Details</CardTitle>
                    <CardDescription>Provide the core information for your reminder.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Pick up groceries" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Milk, bread, eggs..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="notificationMessage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notification Message</FormLabel>
                                <FormControl>
                                    <Input placeholder="Time to go to the store!" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is the text that will appear in the notification.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="triggerTimestamp"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Trigger Time (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0,0,0,0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Set a date for your reminder to trigger.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="repeatRules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select how often this reminder should repeat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Never">Never</SelectItem>
                              <SelectItem value="Every day">Every day</SelectItem>
                              <SelectItem value="Every week">Every week</SelectItem>
                              <SelectItem value="Every 2 weeks">Every 2 weeks</SelectItem>
                              <SelectItem value="Once a month">Once a month</SelectItem>
                              <SelectItem value="Every year">Every year</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={resetForm} disabled={form.formState.isSubmitting}>
                    Clear
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Reminder'}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
