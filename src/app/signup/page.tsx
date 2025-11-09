'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  displayName: z.string().min(1, { message: 'Display name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.545 8.121c-.552-.45-1.225-.712-1.95-.712s-1.398.262-1.95-.712l-5.694 4.609c-.552.45-1.225.712-1.95-.712s-1.398-.262-1.95-.712"/><path d="M8.455 16.121c.552.45 1.225.712 1.95.712s1.398-.262 1.95-.712l5.694-4.609c.552-.45 1.225-.712 1.95-.712s1.398.262 1.95-.712"/><path d="M12 22a10 10 0 1 0-10-10c0 .243.01.485.03.72"/></svg>
)

export default function SignupPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/reminders');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const auth = getAuth();
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: 'Database service is not available.',
        });
        setIsSubmitting(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;
      
      await updateProfile(newUser, {
          displayName: values.displayName
      });

      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        displayName: values.displayName,
        photoURL: newUser.photoURL,
        subscriptionStatus: 'free',
        remindersCount: 0,
        createdDate: serverTimestamp(),
        lastLoginDate: serverTimestamp(),
      });
      
      toast({
        title: 'Account Created',
        description: "You've been successfully signed up.",
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Signup Error:', error);
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            description = 'This email is already in use. Please log in.';
            break;
          case 'auth/weak-password':
            description = 'The password is too weak. Please choose a stronger one.';
            break;
          default:
            description = error.message;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
     if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: 'Database service is not available.',
        });
        return;
    }
    try {
      const result = await signInWithPopup(auth, provider);
      const newUser = result.user;

      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
        subscriptionStatus: 'free',
        remindersCount: 0,
        createdDate: serverTimestamp(),
        lastLoginDate: serverTimestamp(),
      }, { merge: true }); // Merge to not overwrite if doc exists from a previous sign-in attempt

      toast({
        title: 'Signed Up',
        description: "You've successfully signed up with Google.",
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
       let description = "Could not sign up with Google. Please try again.";
      if (error instanceof FirebaseError) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description
      });
    }
  };
  
  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
            {/* You can add a loading spinner here */}
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent text-foreground px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Start using smart reminders today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="First Name"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />
           <p className='text-center text-muted-foreground text-sm mb-4'>OR SIGN UP WITH</p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <p>
            Already have an account?&nbsp;
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
