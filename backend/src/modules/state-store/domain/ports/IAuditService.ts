export interface IAuditService {
  log(entry: {
    eventType: string;
    actorId?: string;
    actorType?: string;
    channel?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }): void;
}
