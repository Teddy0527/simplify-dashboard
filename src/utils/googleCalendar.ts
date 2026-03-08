export interface CreateEventPayload {
  summary: string;
  description: string;
  start: { date?: string; dateTime?: string; timeZone: string };
  end: { date?: string; dateTime?: string; timeZone: string };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'popup' | 'email'; minutes: number }>;
  };
}
