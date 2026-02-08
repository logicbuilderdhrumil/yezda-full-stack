/**
 * Pipeline builder types used across the builder components.
 */
import type { Node, Edge } from '@xyflow/react';

/** Module type enum matching shared types */
export type ModuleType =
  | 'form'
  | 'external_service'
  | 'internal_processing'
  | 'human_review'
  | 'notification';

/** Node types including start/end */
export type PipelineNodeType = ModuleType | 'start' | 'end';

/** Data attached to each pipeline node */
export interface PipelineNodeData {
  label: string;
  stageId?: string;
  moduleType?: ModuleType;
  moduleConfig?: Record<string, unknown>;
  isRequired?: boolean;
  estimatedDurationMinutes?: number;
  [key: string]: unknown;
}

/** Typed React Flow Node for the pipeline builder */
export type PipelineNode = Node<PipelineNodeData, PipelineNodeType>;

/** Typed React Flow Edge for the pipeline builder */
export type PipelineEdge = Edge;

/** Serializable pipeline graph */
export interface PipelineGraph {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

/** Module type metadata for the sidebar */
export interface ModuleTypeInfo {
  type: ModuleType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/** Module catalogue for the sidebar */
export const MODULE_TYPES: ModuleTypeInfo[] = [
  {
    type: 'form',
    label: 'Form',
    description: 'Collect data via a customisable form',
    icon: '📝',
    color: '#3b82f6',
  },
  {
    type: 'external_service',
    label: 'External Service',
    description: 'Call an external API',
    icon: '🌐',
    color: '#8b5cf6',
  },
  {
    type: 'internal_processing',
    label: 'Internal Processing',
    description: 'Run internal data processing',
    icon: '⚙️',
    color: '#f59e0b',
  },
  {
    type: 'human_review',
    label: 'Human Review',
    description: 'Require staff review & decision',
    icon: '👤',
    color: '#10b981',
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send email, SMS, or in-app alert',
    icon: '🔔',
    color: '#ef4444',
  },
];

/** Validation error for pipeline graph */
export interface PipelineValidationError {
  nodeId?: string;
  message: string;
  severity: 'error' | 'warning';
}
