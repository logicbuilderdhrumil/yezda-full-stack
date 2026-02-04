/**
 * Form field wrappers with validation states and helper text.
 */
import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/utils';
import { Label } from './Label';

// ============================================================================
// FORM FIELD CONTEXT
// ============================================================================

interface FormFieldContextValue {
  id: string;
  errorId?: string;
  helperId?: string;
  error?: string;
  required?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within FormField');
  }
  return context;
}

// ============================================================================
// FORM FIELD
// ============================================================================

export interface FormFieldProps {
  children: ReactNode;
  /** Field label. */
  label?: string;
  /** Error message. */
  error?: string | undefined;
  /** Helper text. */
  helperText?: string;
  /** Mark as required. */
  required?: boolean;
  /** Custom ID for the field. */
  id?: string;
  className?: string;
}

/**
 * Form field wrapper with label, error, and helper text.
 */
export function FormField({
  children,
  label,
  error,
  helperText,
  required,
  id: customId,
  className,
}: FormFieldProps): ReactNode {
  const generatedId = useId();
  const id = customId ?? generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const contextValue: FormFieldContextValue = { id, errorId, helperId };
  if (error !== undefined) contextValue.error = error;
  if (required !== undefined) contextValue.required = required;

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id} required={required === true}>
            {label}
          </Label>
        )}
        <div
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
        >
          {children}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

// ============================================================================
// FORM SECTION
// ============================================================================

export interface FormSectionProps {
  children: ReactNode;
  /** Section title. */
  title?: string;
  /** Section description. */
  description?: string;
  className?: string;
}

/**
 * Group related form fields.
 */
export function FormSection({
  children,
  title,
  description,
  className,
}: FormSectionProps): ReactNode {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <legend className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </legend>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </fieldset>
  );
}

// ============================================================================
// FORM ACTIONS
// ============================================================================

export interface FormActionsProps {
  children: ReactNode;
  /** Align actions. */
  align?: 'left' | 'right' | 'center' | 'between';
  className?: string;
}

/**
 * Form action buttons container.
 */
export function FormActions({
  children,
  align = 'right',
  className,
}: FormActionsProps): ReactNode {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  };

  return (
    <div className={cn('flex gap-3 pt-4', alignClasses[align], className)}>
      {children}
    </div>
  );
}

export { useFormField };
