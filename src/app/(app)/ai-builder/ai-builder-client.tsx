'use client';

import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, User, Send, Star, Repeat, Loader2, Clock, ShieldAlert, MessageSquarePlus } from 'lucide-react';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

import type { AiChatMessage, Reminder } from '@/lib/types';
import type { ClarifyAmbiguousReminderOutput } from '@/ai/flows/ai-clarify-ambiguous-reminder';
import type { AiReminderFromPromptOutput } from '@/ai/flows/ai-reminder-from-prompt';

import { clarifyAmbiguousReminder } from '@/ai/flows/ai-clarify-ambiguous-reminder';
import { aiReminderFromPrompt } from '@/ai/flows/ai-reminder-from-prompt';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { Textarea } from '@/components/ui/textarea';

const FREE_TIER_LIMIT = 5;

export default function AiBuilderClient() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reminderPreview, setReminderPreview] =
    useState<AiReminderFromPromptOutput | null>(null);
  const [editableReminder, setEditableReminder] = useState<AiReminderFromPromptOutput | null>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const remindersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/reminders`);
  }, [user, firestore]);
  
  const { data: reminders } = useCollection<Reminder>(remindersQuery);

  const isAtFreeTierLimit = useMemo(() => {
    // TODO: Add check for user's subscription status
    const isFreeTier = true; 
    return isFreeTier && reminders && reminders.length >= FREE_TIER_LIMIT;
  }, [reminders]);

  useEffect(() => {
    setEditableReminder(reminderPreview);
  }, [reminderPreview]);


  const handleAiResponse = (
    response: ClarifyAmbiguousReminderOutput,
    originalPrompt: string
  ) => {
    if (response.isAmbiguous) {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content:
            response.clarificationQuestion ||
            "I'm not sure I understand. Could you be more specific?",
        },
      ]);
      setReminderPreview(null);
      setIsLoading(false);
    } else {
      const promptToUse = response.clarifiedReminder || originalPrompt;
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: `OK, creating a reminder for: "${promptToUse}".`,
        },
      ]);
      generateReminder(promptToUse);
    }
  };

  const generateReminder = async (prompt: string) => {
    // This function is now called within handleAiResponse, so setIsLoading(true) is already set
    try {
      const result = await aiReminderFromPrompt({ prompt });
      setReminderPreview(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Reminder',
        description: 'There was an issue with the AI. Please try again.',
      });
      setReminderPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isAtFreeTierLimit) {
      toast({
        variant: 'destructive',
        title: 'Free Tier Limit Reached',
        description: `You have reached the limit of ${FREE_TIER_LIMIT} reminders for the free plan. Please upgrade to create more.`,
      });
      return;
    }

    const userMessage: AiChatMessage = {
      id: nanoid(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setReminderPreview(null);

    try {
      const clarificationResult = await clarifyAmbiguousReminder({
        description: currentInput,
      });
      handleAiResponse(clarificationResult, currentInput);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not get a response from the AI assistant.',
      });
      setIsLoading(false);
    }
  };

  const handleClarifyWithAI = () => {
    if (!editableReminder) return;

    // In a real implementation, you would send this back to a new Genkit flow.
    // For now, we'll just log it and add a message to the chat.
    console.log("Clarifying with AI:", editableReminder);

    const clarificationRequest = `I've edited the reminder. Can you check it? Title is "${editableReminder.title}", and description is "${editableReminder.description}".`;

    setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: 'user', content: clarificationRequest },
        { id: nanoid(), role: 'assistant', content: "Got it. Let me re-evaluate that for you... (functionality coming soon!)" }
    ]);
  };

  const saveChatLog = (allMessages: AiChatMessage[]) => {
    if (!user || !firestore) return;
    const chatLogCol = collection(firestore, `users/${user.uid}/ai_chat_logs`);
    addDocumentNonBlocking(chatLogCol, {
      userId: user.uid,
      createdDate: serverTimestamp(),
      messages: allMessages.map(m => ({ role: m.role, content: m.content })),
    });
  }


  const handleSaveReminder = async () => {
    if (!editableReminder || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot save reminder. Missing data, user, or connection.',
      });
      return;
    }
    
    if (isAtFreeTierLimit) {
      toast({
        variant: 'destructive',
        title: 'Free Tier Limit Reached',
        description: `You have reached the limit of ${FREE_TIER_LIMIT} reminders for the free plan. Please upgrade to create more.`,
      });
      return;
    }


    try {
      const remindersCol = collection(firestore, `users/${user.uid}/reminders`);
      
      const reminderData: any = {
        title: editableReminder.title,
        description: editableReminder.description || '',
        notificationMessage: editableReminder.notificationMessage,
        icon: editableReminder.icon,
        vibrationPattern: editableReminder.vibrationPattern,
        priority: editableReminder.priority,
        repeatRule: editableReminder.repeatRule,
        triggerType: editableReminder.triggerType,
        triggerDetails: editableReminder.triggerDetails,
        userId: user.uid,
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
        triggerIds: [], // Placeholder for now
      };

      if (editableReminder.triggerTimestamp) {
        reminderData.triggerTimestamp = Timestamp.fromDate(new Date(editableReminder.triggerTimestamp));
      }

      // We don't need to await this, it will run in the background
      addDocumentNonBlocking(remindersCol, reminderData);
      
      const finalAssistantMessage: AiChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `Reminder saved: "${editableReminder.title}"`
      };
      
      saveChatLog([...messages, finalAssistantMessage]);


      toast({
        title: 'Reminder Saved!',
        description: `"${editableReminder.title}" has been added to your reminders.`,
      });
      router.push('/reminders');
    } catch (error) {
      console.error('Error saving AI reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save your reminder. Please try again.',
      });
    }
  };

  const handlePreviewChange = (field: keyof AiReminderFromPromptOutput, value: string | number) => {
    if (editableReminder) {
      setEditableReminder({ ...editableReminder, [field]: value });
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 -m-4 md:m-0">
      <Card className="flex flex-col h-[80vh] md:h-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" /> Conversation
          </CardTitle>
          <CardDescription>Chat with the AI to create your reminder.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4">
               {messages.length === 0 && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-3 py-2 bg-muted max-w-[80%]">
                    <p className="text-sm">Hello! How can I help you set a reminder?</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
            </div>
          </ScrollArea>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t pt-4"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Remind me to call mom tomorrow at 5pm"
              disabled={isLoading || !!isAtFreeTierLimit}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || !!isAtFreeTierLimit}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Editable Preview</CardTitle>
          <CardDescription>
            Review and edit the reminder, then save it or send it back to the AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {editableReminder ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <Input 
                  value={editableReminder.title} 
                  onChange={(e) => handlePreviewChange('title', e.target.value)}
                  className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Textarea 
                  value={editableReminder.description} 
                  onChange={(e) => handlePreviewChange('description', e.target.value)}
                  className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notification</label>
                <Input 
                  value={editableReminder.notificationMessage} 
                  onChange={(e) => handlePreviewChange('notificationMessage', e.target.value)}
                  className="mt-1" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold text-sm">
                    Priority: {editableReminder.priority}
                  </span>
                </div>
                {editableReminder.repeatRule && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Repeat className="h-4 w-4" />{' '}
                    <span className="text-sm">
                      {editableReminder.repeatRule}
                    </span>
                  </div>
                )}
              </div>
              {editableReminder.triggerTimestamp && (
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Trigger Time</label>
                    <div className="bg-muted p-2 rounded-md mt-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-mono">
                         {format(new Date(editableReminder.triggerTimestamp), "PPPp")}
                        </p>
                      </div>
                    </div>
                </div>
              )}
                 {editableReminder.triggerDetails && (
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Trigger Details</label>
                     <div className="bg-muted p-2 rounded-md mt-1">
                        <p className="text-sm font-mono">
                          {editableReminder.triggerDetails}
                        </p>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Generating reminder...</p>
                </div>
              ) : isAtFreeTierLimit ? (
                 <div className="flex flex-col items-center gap-2 text-destructive">
                  <ShieldAlert className="h-8 w-8" />
                  <p className="font-semibold">Free Tier Limit Reached</p>
                  <p className="text-xs max-w-xs">You have reached the maximum of ${FREE_TIER_LIMIT} reminders. Please upgrade to a premium plan to create more.</p>
                </div>
              ) : (
                <p>Your generated reminder will appear here.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!editableReminder || isLoading}
            onClick={handleClarifyWithAI}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Clarify with AI
          </Button>
          <Button
            className="w-full sm:flex-1"
            disabled={!editableReminder || isLoading || !!isAtFreeTierLimit}
            onClick={handleSaveReminder}
          >
            {isLoading ? 'Saving...' : 'Save Reminder'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    