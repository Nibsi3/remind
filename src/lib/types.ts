import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type TriggerType = 'time' | 'location' | 'bluetooth' | 'wifi' | 'calendar' | 'weather' | 'deviceState';

export type Trigger = {
  id: string;
  type: TriggerType;
  parameters: string; // JSON string for parameters
};

export type Reminder = {
  id: string;
  title: string;
  description?: string;
  notificationMessage: string;
  priority: number; // 1-5
  triggerIds?: Trigger[];
  icon?: string;
  repeat?: string;
  repeatRules?: string;
  createdDate: Timestamp;
  lastModifiedDate: Timestamp;
  triggerTimestamp?: Timestamp;
  userId: string;
};

export type Log = {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
};

export type NavItem = {
    href: string;
    title: string;
    icon: LucideIcon;
    active?: boolean;
};

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type AIChatLog = {
  id: string;
  userId: string;
  messages: AiChatMessage[];
  createdDate: Timestamp;
};
    