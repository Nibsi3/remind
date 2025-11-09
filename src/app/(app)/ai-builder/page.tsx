import AiBuilderClient from './ai-builder-client';

export default function AiBuilderPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold">AI Reminder Builder</h1>
      </div>
      <p className="text-muted-foreground">
        Use natural language to create your reminders. The AI will parse your
        request and suggest a structured reminder that you can edit.
      </p>
      <AiBuilderClient />
    </div>
  );
}
