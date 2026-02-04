/**
 * Shared Contracts Index
 * Re-exports all contract types and utilities.
 */

// Error envelope
export {
  type ErrorCode,
  type ValidationErrorDetail,
  type ApiErrorEnvelope,
  isApiErrorEnvelope,
  createApiError,
} from './error-envelope';

// Pagination
export {
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResponse,
  type SortDirection,
  type SortParams,
  createPaginationMeta,
} from './pagination';

// Authentication
export {
  type UserType,
  type UserRole,
  type TokenPair,
  type SignUpRequest,
  type SignUpResponse,
  type SignInRequest,
  type SignInResponse,
  type MfaVerifyRequest,
  type TokenRefreshRequest,
  type TokenRefreshResponse,
  type PasswordResetRequest,
  type PasswordResetCompleteRequest,
  type CurrentUserResponse,
  type SignOutParams,
  type MfaEnrollmentResponse,
  type MfaEnrollmentCompleteRequest,
  type MfaEnrollmentCompleteResponse,
} from './auth';

// Socket events
export {
  SOCKET_NAMESPACES,
  type SocketNamespace,
  SERVER_EVENTS,
  type ServerEvent,
  CLIENT_EVENTS,
  type ClientEvent,
  type ConnectionStatus,
  type PresenceStatus,
  type SocketUserType,
  type ConnectionAckPayload,
  type ConnectionErrorPayload,
  type PresenceUpdatePayload,
  type RateLimitedPayload,
  type SessionExpiredPayload,
  type SetStatusPayload,
  type SetStatusResponse,
  type GetStatusPayload,
  type GetStatusResponse,
  type SubscribePresencePayload,
  type SubscribePresenceResponse,
  type PingResponse,
} from './socket-events';

// Notifications
export {
  type NotificationType,
  type NotificationPriority,
  type NotificationStatus,
  type NotificationUserType,
  type Notification,
  type NotificationSocketPayload,
  type NotificationFilters,
  type NotificationListRequest,
  type NotificationListResponse,
  type UnreadCountResponse,
  type MarkAsReadRequest,
  type MarkAsReadResponse,
} from './notifications';

// Contract map
export {
  type HttpMethod,
  type ApiContract,
  FOUNDATION_API_CONTRACTS,
  type FoundationEndpoint,
  getContract,
  getEndpointPath,
} from './contract-map';
