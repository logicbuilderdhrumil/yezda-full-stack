/**
 * Shared pipeline module types.
 * Used by both frontend and backend for type-safe pipeline builder support.
 */

/** Available module types for pipeline stages */
export type ModuleType =
  | 'form'
  | 'external_service'
  | 'internal_processing'
  | 'human_review'
  | 'notification';

/** Form module configuration */
export interface FormModuleConfig {
  formDefinitionId: string;
  formVersion?: number;
}

/** External service module configuration */
export interface ExternalServiceModuleConfig {
  provider: string;
  apiKeyRef?: string;
  endpoint?: string;
  fieldMapping?: Record<string, string>;
  webhookUrl?: string;
  timeout?: number;
}

/** Internal processing module configuration */
export interface InternalProcessingModuleConfig {
  processor: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  timeout?: number;
}

/** Human review module configuration */
export interface HumanReviewModuleConfig {
  assigneeRole: string;
  reviewFormId?: string;
  decisionOptions: string[];
  timeoutHours?: number;
  escalationPolicy?: 'reassign' | 'notify_manager' | 'auto_approve';
}

/** Notification module configuration */
export interface NotificationModuleConfig {
  channel: 'email' | 'sms' | 'in_app';
  templateId?: string;
  recipientType: 'candidate' | 'assignee' | 'manager' | 'custom';
  triggerOn?: 'enter' | 'complete' | 'error';
}

/** Discriminated union of all module configs */
export type ModuleConfig =
  | FormModuleConfig
  | ExternalServiceModuleConfig
  | InternalProcessingModuleConfig
  | HumanReviewModuleConfig
  | NotificationModuleConfig;

/** A node in the pipeline graph (visual layout) */
export interface PipelineNode {
  id: string;
  type: ModuleType | 'start' | 'end';
  position: { x: number; y: number };
  data: {
    stageId?: string;
    label: string;
    moduleConfig?: ModuleConfig;
  };
}

/** An edge in the pipeline graph (connection between nodes) */
export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/** Pipeline graph for serialization (React Flow state) */
export interface PipelineGraph {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

/** Module type metadata for the UI sidebar */
export interface ModuleTypeInfo {
  type: ModuleType;
  label: string;
  description: string;
  icon: string;
  color: string;
  candidateVisible: boolean;
}

/** Registry of all available module types */
export const MODULE_TYPE_INFO: ModuleTypeInfo[] = [
  {
    type: 'form',
    label: 'Form',
    description: 'Collect data from candidates via a customisable form',
    icon: 'FileText',
    color: '#3b82f6',
    candidateVisible: true,
  },
  {
    type: 'external_service',
    label: 'External Service',
    description: 'Call an external API (e.g. DBS check, credit report)',
    icon: 'Globe',
    color: '#8b5cf6',
    candidateVisible: false,
  },
  {
    type: 'internal_processing',
    label: 'Internal Processing',
    description: 'Run internal data processing (OCR, scoring, dedup)',
    icon: 'Cpu',
    color: '#f59e0b',
    candidateVisible: false,
  },
  {
    type: 'human_review',
    label: 'Human Review',
    description: 'Require a staff member to review and make a decision',
    icon: 'UserCheck',
    color: '#10b981',
    candidateVisible: false,
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send an email, SMS, or in-app notification',
    icon: 'Bell',
    color: '#ef4444',
    candidateVisible: false,
  },
];
