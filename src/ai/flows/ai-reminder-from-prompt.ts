'use server';
/**
 * @fileOverview AI-powered reminder creation flow.
 *
 * - aiReminderFromPrompt - A function that takes a natural language prompt and returns a structured reminder object.
 * - AiReminderFromPromptInput - The input type for the aiReminderFromPrompt function.
 * - AiReminderFromPromptOutput - The return type for the aiReminderFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiReminderFromPromptInputSchema = z.object({
  prompt: z.string().describe('A natural language description of the reminder.'),
});
export type AiReminderFromPromptInput = z.infer<typeof AiReminderFromPromptInputSchema>;

const AiReminderFromPromptOutputSchema = z.object({
  title: z.string().describe('The title of the reminder.'),
  description: z.string().optional().describe('A more detailed description of the reminder.'),
  notificationMessage: z.string().describe('The message to display when the reminder triggers.'),
  icon: z.string().optional().describe('An optional icon for the reminder.'),
  vibrationPattern: z.array(z.number()).optional().describe('An optional vibration pattern for the reminder.'),
  priority: z.number().int().min(1).max(5).default(3).describe('The priority of the reminder (1-5, 5 is highest).'),
  triggerType: z.enum(['time', 'location', 'bluetooth', 'wifi', 'calendar', 'weather', 'deviceState']).describe('The type of trigger for the reminder.'),
  triggerDetails: z.string().describe('A descriptive string of the details for the trigger type.'),
  triggerTimestamp: z.string().datetime().optional().describe('The specific date and time for a time-based trigger, in ISO 8601 format (e.g., "2024-08-15T14:30:00.000Z").'),
  repeatRule: z.string().optional().describe('An optional repeat rule for the reminder (e.g., daily, weekly, monthly).'),
});
export type AiReminderFromPromptOutput = z.infer<typeof AiReminderFromPromptOutputSchema>;

export async function aiReminderFromPrompt(input: AiReminderFromPromptInput): Promise<AiReminderFromPromptOutput> {
  return aiReminderFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiReminderFromPromptPrompt',
  input: {schema: AiReminderFromPromptInputSchema},
  output: {schema: AiReminderFromPromptOutputSchema},
  prompt: `You are an AI assistant designed to parse natural language descriptions of reminders and convert them into a structured JSON format.

  The user will provide a prompt describing the reminder, and your task is to extract the relevant information and format it according to the provided schema.

  The current date and time is ${new Date().toISOString()}. Use this for relative date calculations (e.g., "tomorrow").

  Here's the user's prompt:
  "{{{prompt}}}"

  Ensure that the output is a valid JSON object that conforms to the schema. If any information is missing or ambiguous, use reasonable defaults or leave optional fields blank.
  - For triggerDetails, provide a descriptive string of the trigger.
  - If a specific time or date is mentioned, set triggerType to "time" and populate the 'triggerTimestamp' with the full date and time in ISO 8601 UTC format.
  - Make sure the priority is always an integer between 1 and 5 (inclusive).
  - The triggerType MUST be one of these options: time, location, bluetooth, wifi, calendar, weather, deviceState. If no specific trigger is mentioned, default to 'time' and leave triggerTimestamp null if no time is specified.
`,
});

const aiReminderFromPromptFlow = ai.defineFlow(
  {
    name: 'aiReminderFromPromptFlow',
    inputSchema: AiReminderFromPromptInputSchema,
    outputSchema: AiReminderFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
