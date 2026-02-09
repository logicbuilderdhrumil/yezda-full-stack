export interface WebhookPayload { stageId: string; status: string; data?: Record<string, unknown>; timestamp: Date; }
export interface WebhookResult { success: boolean; error?: string; }
