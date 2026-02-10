/**
 * Field configuration panel for editing field properties.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Checkbox,
  FormField,
  FormSection,
} from '@/components/ui';
import type { FormField as FormFieldType, SelectOption } from '@/@types/form';

export interface FieldConfigPanelProps {
  /** The field to configure. */
  field: FormFieldType;
  /** Callback when field is updated. */
  onUpdate: (field: FormFieldType) => void;
}

/**
 * FieldConfigPanel renders a panel for configuring field properties.
 */
export function FieldConfigPanel({ field, onUpdate }: FieldConfigPanelProps): ReactNode {
  const { t } = useTranslation();

  // Local state for immediate updates
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [helperText, setHelperText] = useState(field.helperText || '');
  const [required, setRequired] = useState(field.validation?.required || false);
  const [minLength, setMinLength] = useState(field.validation?.minLength?.toString() || '');
  const [maxLength, setMaxLength] = useState(field.validation?.maxLength?.toString() || '');
  const [min, setMin] = useState(field.validation?.min?.toString() || '');
  const [max, setMax] = useState(field.validation?.max?.toString() || '');
  const [options, setOptions] = useState<SelectOption[]>(field.options || []);

  // Sync local state when field changes
  useEffect(() => {
    setLabel(field.label);
    setPlaceholder(field.placeholder || '');
    setHelperText(field.helperText || '');
    setRequired(field.validation?.required || false);
    setMinLength(field.validation?.minLength?.toString() || '');
    setMaxLength(field.validation?.maxLength?.toString() || '');
    setMin(field.validation?.min?.toString() || '');
    setMax(field.validation?.max?.toString() || '');
    setOptions(field.options || []);
  }, [field]);

  // Debounced update - wrapped in useCallback to avoid stale closures
  const triggerUpdate = useCallback(() => {
    const updatedField: FormFieldType = {
      ...field,
      label,
      validation: { required },
    };

    // Only set optional properties if they have values
    if (placeholder) updatedField.placeholder = placeholder;
    if (helperText) updatedField.helperText = helperText;

    // Set validation rules based on field type
    if (field.type === 'text') {
      if (minLength) updatedField.validation!.minLength = parseInt(minLength, 10);
      if (maxLength) updatedField.validation!.maxLength = parseInt(maxLength, 10);
    }
    if (field.type === 'number') {
      if (min) updatedField.validation!.min = parseFloat(min);
      if (max) updatedField.validation!.max = parseFloat(max);
    }
    if (field.type === 'select') {
      updatedField.options = options;
    }
    onUpdate(updatedField);
  }, [field, label, placeholder, helperText, required, minLength, maxLength, min, max, options, onUpdate]);

  const handleAddOption = () => {
    const newOption: SelectOption = {
      value: `option${options.length + 1}`,
      label: `Option ${options.length + 1}`,
    };
    setOptions([...options, newOption]);
  };

  const handleUpdateOption = (index: number, key: 'value' | 'label', value: string) => {
    const newOptions = [...options];
    const existingOption = newOptions[index]!;
    newOptions[index] = { value: existingOption.value, label: existingOption.label, [key]: value };
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <FormSection title={t('forms.config.general')}>
        <FormField label={t('forms.config.label')} required>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={triggerUpdate}
          />
        </FormField>

        <FormField label={t('forms.config.placeholder')}>
          <Input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            onBlur={triggerUpdate}
          />
        </FormField>

        <FormField label={t('forms.config.helperText')}>
          <Input
            value={helperText}
            onChange={(e) => setHelperText(e.target.value)}
            onBlur={triggerUpdate}
          />
        </FormField>

        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            checked={required}
            onCheckedChange={(checked) => {
              setRequired(Boolean(checked));
              setTimeout(triggerUpdate, 0);
            }}
          />
          <label htmlFor="required" className="text-sm text-foreground">
            {t('forms.config.required')}
          </label>
        </div>
      </FormSection>

      {field.type === 'text' && (
        <FormSection title={t('forms.config.validation')}>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('forms.config.minLength')}>
              <Input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                onBlur={triggerUpdate}
                min={0}
              />
            </FormField>
            <FormField label={t('forms.config.maxLength')}>
              <Input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
                onBlur={triggerUpdate}
                min={0}
              />
            </FormField>
          </div>
        </FormSection>
      )}

      {field.type === 'number' && (
        <FormSection title={t('forms.config.validation')}>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('forms.config.min')}>
              <Input
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                onBlur={triggerUpdate}
              />
            </FormField>
            <FormField label={t('forms.config.max')}>
              <Input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                onBlur={triggerUpdate}
              />
            </FormField>
          </div>
        </FormSection>
      )}

      {field.type === 'select' && (
        <FormSection title={t('forms.config.options')}>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.value}
                  onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                  onBlur={triggerUpdate}
                  placeholder={t('forms.config.optionValue')}
                  className="flex-1"
                />
                <Input
                  value={option.label}
                  onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                  onBlur={triggerUpdate}
                  placeholder={t('forms.config.optionLabel')}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('forms.config.removeOption', { label: option.label })}
                  onClick={() => {
                    handleRemoveOption(index);
                    setTimeout(triggerUpdate, 0);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleAddOption();
                setTimeout(triggerUpdate, 0);
              }}
            >
              {t('forms.config.addOption')}
            </Button>
          </div>
        </FormSection>
      )}
    </div>
  );
}
