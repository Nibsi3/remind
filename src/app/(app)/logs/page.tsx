'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AIChatLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function LogsLoading() {
    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Your Prompt</TableHead>
                        <TableHead>AI Response</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


export default function LogsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const chatLogsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/ai_chat_logs`);
  }, [user, firestore]);

  const { data: logs, isLoading } = useCollection<AIChatLog>(chatLogsQuery);
  
  const getRelevantMessages = (log: AIChatLog) => {
    const userMessages = log.messages.filter(m => m.role === 'user').map(m => m.content).join('; ');
    const lastAssistantMessage = log.messages.filter(m => m.role === 'assistant').pop()?.content || 'N/A';
    return { userPrompt: userMessages, aiResponse: lastAssistantMessage };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold">AI Chat Logs</h1>
      </div>
      <p className="text-muted-foreground">
        View a history of your conversations with the AI Reminder Builder.
      </p>
      
      {isLoading ? <LogsLoading /> : (
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Your Prompt(s)</TableHead>
                <TableHead>Final AI Response</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs && logs.length > 0 ? (
                    logs.sort((a,b) => b.createdDate.toMillis() - a.createdDate.toMillis()).map((log) => {
                        const { userPrompt, aiResponse } = getRelevantMessages(log);
                        return (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    {formatDistanceToNow(log.createdDate.toDate(), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="font-code">{userPrompt}</TableCell>
                                <TableCell className="font-code">{aiResponse}</TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No logs found. Create a reminder with the AI Builder to see logs here.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}
    