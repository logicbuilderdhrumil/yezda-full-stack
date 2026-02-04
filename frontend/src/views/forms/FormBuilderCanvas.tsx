/**
 * Form builder canvas with field palette and configuration panel.
 */
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '@/components/ui';
import { cn } from '@/utils';
import type { FormSchema, FormField } from '@/@types/form';
import { FieldPalette } from './FieldPalette';
import { FieldConfigPanel } from './FieldConfigPanel';
import { FormPreview } from './FormPreview';

export interface FormBuilderCanvasProps {
  /** Current form schema. */
  schema: FormSchema;
  /** Callback when schema changes. */
  onSchemaChange: (schema: FormSchema) => void;
  /** Save handler. */
  onSave: () => void;
  /** Cancel handler. */
  onCancel: () => void;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
  /** Form name for display. */
  formName?: string;
}

/**
 * Generates a unique field ID.
 */
function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * FormBuilderCanvas provides a visual form builder with drag-drop fields.
 */
export function FormBuilderCanvas({
  schema,
  onSchemaChange,
  onSave,
  onCancel,
  isSubmitting = false,
  formName,
}: FormBuilderCanvasProps): ReactNode {
  const { t } = useTranslation();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const selectedField = selectedFieldId
    ? schema.fields.find((f) => f.id === selectedFieldId)
    : null;

  const handleAddField = (field: Omit<FormField, 'id'>) => {
    const newField: FormField = {
      ...field,
      id: generateFieldId(),
    };
    onSchemaChange({
      ...schema,
      fields: [...schema.fields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  const handleUpdateField = (updatedField: FormField) => {
    onSchemaChange({
      ...schema,
      fields: schema.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
    });
  };

  const handleDeleteField = (fieldId: string) => {
    onSchemaChange({
      ...schema,
      fields: schema.fields.filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = schema.fields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= schema.fields.length) return;

    const newFields = [...schema.fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onSchemaChange({ ...schema, fields: newFields });
  };

  if (showPreview) {
    return (
      <FormPreview
        schema={schema}
        formName={formName}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('forms.builder.title')}
          </h2>
          {formName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{formName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            {t('forms.builder.preview')}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Builder Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Field Palette */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('forms.builder.fieldPalette')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldPalette onAddField={handleAddField} />
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-6">
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="text-base">{t('forms.builder.canvas')}</CardTitle>
            </CardHeader>
            <CardContent>
              {schema.fields.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('forms.builder.emptyCanvas')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {schema.fields.map((field, index) => (
                    <div
                      key={field.id}
                      role="listitem"
                      tabIndex={0}
                      className={cn(
                        'group flex items-center gap-2 rounded-lg border p-3 transition-colors cursor-pointer',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        selectedFieldId === field.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                      onClick={() => setSelectedFieldId(field.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedFieldId(field.id);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          aria-label={t('forms.builder.moveUp', { label: field.label })}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(field.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          aria-label={t('forms.builder.moveDown', { label: field.label })}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(field.id, 'down');
                          }}
                          disabled={index === schema.fields.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase text-gray-400">
                            {field.type}
                          </span>
                          {field.validation?.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {field.label}
                        </p>
                        {field.helperText && (
                          <p className="text-sm text-gray-500">{field.helperText}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label={t('forms.builder.deleteField', { label: field.label })}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Config Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('forms.builder.configPanel')}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedField ? (
                <FieldConfigPanel field={selectedField} onUpdate={handleUpdateField} />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('forms.builder.selectField')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
