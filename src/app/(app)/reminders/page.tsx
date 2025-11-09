'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge';
import type { Reminder } from '@/lib/types';
import {
  Plus,
  Star,
  Clock,
  Repeat,
  ShieldAlert,
  MoreVertical,
  Trash,
  Edit
} from 'lucide-react';
import RemindersLoading from './loading';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


const FREE_TIER_LIMIT = 5;

export default function RemindersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);


  const remindersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/reminders`);
  }, [user, firestore]);
  
  const { data: reminders, isLoading } = useCollection<Reminder>(remindersQuery);

  const isAtFreeTierLimit = useMemo(() => {
    // TODO: Add check for user's subscription status
    const isFreeTier = user?.subscriptionStatus === 'free';
    return isFreeTier && reminders && reminders.length >= FREE_TIER_LIMIT;
  }, [reminders, user]);

  const handleDeleteReminder = () => {
    if (!reminderToDelete || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete reminder."
        });
        setReminderToDelete(null);
        return;
    }
    const docRef = doc(firestore, `users/${user.uid}/reminders/${reminderToDelete.id}`);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Reminder Deleted",
        description: `"${reminderToDelete.title}" has been removed.`
    });
    setReminderToDelete(null);
  };


  if (isUserLoading || (isLoading && !reminders)) {
    return <RemindersLoading />;
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Welcome to Contextual Reminders</CardTitle>
                    <CardDescription>Please log in to see and manage your reminders.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold">Your Reminders</h1>
        <Button asChild disabled={!!isAtFreeTierLimit}>
          <Link href="/reminders/new">
            <Plus />
            New Reminder
          </Link>
        </Button>
      </div>
      
       {isAtFreeTierLimit && (
         <Card className="border-primary/50 bg-primary/10">
          <CardHeader className="flex-row items-center gap-4 space-y-0">
             <ShieldAlert className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-primary">Free Tier Limit Reached</CardTitle>
              <CardDescription className="text-primary/80">
                You have reached your limit of {FREE_TIER_LIMIT} reminders. Please upgrade for unlimited reminders.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}


       {reminders && reminders.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {reminders.sort((a, b) => b.createdDate.toMillis() - a.createdDate.toMillis()).map((reminder) => (
              <Card key={reminder.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-headline text-lg font-semibold">{reminder.title}</CardTitle>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/reminders/edit/${reminder.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setReminderToDelete(reminder)} className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{reminder.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                 {reminder.triggerTimestamp && (
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-normal">
                                {formatDistanceToNow(reminder.triggerTimestamp.toDate(), { addSuffix: true })}
                            </span>
                        </Badge>
                      </div>
                  )}
                </CardContent>
                <CardFooter>
                  {reminder.repeatRules && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Repeat className="h-4 w-4" />
                      <span>{reminder.repeatRules}</span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
       ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <h3 className="text-xl font-semibold tracking-tight">No Reminders Yet</h3>
            <p className="mt-2 text-muted-foreground">
                You haven&apos;t created any reminders. Let&apos;s create one!
            </p>
            <Button className="mt-4" asChild>
                 <Link href="/reminders/new">
                    <Plus />
                    Create New Reminder
                </Link>
            </Button>
        </div>
       )}

      <AlertDialog open={!!reminderToDelete} onOpenChange={(open) => !open && setReminderToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the reminder "{reminderToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReminder}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
