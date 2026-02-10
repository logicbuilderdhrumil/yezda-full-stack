/**
 * Pipeline Module Type System — Shared Types
 *
 * Defines the module types, config shapes, and graph structures used by
 * the pipeline builder on both frontend and backend.
 *
 * NOTE: This is a local copy of shared/@types/pipeline-modules.ts
 * kept inside backend/src to satisfy rootDir constraints.
 */

// ---------------------------------------------------------------------------
// Module Types
// ---------------------------------------------------------------------------

/** Supported module types for pipeline stages */
export type ModuleType =
  | 'form'
  | 'external_service'
  | 'internal_processing'
  | 'human_review'
  | 'notification';

/** All valid module type values as a const array (useful for enums/selects) */
export const MODULE_TYPES: readonly ModuleType[] = [
  'form',
  'external_service',
  'internal_processing',
  'human_review',
  'notification',
] as const;

// ---------------------------------------------------------------------------
// Per-Module Config Shapes
// ---------------------------------------------------------------------------

/** Config for a Form module — references a form definition */
export interface FormModuleConfig {
  formDefinitionId: string;
  formVersion?: number;
}

/** Field mapping entry for external service modules */
export interface FieldMappingEntry {
  sourceField: string;
  targetField: string;
}

/** Config for an External Service module */
export interface ExternalServiceModuleConfig {
  provider: string;
  apiKeyRef: string;
  endpoint: string;
  fieldMapping: FieldMappingEntry[];
  webhookUrl?: string;
  timeout: number;
}

/** Config for an Internal Processing module */
export interface InternalProcessingModuleConfig {
  processor: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  timeout: number;
}

/** Escalation policy for human review timeouts */
export interface EscalationPolicy {
  action: 'reassign' | 'notify_manager' | 'auto_approve' | 'auto_reject';
  targetRole?: string;
}

/** Config for a Human Review module */
export interface HumanReviewModuleConfig {
  assigneeRole: string;
  reviewFormId?: string;
  decisionOptions: string[];
  timeoutHours: number;
  escalationPolicy: EscalationPolicy;
}

/** Notification channel types */
export type NotificationChannel = 'email' | 'sms' | 'in_app';

/** Notification recipient types */
export type NotificationRecipientType = 'candidate' | 'assignee' | 'manager' | 'custom';

/** Notification trigger events */
export type NotificationTriggerOn =
  | 'stage_started'
  | 'stage_completed'
  | 'stage_failed'
  | 'assignment_completed';

/** Config for a Notification module */
export interface NotificationModuleConfig {
  channel: NotificationChannel;
  templateId: string;
  recipientType: NotificationRecipientType;
  triggerOn: NotificationTriggerOn;
}

// ---------------------------------------------------------------------------
// Discriminated Module Config Union
// ---------------------------------------------------------------------------

/** Discriminated union mapping moduleType → config shape */
export type ModuleConfig =
  | { moduleType: 'form'; config: FormModuleConfig }
  | { moduleType: 'external_service'; config: ExternalServiceModuleConfig }
  | { moduleType: 'internal_processing'; config: InternalProcessingModuleConfig }
  | { moduleType: 'human_review'; config: HumanReviewModuleConfig }
  | { moduleType: 'notification'; config: NotificationModuleConfig };

/** Helper to extract config type by module type */
export type ModuleConfigFor<T extends ModuleType> = Extract<
  ModuleConfig,
  { moduleType: T }
>['config'];

// ---------------------------------------------------------------------------
// Pipeline Graph Types (React Flow serialization)
// ---------------------------------------------------------------------------

/** A node in the pipeline graph */
export interface PipelineNode {
  id: string;
  type: ModuleType | 'start' | 'end';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

/** An edge in the pipeline graph */
export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/** Viewport state for the graph canvas */
export interface PipelineViewport {
  x: number;
  y: number;
  zoom: number;
}

/** Full pipeline graph — serialized to JSON on the screening_pipelines table */
export interface PipelineGraph {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  viewport?: PipelineViewport;
}
