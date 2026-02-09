/**
 * Custom node components for the pipeline builder canvas.
 * Each module type gets its own node with tailored display.
 */
import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { PipelineNodeData, ModuleType } from './types';

/** Props for custom module nodes */
interface ModuleNodeProps {
  data: PipelineNodeData;
  selected?: boolean;
}

/** Props for start/end sentinel nodes */
interface SentinelNodeProps {
  selected?: boolean;
}

/** Module color map */
const MODULE_COLORS: Record<ModuleType | 'start' | 'end', string> = {
  form: '#3b82f6',
  external_service: '#8b5cf6',
  internal_processing: '#f59e0b',
  human_review: '#10b981',
  notification: '#ef4444',
  start: '#6b7280',
  end: '#6b7280',
};

/** Module icon map */
const MODULE_ICONS: Record<ModuleType | 'start' | 'end', string> = {
  form: '📝',
  external_service: '🌐',
  internal_processing: '⚙️',
  human_review: '👤',
  notification: '🔔',
  start: '▶️',
  end: '🏁',
};

/** Base node wrapper with consistent styling */
function BaseNode({
  children,
  color,
  icon,
  label,
  selected,
  hasSource = true,
  hasTarget = true,
}: {
  children?: ReactNode;
  color: string;
  icon: string;
  label: string;
  selected: boolean | undefined;
  hasSource?: boolean | undefined;
  hasTarget?: boolean | undefined;
}): ReactNode {
  return (
    <div
      className={`
        min-w-[180px] max-w-[220px] rounded-lg border-2 bg-white dark:bg-gray-800 shadow-sm
        transition-shadow
        ${selected ? 'shadow-lg ring-2 ring-blue-400' : 'hover:shadow-md'}
      `}
      style={{ borderColor: color }}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-800"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: `${color}10` }}>
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold truncate" style={{ color }}>
          {label}
        </span>
      </div>
      {children && (
        <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
          {children}
        </div>
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-800"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

/** Start node — pipeline entry, source-only */
export const StartNode = memo(function StartNode({ selected }: SentinelNodeProps) {
  return (
    <BaseNode
      color={MODULE_COLORS.start}
      icon={MODULE_ICONS.start}
      label="Start"
      selected={selected}
      hasTarget={false}
    />
  );
});

/** End node — pipeline completion, target-only */
export const EndNode = memo(function EndNode({ selected }: SentinelNodeProps) {
  return (
    <BaseNode
      color={MODULE_COLORS.end}
      icon={MODULE_ICONS.end}
      label="End"
      selected={selected}
      hasSource={false}
    />
  );
});

/** Form module node */
export const FormModuleNode = memo(function FormModuleNode({
  data,
  selected,
}: ModuleNodeProps) {
  const config = data.moduleConfig as { formDefinitionId?: string } | undefined;
  return (
    <BaseNode color={MODULE_COLORS.form} icon={MODULE_ICONS.form} label={data.label} selected={selected}>
      {config?.formDefinitionId ? (
        <span className="truncate block">Form linked</span>
      ) : (
        <span className="text-amber-500">No form selected</span>
      )}
    </BaseNode>
  );
});

/** External service module node */
export const ExternalServiceNode = memo(function ExternalServiceNode({
  data,
  selected,
}: ModuleNodeProps) {
  const config = data.moduleConfig as { provider?: string } | undefined;
  return (
    <BaseNode
      color={MODULE_COLORS.external_service}
      icon={MODULE_ICONS.external_service}
      label={data.label}
      selected={selected}
    >
      {config?.provider ? (
        <span className="truncate block">{config.provider}</span>
      ) : (
        <span className="text-amber-500">No provider set</span>
      )}
    </BaseNode>
  );
});

/** Internal processing module node */
export const InternalProcessingNode = memo(function InternalProcessingNode({
  data,
  selected,
}: ModuleNodeProps) {
  const config = data.moduleConfig as { processor?: string } | undefined;
  return (
    <BaseNode
      color={MODULE_COLORS.internal_processing}
      icon={MODULE_ICONS.internal_processing}
      label={data.label}
      selected={selected}
    >
      {config?.processor ? (
        <span className="truncate block">{config.processor}</span>
      ) : (
        <span className="text-amber-500">No processor set</span>
      )}
    </BaseNode>
  );
});

/** Human review module node */
export const HumanReviewNode = memo(function HumanReviewNode({
  data,
  selected,
}: ModuleNodeProps) {
  const config = data.moduleConfig as { assigneeRole?: string; decisionOptions?: string[] } | undefined;
  return (
    <BaseNode
      color={MODULE_COLORS.human_review}
      icon={MODULE_ICONS.human_review}
      label={data.label}
      selected={selected}
    >
      {config?.assigneeRole ? (
        <div>
          <span className="block truncate">Role: {config.assigneeRole}</span>
          {config.decisionOptions && (
            <span className="block text-gray-400 truncate">
              {config.decisionOptions.length} decision option(s)
            </span>
          )}
        </div>
      ) : (
        <span className="text-amber-500">No role assigned</span>
      )}
    </BaseNode>
  );
});

/** Notification module node */
export const NotificationNode = memo(function NotificationNode({
  data,
  selected,
}: ModuleNodeProps) {
  const config = data.moduleConfig as { channel?: string; templateId?: string } | undefined;
  return (
    <BaseNode
      color={MODULE_COLORS.notification}
      icon={MODULE_ICONS.notification}
      label={data.label}
      selected={selected}
    >
      {config?.channel ? (
        <span className="truncate block capitalize">{config.channel}</span>
      ) : (
        <span className="text-amber-500">No channel set</span>
      )}
    </BaseNode>
  );
});

/** Map of node type strings to React components */
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  form: FormModuleNode,
  external_service: ExternalServiceNode,
  internal_processing: InternalProcessingNode,
  human_review: HumanReviewNode,
  notification: NotificationNode,
};
