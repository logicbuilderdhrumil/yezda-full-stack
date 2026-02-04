/**
 * Field palette for dragging field types onto the form canvas.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { FIELD_TYPE_CONFIGS, type FormField } from '@/@types/form';

export interface FieldPaletteProps {
  /** Callback when a field type is added. */
  onAddField: (field: Omit<FormField, 'id'>) => void;
}

/**
 * Renders an icon based on the icon name.
 */
function FieldIcon({ name }: { name: string }): ReactNode {
  const iconMap: Record<string, string> = {
    Type: 'Aa',
    Hash: '#',
    Calendar: '📅',
    List: '☰',
    Upload: '📎',
  };
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-bold dark:bg-gray-800">
      {iconMap[name] || '?'}
    </span>
  );
}

/**
 * FieldPalette displays available field types for the form builder.
 */
export function FieldPalette({ onAddField }: FieldPaletteProps): ReactNode {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('forms.builder.paletteHint')}
      </p>
      <div className="space-y-2">
        {FIELD_TYPE_CONFIGS.map((config) => (
          <Button
            key={config.type}
            variant="outline"
            className="flex w-full items-center justify-start gap-3"
            onClick={() => onAddField(config.defaultField)}
          >
            <FieldIcon name={config.icon} />
            <span>{t(`forms.fieldTypes.${config.type}`)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
