/**
 * Form preview component for previewing the built form.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
} from '@/components/ui';
import type { FormSchema, FormField as FormFieldType } from '@/@types/form';

export interface FormPreviewProps {
  /** Form schema to preview. */
  schema: FormSchema;
  /** Form name for display. */
  formName?: string;
  /** Close handler. */
  onClose: () => void;
}

/**
 * Renders a preview of a single form field.
 */
function PreviewField({ field }: { field: FormFieldType }): ReactNode {
  const { t } = useTranslation();

  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            disabled
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            disabled
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || t('forms.preview.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'file':
        return (
          <Input
            type="file"
            disabled
          />
        );
      default:
        return <Input disabled />;
    }
  };

  return (
    <FormField
      label={field.label}
      {...(field.helperText && { helperText: field.helperText })}
      {...(field.validation?.required !== undefined && { required: field.validation.required })}
    >
      {renderInput()}
    </FormField>
  );
}

/**
 * FormPreview renders a preview of the form as it would appear to users.
 */
export function FormPreview({ schema, formName, onClose }: FormPreviewProps): ReactNode {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('forms.preview.title')}
          </h2>
          {formName && (
            <p className="text-sm text-muted-foreground">{formName}</p>
          )}
        </div>
        <Button variant="outline" onClick={onClose}>
          {t('forms.preview.closePreview')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formName || t('forms.preview.untitled')}</CardTitle>
        </CardHeader>
        <CardContent>
          {schema.fields.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('forms.preview.noFields')}
            </p>
          ) : (
            <div className="space-y-4">
              {schema.fields.map((field) => (
                <PreviewField key={field.id} field={field} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('forms.preview.backToBuilder')}
        </Button>
        <Button disabled>
          {t('forms.preview.submit')}
        </Button>
      </div>
    </div>
  );
}
