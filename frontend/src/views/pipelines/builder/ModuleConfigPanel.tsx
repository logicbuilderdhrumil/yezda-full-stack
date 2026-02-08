/**
 * ModuleConfigPanel — slide-over panel for configuring a selected pipeline node.
 * Shows per-module-type configuration forms.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { PipelineNodeData } from './types';
import { FormPickerDialog } from './FormPickerDialog';

interface ModuleConfigPanelProps {
  nodeId: string;
  nodeData: PipelineNodeData;
  onUpdate: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

/**
 * Renders the configuration panel for a selected pipeline builder node.
 */
export function ModuleConfigPanel({
  nodeId,
  nodeData,
  onUpdate,
  onClose,
  onDelete,
}: ModuleConfigPanelProps): ReactNode {
  const { t } = useTranslation();
  const [label, setLabel] = useState(nodeData.label);
  const moduleType = nodeData.moduleType;
  const config = (nodeData.moduleConfig ?? {}) as Record<string, unknown>;

  useEffect(() => {
    setLabel(nodeData.label);
  }, [nodeData.label]);

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(nodeId, {
      moduleConfig: { ...config, [key]: value },
    });
  };

  const handleLabelBlur = () => {
    if (label.trim() && label !== nodeData.label) {
      onUpdate(nodeId, { label: label.trim() });
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('pipelines.builder.configTitle', 'Module Settings')}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1">
          <Label htmlFor="node-label">{t('pipelines.builder.label', 'Label')}</Label>
          <Input
            id="node-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
          />
        </div>

        {/* Module-type-specific fields */}
        {moduleType === 'form' && (
          <FormConfigFields config={config} onUpdate={updateConfig} />
        )}
        {moduleType === 'external_service' && (
          <ExternalServiceConfigFields config={config} onUpdate={updateConfig} />
        )}
        {moduleType === 'internal_processing' && (
          <InternalProcessingConfigFields config={config} onUpdate={updateConfig} />
        )}
        {moduleType === 'human_review' && (
          <HumanReviewConfigFields config={config} onUpdate={updateConfig} />
        )}
        {moduleType === 'notification' && (
          <NotificationConfigFields config={config} onUpdate={updateConfig} />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDelete(nodeId)}
        >
          {t('pipelines.builder.deleteNode', 'Remove Module')}
        </Button>
      </div>
    </div>
  );
}

/* ---------- per-type config forms ---------- */

interface ConfigFieldsProps {
  config: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}

function FormConfigFields({ config, onUpdate }: ConfigFieldsProps): ReactNode {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const formId = (config.formDefinitionId as string) ?? '';
  const formName = (config.formName as string) ?? '';

  const handleFormSelect = (selectedId: string, selectedName: string) => {
    onUpdate('formDefinitionId', selectedId);
    onUpdate('formName', selectedName);
  };

  return (
    <>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.formId', 'Form Definition')}</Label>
        {formId ? (
          <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {formName || t('forms.picker.unnamed')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                {formId}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              {t('forms.picker.change')}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-gray-500"
            onClick={() => setPickerOpen(true)}
          >
            {t('forms.picker.selectForm')}
          </Button>
        )}
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.formVersion', 'Form Version')}</Label>
        <Input
          type="number"
          value={(config.formVersion as number) ?? ''}
          onChange={(e) =>
            onUpdate('formVersion', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          placeholder="Latest"
        />
      </div>
      <FormPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleFormSelect}
        selectedFormId={formId || undefined}
      />
    </>
  );
}

function ExternalServiceConfigFields({ config, onUpdate }: ConfigFieldsProps): ReactNode {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.provider', 'Provider')}</Label>
        <Input
          value={(config.provider as string) ?? ''}
          onChange={(e) => onUpdate('provider', e.target.value)}
          placeholder="e.g. CreditSafe, TrustPilot"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.endpoint', 'Endpoint URL')}</Label>
        <Input
          value={(config.endpoint as string) ?? ''}
          onChange={(e) => onUpdate('endpoint', e.target.value)}
          placeholder="https://api.example.com/check"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.apiKeyRef', 'API Key Ref')}</Label>
        <Input
          value={(config.apiKeyRef as string) ?? ''}
          onChange={(e) => onUpdate('apiKeyRef', e.target.value)}
          placeholder="Encrypted key reference"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.timeout', 'Timeout (ms)')}</Label>
        <Input
          type="number"
          value={(config.timeout as number) ?? ''}
          onChange={(e) =>
            onUpdate('timeout', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          placeholder="30000"
        />
      </div>
    </>
  );
}

function InternalProcessingConfigFields({ config, onUpdate }: ConfigFieldsProps): ReactNode {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.processor', 'Processor')}</Label>
        <Input
          value={(config.processor as string) ?? ''}
          onChange={(e) => onUpdate('processor', e.target.value)}
          placeholder="e.g. ocr, risk_score, dedup"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.timeout', 'Timeout (ms)')}</Label>
        <Input
          type="number"
          value={(config.timeout as number) ?? ''}
          onChange={(e) =>
            onUpdate('timeout', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          placeholder="60000"
        />
      </div>
    </>
  );
}

function HumanReviewConfigFields({ config, onUpdate }: ConfigFieldsProps): ReactNode {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.assigneeRole', 'Assignee Role')}</Label>
        <Input
          value={(config.assigneeRole as string) ?? ''}
          onChange={(e) => onUpdate('assigneeRole', e.target.value)}
          placeholder="e.g. reviewer, manager"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.decisionOptions', 'Decision Options (comma-separated)')}</Label>
        <Input
          value={Array.isArray(config.decisionOptions) ? (config.decisionOptions as string[]).join(', ') : ''}
          onChange={(e) =>
            onUpdate(
              'decisionOptions',
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="Approve, Reject, More Info"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.timeoutHours', 'Timeout (hours)')}</Label>
        <Input
          type="number"
          value={(config.timeoutHours as number) ?? ''}
          onChange={(e) =>
            onUpdate('timeoutHours', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          placeholder="48"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.escalation', 'Escalation Policy')}</Label>
        <Select
          value={(config.escalationPolicy as string) ?? ''}
          onValueChange={(v) => onUpdate('escalationPolicy', v || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reassign">Reassign</SelectItem>
            <SelectItem value="notify_manager">Notify Manager</SelectItem>
            <SelectItem value="auto_approve">Auto Approve</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function NotificationConfigFields({ config, onUpdate }: ConfigFieldsProps): ReactNode {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.channel', 'Channel')}</Label>
        <Select
          value={(config.channel as string) ?? ''}
          onValueChange={(v) => onUpdate('channel', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="in_app">In-App</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.templateId', 'Template ID')}</Label>
        <Input
          value={(config.templateId as string) ?? ''}
          onChange={(e) => onUpdate('templateId', e.target.value)}
          placeholder="Notification template"
        />
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.recipientType', 'Recipient')}</Label>
        <Select
          value={(config.recipientType as string) ?? ''}
          onValueChange={(v) => onUpdate('recipientType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="candidate">Candidate</SelectItem>
            <SelectItem value="assignee">Assignee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t('pipelines.builder.triggerOn', 'Trigger On')}</Label>
        <Select
          value={(config.triggerOn as string) ?? ''}
          onValueChange={(v) => onUpdate('triggerOn', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Stage enter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enter">Stage Enter</SelectItem>
            <SelectItem value="complete">Stage Complete</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
