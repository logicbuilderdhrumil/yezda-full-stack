/**
 * Form-related types for the form builder.
 */

/** Available field types in the form builder. */
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'file';

/** Validation rule for a form field. */
export interface FieldValidation {
  /** Whether the field is required. */
  required?: boolean;
  /** Minimum value for number fields. */
  min?: number;
  /** Maximum value for number fields. */
  max?: number;
  /** Minimum length for text fields. */
  minLength?: number;
  /** Maximum length for text fields. */
  maxLength?: number;
  /** Regex pattern for text fields. */
  pattern?: string;
  /** Allowed file types for file fields (e.g., ['image/*', 'application/pdf']). */
  allowedFileTypes?: string[];
  /** Maximum file size in bytes. */
  maxFileSize?: number;
}

/** Select field option. */
export interface SelectOption {
  /** Option value. */
  value: string;
  /** Option display label. */
  label: string;
}

/** Field definition within a form schema. */
export interface FormField {
  /** Unique field identifier. */
  id: string;
  /** Field type. */
  type: FieldType;
  /** Field label displayed to users. */
  label: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Help text displayed below the field. */
  helperText?: string;
  /** Validation rules. */
  validation?: FieldValidation;
  /** Options for select fields. */
  options?: SelectOption[];
  /** Default value. */
  defaultValue?: string | number;
}

/** Form schema containing ordered fields. */
export interface FormSchema {
  /** Ordered list of fields. */
  fields: FormField[];
  /** Schema version for migrations. */
  version: number;
}

/** Form status. */
export type FormStatus = 'draft' | 'published' | 'archived';

/** Form record. */
export interface Form {
  id: string;
  /** Form name. */
  name: string;
  /** Form description. */
  description?: string;
  /** Form status. */
  status: FormStatus;
  /** Form schema with field definitions. */
  schema: FormSchema;
  /** Organization ID. */
  organizationId?: string;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}

/** Payload for creating a form. */
export interface CreateFormPayload {
  name: string;
  description?: string;
  status?: FormStatus;
  schema?: FormSchema;
  organizationId?: string;
}

/** Payload for updating a form. */
export interface UpdateFormPayload {
  name?: string;
  description?: string;
  status?: FormStatus;
  schema?: FormSchema;
}

/** Filter parameters for listing forms. */
export interface FormListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FormStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated list response for forms. */
export interface FormListResponse {
  data: Form[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Table column definition for forms. */
export interface FormColumn {
  key: keyof Form | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the forms list. */
export const FORM_COLUMNS: FormColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];

/** Default empty form schema. */
export const EMPTY_FORM_SCHEMA: FormSchema = {
  fields: [],
  version: 1,
};

/** Field type configuration for the builder palette. */
export interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: string;
  defaultField: Omit<FormField, 'id'>;
}

/** Available field types for the builder palette. */
export const FIELD_TYPE_CONFIGS: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text',
    icon: 'Type',
    defaultField: {
      type: 'text',
      label: 'Text Field',
      placeholder: 'Enter text...',
      validation: {},
    },
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    defaultField: {
      type: 'number',
      label: 'Number Field',
      placeholder: 'Enter number...',
      validation: {},
    },
  },
  {
    type: 'date',
    label: 'Date',
    icon: 'Calendar',
    defaultField: {
      type: 'date',
      label: 'Date Field',
      validation: {},
    },
  },
  {
    type: 'select',
    label: 'Select',
    icon: 'List',
    defaultField: {
      type: 'select',
      label: 'Select Field',
      options: [{ value: 'option1', label: 'Option 1' }],
      validation: {},
    },
  },
  {
    type: 'file',
    label: 'File',
    icon: 'Upload',
    defaultField: {
      type: 'file',
      label: 'File Upload',
      validation: { allowedFileTypes: ['*/*'] },
    },
  },
];
