/**
 * PipelineSettingsPanel — side panel for pipeline-level metadata.
 */
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';

interface PipelineSettingsPanelProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onActivate: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

/**
 * Renders pipeline-level settings (name, description) and save actions.
 */
export function PipelineSettingsPanel({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  onActivate,
  isSaving,
  isDirty,
}: PipelineSettingsPanelProps): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <button
        onClick={() => navigate('/admin/pipelines')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex-shrink-0"
        title={t('pipelines.builder.backToPipelines', 'Back to Pipelines')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="hidden sm:inline">{t('pipelines.builder.back', 'Back')}</span>
      </button>
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('pipelines.builder.namePlaceholder', 'Pipeline name')}
            className="font-semibold text-base border-transparent hover:border-gray-300 focus:border-blue-400"
          />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <Input
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t('pipelines.builder.descPlaceholder', 'Description (optional)')}
            className="text-sm border-transparent hover:border-gray-300 focus:border-blue-400"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving
            ? t('common.saving', 'Saving...')
            : t('pipelines.builder.saveDraft', 'Save Draft')}
        </Button>
        <Button size="sm" onClick={onActivate} disabled={isSaving}>
          {t('pipelines.builder.activate', 'Activate')}
        </Button>
      </div>
    </div>
  );
}
