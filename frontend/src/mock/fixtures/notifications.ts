/**
 * Notifications module mock fixtures.
 * Provides fake data for notification endpoints.
 * Aligned with Notification type in @/@types/notification.types.ts
 */

import type { Notification, NotificationListResponse, UnreadCountResponse } from '@/@types';

/** Predefined mock notifications. */
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    tenantId: 'tenant-001',
    userId: 'user-001',
    userType: 'user',
    type: 'SCREENING',
    priority: 'high',
    title: 'New Review Assigned',
    body: 'You have been assigned a background check review for John Doe.',
    status: 'unread',
    actionUrl: '/admin/reviews/review-001',
    createdAt: '2026-02-08T09:30:00.000Z',
  },
  {
    id: 'notif-002',
    tenantId: 'tenant-001',
    userId: 'user-001',
    userType: 'user',
    type: 'SCREENING',
    priority: 'normal',
    title: 'Screening Completed',
    body: 'The employment verification for Jane Smith has been completed.',
    status: 'unread',
    actionUrl: '/admin/screening',
    createdAt: '2026-02-08T08:15:00.000Z',
  },
  {
    id: 'notif-003',
    tenantId: 'tenant-001',
    userId: 'user-001',
    userType: 'user',
    type: 'REMINDER',
    priority: 'high',
    title: 'Pipeline Deadline Approaching',
    body: 'The onboarding pipeline for Acme Corp has a deadline in 2 days.',
    status: 'unread',
    actionUrl: '/admin/pipelines',
    createdAt: '2026-02-07T16:45:00.000Z',
  },
  {
    id: 'notif-004',
    tenantId: 'tenant-001',
    userId: 'user-001',
    userType: 'user',
    type: 'SYSTEM',
    priority: 'low',
    title: 'User Account Activated',
    body: 'Agent Sarah Wilson has activated their account.',
    status: 'read',
    readAt: '2026-02-07T11:00:00.000Z',
    createdAt: '2026-02-07T10:00:00.000Z',
  },
  {
    id: 'notif-005',
    tenantId: 'tenant-001',
    userId: 'user-001',
    userType: 'user',
    type: 'APPLICATION',
    priority: 'normal',
    title: 'Billing Invoice Generated',
    body: 'A new invoice for January 2026 has been generated for Global Staffing Ltd.',
    status: 'read',
    readAt: '2026-02-06T15:00:00.000Z',
    actionUrl: '/admin/ledger',
    createdAt: '2026-02-06T14:30:00.000Z',
  },
];

/** Mock paginated notifications response. */
export const notificationsListResponse: NotificationListResponse = {
  notifications: mockNotifications,
  total: mockNotifications.length,
  hasMore: false,
};

/** Mock unread count response. */
export const unreadCountResponse: UnreadCountResponse = {
  count: mockNotifications.filter((n) => n.status === 'unread').length,
};
