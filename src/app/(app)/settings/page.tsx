'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Reminder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ShieldAlert, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const FREE_TIER_LIMIT = 5;

function SettingsSkeleton() {
    return (
        <div className="grid gap-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent>
                     <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}


export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const remindersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/reminders`);
    }, [user, firestore]);

    const { data: reminders, isLoading: isLoadingReminders } = useCollection<Reminder>(remindersQuery);
    
    // This would be replaced with a check against the user's actual subscription status.
    const isPremium = user?.subscriptionStatus === 'premium';
    const remindersCount = reminders?.length || 0;
    const reminderLimit = isPremium ? Infinity : FREE_TIER_LIMIT;
    const reminderProgress = (remindersCount / reminderLimit) * 100;

    const isLoading = isUserLoading || isLoadingReminders;

    const handleUpgrade = async () => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to upgrade.',
            });
            return;
        }

        const userDocRef = doc(firestore, `users/${user.uid}`);
        updateDocumentNonBlocking(userDocRef, { subscriptionStatus: 'premium' });

        toast({
            title: 'Upgrade Successful!',
            description: 'Welcome to Premium! You now have unlimited access.',
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="font-headline text-2xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground">
                Manage your account, subscription, and preferences.
            </p>

            {isLoading ? (
                <SettingsSkeleton />
            ) : user ? (
                <div className="grid gap-8 max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Account</CardTitle>
                            <CardDescription>Your account information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                                <p className="text-foreground">{user.displayName}</p>
                            </div>
                             <div className="flex flex-col space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                <p className="text-foreground">{user.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>My Subscription</CardTitle>
                            <CardDescription>
                                You are currently on the <span className="font-semibold text-primary">{isPremium ? "Premium Plan" : "Free Plan"}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPremium ? (
                                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
                                    <CheckCircle className="h-6 w-6" />
                                    <p className="font-medium">You have access to all premium features!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                                        <span>Reminders Usage</span>
                                        <span className="font-medium">{remindersCount} / {reminderLimit}</span>
                                    </div>
                                    <Progress value={reminderProgress} />
                                    {remindersCount >= reminderLimit && (
                                         <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                                            <ShieldAlert className="h-4 w-4"/>
                                            <p>You have reached your limit of up to 5 reminders.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                        {!isPremium && (
                            <CardFooter>
                                <Button className="w-full sm:w-auto" size="lg" onClick={handleUpgrade}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Upgrade to Premium
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    {!isPremium && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Star className="h-5 w-5" />
                                    Unlock Premium Features
                                </CardTitle>
                                <CardDescription>Go beyond the basics and supercharge your productivity.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-foreground/80">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span><span className="font-semibold text-foreground">Unlimited</span> reminders and triggers.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span><span className="font-semibold text-foreground">Unlimited</span> use of the AI Builder.</span>
                                    </li>
                                     <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span>Cloud backup and sync across devices.</span>
                                    </li>
                                     <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span>Access to all future premium trigger types.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Please Log In</CardTitle>
                        <CardDescription>Log in to manage your settings.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
