# **App Name**: Contextual Reminders

## Core Features:

- Reminder Creation UI: Create reminders with title, description, notification message, optional icon, vibration pattern, priority, and repeat rules. Save to local DB and Firestore.
- Contextual Trigger System: Implement location (geofence enter/exit, multi-radius, low-battery), Bluetooth (connect/disconnect), WiFi (SSID), Time (one-off, repeat, sunrise/sunset), Calendar (event start/end, keyword), Weather (temp, precipitation, wind), and Device state triggers. Allow stackable triggers with AND logic.
- Background Execution Engine: Android: WorkManager + foreground service. iOS: Region monitoring, BGTaskScheduler. Background isolate for trigger evaluation and local persistent queue.
- Persistent Queue & Recovery: Implement a local persistent queue that survives reboot and app kills. Auto re-register geofences and background tasks.
- AI Reminder Builder: Chat-like UI integrated. Use AIService abstraction (OpenAI API or pluggable LLM endpoint). Prompt template to parse natural language to JSON. Clarifying questions for ambiguity. Editable preview. Limited for free tier.
- Freemium Model & Paywall: Free: limited reminders, triggers, AI. Premium: unlimited, cloud sync, priority processing. Implement in-app purchases (Google Play Billing, Apple StoreKit).
- Cloud Sync & Auth: Firebase Auth (email/password, Google). Firestore schema for reminders, triggers, AI chats, user settings. Conflict resolution. Remote Config for experimental triggers.
- UI & UX: Tab-based navigation (Reminders, AI Builder, Logs, Settings). Home shows reminder list. Multi-step reminder wizard. Intuitive Trigger Builder. Onboarding, settings, logs pages.
- Notifications: Local notifications on Android (channels) and iOS (categories). Notification actions: Snooze, Mark Done, Open App. Custom vibration patterns.
- Permissions & Privacy: Request permissions only when needed. Provide privacy-first defaults. Clear privacy policy text placeholder.

## Style Guidelines:

- Use PT Sans for body/headlines; code snippets (logs) use Source Code Pro.
- Minimalist icons for triggers and states.
- Neutral, high-contrast interfaces. Provide light/dark themes.