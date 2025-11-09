'use server';
/**
 * @fileOverview This file defines a Genkit flow for clarifying ambiguous reminder descriptions using AI.
 *
 * It includes the following:
 * - `clarifyAmbiguousReminder`: An asynchronous function that takes an ambiguous reminder description and returns a clarified reminder or asks clarifying questions.
 * - `ClarifyAmbiguousReminderInput`: The input type for the `clarifyAmbiguousReminder` function.
 * - `ClarifyAmbiguousReminderOutput`: The output type for the `clarifyAmbiguousReminder` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClarifyAmbiguousReminderInputSchema = z.object({
  description: z.string().describe('The natural language description of the reminder.'),
  context: z.string().optional().describe('Additional context about the user or their preferences.'),
});
export type ClarifyAmbiguousReminderInput = z.infer<typeof ClarifyAmbiguousReminderInputSchema>;

const ClarifyAmbiguousReminderOutputSchema = z.object({
  isAmbiguous: z.boolean().describe('Whether the reminder description is ambiguous.'),
  clarificationQuestion: z.string().optional().describe('A question to ask the user to clarify the reminder, if ambiguous.'),
  clarifiedReminder: z.string().optional().describe('The clarified reminder description, if not ambiguous.'),
});
export type ClarifyAmbiguousReminderOutput = z.infer<typeof ClarifyAmbiguousReminderOutputSchema>;

export async function clarifyAmbiguousReminder(input: ClarifyAmbiguousReminderInput): Promise<ClarifyAmbiguousReminderOutput> {
  return clarifyAmbiguousReminderFlow(input);
}

const clarifyAmbiguousReminderPrompt = ai.definePrompt({
  name: 'clarifyAmbiguousReminderPrompt',
  input: {schema: ClarifyAmbiguousReminderInputSchema},
  output: {schema: ClarifyAmbiguousReminderOutputSchema},
  prompt: `You are a reminder assistant that helps users create accurate reminders from natural language descriptions.

  Your job is to determine if the user's description is ambiguous. A reminder is ambiguous if it lacks a specific time, date, or clear action.
  - If it IS ambiguous, set isAmbiguous to true and respond with a question to help clarify the reminder.
  - If it IS NOT ambiguous, set isAmbiguous to false and respond with a clarified, concise reminder description in the 'clarifiedReminder' field.

  Here are some examples of ambiguous reminders:
  * "Remind me to call someone tomorrow" (Who to call?)
  * "Remind me to buy something at the store" (What to buy? Which store?)
  * "Take out the trash" (When?)

  Here are some examples of clear reminders:
  * "Remind me to call John Smith tomorrow at 2pm"
  * "Remind me to buy milk at the grocery store when I get there"
  * "Take out the trash every Tuesday evening"

  Description: {{{description}}}
  Context: {{{context}}}
  `,
});

const clarifyAmbiguousReminderFlow = ai.defineFlow(
  {
    name: 'clarifyAmbiguousReminderFlow',
    inputSchema: ClarifyAmbiguousReminderInputSchema,
    outputSchema: ClarifyAmbiguousReminderOutputSchema,
  },
  async input => {
    const {output} = await clarifyAmbiguousReminderPrompt(input);
    return output!;
  }
);
