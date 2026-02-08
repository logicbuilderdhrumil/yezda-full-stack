/**
 * PipelineTemplateGallery — dialog showing pre-built pipeline templates
 * that users can choose to start a new pipeline from.
 */
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Badge } from '@/components/ui';
import type { ModuleType } from './types';

// ---------------------------------------------------------------------------
// Template Data Model
// ---------------------------------------------------------------------------

export interface PipelineTemplateStage {
  name: string;
  moduleType: ModuleType;
  moduleConfig: Record<string, unknown>;
  order: number;
  isRequired: boolean;
  estimatedDurationMinutes?: number;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'screening' | 'verification' | 'collection';
  stages: PipelineTemplateStage[];
}

// ---------------------------------------------------------------------------
// Built-in Templates
// ---------------------------------------------------------------------------

const BUILT_IN_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'standard-dbs',
    name: 'Standard DBS Check',
    description:
      'Personal information collection, DBS check via external service, and manager review',
    category: 'screening',
    stages: [
      {
        name: 'Personal Information',
        moduleType: 'form',
        moduleConfig: {},
        order: 0,
        isRequired: true,
        estimatedDurationMinutes: 15,
      },
      {
        name: 'DBS External Check',
        moduleType: 'external_service',
        moduleConfig: {
          provider: 'dbs',
          apiKeyRef: '',
          endpoint: '',
          fieldMapping: [],
          timeout: 30000,
        },
        order: 1,
        isRequired: true,
        estimatedDurationMinutes: 1440,
      },
      {
        name: 'Manager Review',
        moduleType: 'human_review',
        moduleConfig: {
          assigneeRole: 'manager',
          decisionOptions: ['approved', 'rejected', 'more_info_needed'],
          timeoutHours: 48,
          escalationPolicy: { action: 'notify_manager' },
        },
        order: 2,
        isRequired: true,
        estimatedDurationMinutes: 60,
      },
    ],
  },
  {
    id: 'right-to-work',
    name: 'Right to Work',
    description: 'Document upload and automated ID verification',
    category: 'verification',
    stages: [
      {
        name: 'Document Upload',
        moduleType: 'form',
        moduleConfig: {},
        order: 0,
        isRequired: true,
        estimatedDurationMinutes: 10,
      },
      {
        name: 'ID Verification',
        moduleType: 'external_service',
        moduleConfig: {
          provider: 'id-verification',
          apiKeyRef: '',
          endpoint: '',
          fieldMapping: [],
          timeout: 60000,
        },
        order: 1,
        isRequired: true,
        estimatedDurationMinutes: 5,
      },
    ],
  },
  {
    id: 'full-background',
    name: 'Full Background Check',
    description:
      'Comprehensive background screening with employment history, references, and criminal record check',
    category: 'screening',
    stages: [
      {
        name: 'Personal Information',
        moduleType: 'form',
        moduleConfig: {},
        order: 0,
        isRequired: true,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Employment History',
        moduleType: 'form',
        moduleConfig: {},
        order: 1,
        isRequired: true,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Reference Check',
        moduleType: 'external_service',
        moduleConfig: {
          provider: 'reference-check',
          apiKeyRef: '',
          endpoint: '',
          fieldMapping: [],
          timeout: 120000,
        },
        order: 2,
        isRequired: true,
        estimatedDurationMinutes: 4320,
      },
      {
        name: 'Criminal Record Check',
        moduleType: 'external_service',
        moduleConfig: {
          provider: 'criminal-record',
          apiKeyRef: '',
          endpoint: '',
          fieldMapping: [],
          timeout: 60000,
        },
        order: 3,
        isRequired: true,
        estimatedDurationMinutes: 2880,
      },
      {
        name: 'Manager Review',
        moduleType: 'human_review',
        moduleConfig: {
          assigneeRole: 'manager',
          decisionOptions: ['approved', 'rejected', 'escalated'],
          timeoutHours: 72,
          escalationPolicy: { action: 'notify_manager' },
        },
        order: 4,
        isRequired: true,
        estimatedDurationMinutes: 120,
      },
    ],
  },
  {
    id: 'simple-form',
    name: 'Simple Form Collection',
    description: 'Single form for collecting candidate information',
    category: 'collection',
    stages: [
      {
        name: 'Information Form',
        moduleType: 'form',
        moduleConfig: {},
        order: 0,
        isRequired: true,
        estimatedDurationMinutes: 15,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module type badge styling
// ---------------------------------------------------------------------------

const MODULE_BADGE_COLORS: Record<ModuleType, string> = {
  form: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  external_service:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  internal_processing:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  human_review:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  notification:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const MODULE_ICONS: Record<ModuleType, string> = {
  form: '📝',
  external_service: '🌐',
  internal_processing: '⚙️',
  human_review: '👤',
  notification: '🔔',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PipelineTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: PipelineTemplate) => void;
}

export function PipelineTemplateGallery({
  open,
  onOpenChange,
  onSelectTemplate,
}: PipelineTemplateGalleryProps): ReactNode {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: t('common.all', 'All') },
    {
      id: 'screening',
      label: t('pipelines.templates.categories.screening', 'Screening'),
    },
    {
      id: 'verification',
      label: t('pipelines.templates.categories.verification', 'Verification'),
    },
    {
      id: 'collection',
      label: t('pipelines.templates.categories.collection', 'Collection'),
    },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? BUILT_IN_TEMPLATES
      : BUILT_IN_TEMPLATES.filter((t) => t.category === selectedCategory);

  function handleSelect(template: PipelineTemplate) {
    onSelectTemplate(template);
    onOpenChange(false);
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('pipelines.templates.title', 'Pipeline Templates')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t(
                'pipelines.templates.description',
                'Start with a pre-built template'
              )}
            </p>
          </div>

          {/* Category filter */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                const totalMinutes = template.stages.reduce(
                  (sum, s) => sum + (s.estimatedDurationMinutes ?? 0),
                  0
                );
                const uniqueModuleTypes = [
                  ...new Set(template.stages.map((s) => s.moduleType)),
                ];

                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleSelect(template)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(template);
                      }
                    }}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Stage count + duration */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {t('pipelines.templates.stages', '{{count}} stages', {
                          count: template.stages.length,
                        })}
                      </span>
                      {totalMinutes > 0 && (
                        <span>~{formatDuration(totalMinutes)}</span>
                      )}
                    </div>

                    {/* Module type badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {uniqueModuleTypes.map((type) => (
                        <span
                          key={type}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${MODULE_BADGE_COLORS[type]}`}
                        >
                          <span>{MODULE_ICONS[type]}</span>
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
