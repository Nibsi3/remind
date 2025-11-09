import type { Reminder, Log } from './types';

export const mockReminderTemplates = [
  {
    title: 'Take out the trash',
    description: 'Weekly trash and recycling pickup.',
    notificationMessage: 'Time to take out the trash!',
    priority: 2,
  },
  {
    title: 'Call the doctor',
    description: 'Schedule annual check-up.',
    notificationMessage: "Reminder: Call doctor's office.",
    priority: 4,
  },
  {
    title: 'Pay rent',
    description: 'Monthly rent payment is due soon.',
    notificationMessage: 'Heads up! Rent is due.',
    priority: 5,
  },
    {
    title: 'Go to the gym',
    description: 'Leg day.',
    notificationMessage: 'Time to hit the gym!',
    priority: 3,
  },
];


export const mockReminders: Reminder[] = [
  {
    id: '1',
    title: 'Pick up groceries',
    description: 'Milk, bread, eggs, and cheese',
    priority: 4,
    triggers: [
      { type: 'location', details: 'When I leave work' },
      { type: 'time', details: 'After 5:00 PM' },
    ],
    repeat: 'Weekly on Fridays',
  },
  {
    id: '2',
    title: 'Call John',
    description: 'Discuss the project deadline.',
    priority: 5,
    triggers: [
      { type: 'time', details: 'Today at 2:00 PM' },
    ],
  },
  {
    id: '3',
    title: 'Charge headphones',
    description: 'Before the gym session tomorrow.',
    priority: 3,
    triggers: [
      { type: 'bluetooth', details: 'When phone disconnects from car' },
      { type: 'deviceState', details: 'When battery is low' },
    ],
  },
  {
    id: '4',
    title: 'Water the plants',
    description: 'The ones on the balcony.',
    priority: 2,
    triggers: [
      { type: 'weather', details: 'If no rain for 3 days' },
      { type: 'time', details: 'Sunrise' },
    ],
    repeat: 'Every 3 days',
  },
    {
    id: '5',
    title: 'Team Standup Meeting',
    description: 'Prepare quick updates.',
    priority: 5,
    triggers: [
      { type: 'calendar', details: '10 mins before "Standup" event' },
    ],
    repeat: 'Weekdays',
  },
];

export const mockLogs: Log[] = [
    { id: '1', timestamp: '2024-07-29 10:00:15', level: 'INFO', message: 'App initialized. Background services started.' },
    { id: '2', timestamp: '2024-07-29 10:05:22', level: 'INFO', message: 'Trigger evaluated for reminder #2: time match.' },
    { id: '3', timestamp: '2024-07-29 10:05:23', level: 'INFO', message: 'Notification sent for reminder #2 "Call John".' },
    { id: '4', timestamp: '2024-07-29 11:30:00', level: 'WARN', message: 'Geofence for "home" has a large radius, may impact battery.' },
    { id: '5', timestamp: '2024-07-29 12:00:00', level: 'INFO', message: 'User created new reminder via AI builder.' },
    { id: '6', timestamp: '2024-07-29 12:15:45', level: 'ERROR', message: 'Failed to connect to weather API. Retrying in 5 minutes.' },
];
