'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, serverTimestamp } from 'firebase/firestore';
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
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Reminder } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  notificationMessage: z.string().min(1, 'Notification message is required'),
  repeatRules: z.string().optional(),
  triggerTimestamp: z.date().optional(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;


function EditReminderSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-sm mt-2" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
             <div className="flex justify-end mt-8">
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    )
}

function EditReminderForm({ reminder }: { reminder: Reminder & {id: string} }) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: reminder.title,
      description: reminder.description,
      notificationMessage: reminder.notificationMessage,
      repeatRules: reminder.repeatRules || 'Never',
      triggerTimestamp: reminder.triggerTimestamp ? reminder.triggerTimestamp.toDate() : undefined,
    },
  });

  const onSubmit = async (values: ReminderFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update a reminder.',
      });
      return;
    }

    try {
      const reminderRef = doc(firestore, `users/${user.uid}/reminders`, reminder.id);
      
      const reminderData: Partial<Reminder> & { lastModifiedDate: any } = {
        title: values.title,
        description: values.description,
        notificationMessage: values.notificationMessage,
        lastModifiedDate: serverTimestamp(),
        triggerTimestamp: values.triggerTimestamp || null,
        repeatRules: values.repeatRules === 'Never' ? '' : values.repeatRules,
      };

      setDocumentNonBlocking(reminderRef, reminderData, { merge: true });

      toast({
        title: 'Reminder Updated',
        description: `Your reminder "${values.title}" has been saved.`,
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not update your reminder. Please try again.',
      });
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Reminder Details</CardTitle>
                    <CardDescription>Make changes to your reminder below.</CardDescription>
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
                                    <Textarea placeholder="e.g., Milk, bread, eggs..." {...field} value={field.value ?? ''} />
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

            <div className="flex justify-end mt-8">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    </Form>
  )
}

export default function EditReminderPage() {
  const params = useParams();
  const reminderId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const reminderDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !reminderId) return null;
    return doc(firestore, `users/${user.uid}/reminders`, reminderId);
  }, [user, firestore, reminderId]);

  const { data: reminder, isLoading, error } = useDoc<Reminder>(reminderDocRef);
  const router = useRouter();


  if (isLoading) {
    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
            </div>
            <EditReminderSkeleton />
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive">Error loading reminder: {error.message}</p>
  }

  if (!reminder) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <p className="text-lg font-semibold">Reminder not found</p>
            <p className="text-muted-foreground mt-2">This reminder could not be found or you do not have permission to view it.</p>
            <Button onClick={() => router.push('/reminders')} className="mt-4">Go to Reminders</Button>
        </div>
     )
  }


  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/reminders">
                <ArrowLeft />
                <span className="sr-only">Back to Reminders</span>
            </Link>
         </Button>
        <div>
            <h1 className="font-headline text-2xl font-bold">Edit Reminder</h1>
            <p className="text-muted-foreground mt-1">
                Update the details of your reminder.
            </p>
        </div>
      </div>
        <EditReminderForm reminder={reminder} />
    </div>
  );
}
