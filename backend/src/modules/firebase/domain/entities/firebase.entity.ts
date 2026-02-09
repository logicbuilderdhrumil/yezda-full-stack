export interface DeviceToken { id: string; userId: string; tenantId: string; token: string; platform: 'ios' | 'android' | 'web'; createdAt: Date; }
export interface NotificationDispatchRequest { title: string; body: string; targetUserIds?: string[]; topic?: string; data?: Record<string, string>; }
export interface NotificationDispatchResult { success: boolean; messageId?: string; error?: string; }
