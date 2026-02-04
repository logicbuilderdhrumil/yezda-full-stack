/**
 * Frontend-Backend Contract Types
 * Integration layer defining shared DTOs, enums, and response envelopes for product features.
 */

// =============================================================================
// Common Response Envelopes
// =============================================================================

/** Standard API success response envelope. */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

/** Standard API error response envelope. */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/** Pagination metadata for list responses. */
export interface ResponseMeta {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  pageCount?: number;
}

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  meta: ResponseMeta;
}

// =============================================================================
// File Handling Contracts
// =============================================================================

/** Standard file metadata returned from backend. */
export interface FileMetadataDTO {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  scanStatus: FileScanStatus;
  createdAt: string;
  expiresAt?: string;
  accessCount?: number;
  lastAccessedAt?: string;
}

/** File scan status enum. */
export type FileScanStatus = 'pending' | 'clean' | 'infected' | 'error';

/** File upload request. */
export interface FileUploadRequest {
  file: File;
  expiresInDays?: number;
  metadata?: Record<string, string>;
}

/** File upload response. */
export interface FileUploadResponseDTO {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  scanStatus: FileScanStatus;
  createdAt: string;
  expiresAt?: string;
}

/** File list response. */
export interface FileListResponseDTO {
  files: FileMetadataDTO[];
  total: number;
  limit: number;
  offset: number;
}

/** Storage usage response. */
export interface StorageUsageDTO {
  totalBytes: number;
  totalFormatted: string;
  fileCount: number;
  usageByType: Record<string, { bytes: number; count: number }>;
}

// =============================================================================
// Async Job Status Contracts
// =============================================================================

/** Job status enum. */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Job progress information. */
export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

/** Standard async job status response. */
export interface JobStatusDTO {
  jobId: string;
  status: JobStatus;
  progress?: JobProgress;
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletionAt?: string;
}

/** Job list response. */
export interface JobListResponseDTO {
  jobs: JobStatusDTO[];
  meta: ResponseMeta;
}

// =============================================================================
// Export Contracts
// =============================================================================

/** Export format enum. */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

/** Export request. */
export interface ExportRequestDTO {
  format: ExportFormat;
  filters?: Record<string, unknown>;
  columns?: string[];
}

/** Export status response. */
export interface ExportStatusDTO {
  exportId: string;
  status: JobStatus;
  format: ExportFormat;
  progress?: JobProgress;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
}

// =============================================================================
// Form Builder Contracts
// =============================================================================

/** Form field type enum. */
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'signature';

/** Form status enum. */
export type FormStatus = 'draft' | 'published' | 'archived';

/** Form field definition. */
export interface FormFieldDTO {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  conditionalLogic?: FormConditionalLogic;
}

/** Form field validation rules. */
export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/** Form field option for select/radio/checkbox. */
export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Form conditional logic. */
export interface FormConditionalLogic {
  action: 'show' | 'hide' | 'require';
  conditions: FormCondition[];
  operator: 'and' | 'or';
}

/** Form condition. */
export interface FormCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'empty' | 'notEmpty';
  value?: string;
}

/** Form definition DTO. */
export interface FormDTO {
  id: string;
  name: string;
  description?: string;
  status: FormStatus;
  fields: FormFieldDTO[];
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/** Form settings. */
export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  allowMultipleSubmissions?: boolean;
  notifyOnSubmission?: boolean;
  notificationEmails?: string[];
}

/** Form submission DTO. */
export interface FormSubmissionDTO {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: string;
  submittedBy?: string;
}

// =============================================================================
// Asset Management Contracts
// =============================================================================

/** Asset type enum. */
export type AssetType = 'image' | 'document' | 'video' | 'audio' | 'other';

/** Asset DTO. */
export interface AssetDTO {
  id: string;
  name: string;
  type: AssetType;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Asset list response. */
export interface AssetListResponseDTO {
  assets: AssetDTO[];
  meta: ResponseMeta;
}

// =============================================================================
// Chat Contracts
// =============================================================================

/** Message type enum. */
export type MessageType = 'text' | 'file' | 'system';

/** Conversation DTO. */
export interface ConversationDTO {
  id: string;
  participants: ParticipantDTO[];
  lastMessage?: MessageDTO;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Participant DTO. */
export interface ParticipantDTO {
  id: string;
  name: string;
  avatarUrl?: string;
  type: 'user' | 'candidate';
}

/** Message DTO. */
export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachments?: FileMetadataDTO[];
  readBy: string[];
  createdAt: string;
  updatedAt?: string;
}

/** Send message request. */
export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  attachments?: string[];
}

// =============================================================================
// Charting Contracts
// =============================================================================

/** Chart type enum. */
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'table';

/** Chart data request. */
export interface ChartDataRequest {
  chartType: ChartType;
  dateRange?: DateRange;
  filters?: Record<string, unknown>;
  groupBy?: string;
}

/** Date range. */
export interface DateRange {
  start: string;
  end: string;
}

/** Chart data response. */
export interface ChartDataResponseDTO {
  chartType: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  summary?: ChartSummary;
}

/** Chart dataset. */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

/** Chart summary. */
export interface ChartSummary {
  total: number;
  average?: number;
  min?: number;
  max?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

/** Saved chart DTO. */
export interface SavedChartDTO {
  id: string;
  name: string;
  chartType: ChartType;
  config: ChartDataRequest;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Billing Ledger Contracts
// =============================================================================

/** Ledger entry type enum. */
export type LedgerEntryType =
  | 'screening'
  | 'verification'
  | 'document_review'
  | 'subscription'
  | 'addon'
  | 'adjustment'
  | 'credit';

/** Billing status enum. */
export type BillingStatus = 'unbilled' | 'billed' | 'voided';

/** Ledger entry DTO. */
export interface LedgerEntryDTO {
  id: string;
  organizationId: string;
  entryType: LedgerEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: BillingStatus;
  referenceId?: string;
  referenceType?: string;
  invoiceId?: string;
  billedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Ledger entry list response. */
export interface LedgerEntryListResponseDTO {
  entries: LedgerEntryDTO[];
  meta: ResponseMeta;
  summary?: LedgerSummary;
}

/** Ledger summary. */
export interface LedgerSummary {
  totalAmount: number;
  entryCount: number;
  currency: string;
}

/** Create ledger entry request. */
export interface CreateLedgerEntryRequest {
  entryType: LedgerEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Dashboard Contracts
// =============================================================================

/** Dashboard summary DTO. */
export interface DashboardSummaryDTO {
  metrics: DashboardMetric[];
  recentActivity: ActivityItemDTO[];
  alerts?: DashboardAlert[];
}

/** Dashboard metric. */
export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'stable';
  icon?: string;
}

/** Activity item DTO. */
export interface ActivityItemDTO {
  id: string;
  type: string;
  message: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Dashboard alert. */
export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  dismissible: boolean;
}

// =============================================================================
// Widget Contracts
// =============================================================================

/** Widget type enum. */
export type WidgetType = 'metric' | 'chart' | 'list' | 'table' | 'custom';

/** Widget DTO. */
export interface WidgetDTO {
  id: string;
  name: string;
  type: WidgetType;
  config: Record<string, unknown>;
  dataSource?: string;
  refreshInterval?: number;
  createdAt: string;
  updatedAt: string;
}

/** Widget list response. */
export interface WidgetListResponseDTO {
  widgets: WidgetDTO[];
  meta: ResponseMeta;
}

// =============================================================================
// Template Layout Contracts
// =============================================================================

/** Template type enum. */
export type TemplateType = 'page' | 'email' | 'pdf' | 'dashboard';

/** Template DTO. */
export interface TemplateDTO {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Template variable. */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

// =============================================================================
// View Component Contracts
// =============================================================================

/** View component type enum. */
export type ViewComponentType = 'list' | 'detail' | 'form' | 'dashboard' | 'custom';

/** View component DTO. */
export interface ViewComponentDTO {
  id: string;
  name: string;
  type: ViewComponentType;
  config: ViewComponentConfig;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

/** View component configuration. */
export interface ViewComponentConfig {
  layout?: 'grid' | 'list' | 'tabs' | 'accordion';
  columns?: ViewColumn[];
  actions?: ViewAction[];
  filters?: ViewFilter[];
  sorting?: ViewSorting;
  pagination?: boolean;
}

/** View column. */
export interface ViewColumn {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderer?: string;
}

/** View action. */
export interface ViewAction {
  id: string;
  label: string;
  icon?: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: string;
  requiresSelection?: boolean;
}

/** View filter. */
export interface ViewFilter {
  field: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  label: string;
  options?: { value: string; label: string }[];
}

/** View sorting. */
export interface ViewSorting {
  defaultField: string;
  defaultOrder: 'asc' | 'desc';
}

// =============================================================================
// Realtime Event Contracts
// =============================================================================

/** Realtime event types. */
export type RealtimeEventType =
  | 'job.started'
  | 'job.progress'
  | 'job.completed'
  | 'job.failed'
  | 'file.uploaded'
  | 'file.scanned'
  | 'message.received'
  | 'notification.received';

/** Realtime event payload. */
export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  timestamp: string;
  payload: T;
}

/** Job event payload. */
export interface JobEventPayload {
  jobId: string;
  status: JobStatus;
  progress?: JobProgress;
  result?: unknown;
  error?: string;
}

/** File event payload. */
export interface FileEventPayload {
  fileId: string;
  filename: string;
  scanStatus?: FileScanStatus;
}

/** Message event payload. */
export interface MessageEventPayload {
  conversationId: string;
  message: MessageDTO;
}
