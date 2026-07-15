export interface NotificationJob {
  tenantId: string;
  channel: 'EMAIL' | 'SMS';
  to: string;
  subject?: string;
  body: string;
  meta?: Record<string, unknown>;
}
