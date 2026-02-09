/**
 * Notifications Feature Module
 *
 * Encapsulates notification pages, hooks, and services.
 */

// Pages
export { NotificationsView } from './pages/NotificationsView';

// Hooks (co-located with pages)
export {
  useNotifications,
  useUnreadNotificationCount,
  type UseNotificationsConfig,
  type UseNotificationsState,
  type UseNotificationsActions,
  type UseNotificationsReturn,
} from './pages/useNotifications';

// Services
export { NotificationsService } from './services/NotificationsService';
