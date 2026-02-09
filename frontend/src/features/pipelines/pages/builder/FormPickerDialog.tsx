/**
 * FormPickerDialog — modal for selecting an existing form or creating a new one
 * within the pipeline builder context.
 */
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  LoadingSpinner,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastError,
} from '@/components/ui';
import { FormsService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type { Form, FormStatus } from '@/@types/form';

export interface FormPickerDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onOpenChange: (open: boolean) => void;
  /** Called when a form is selected – returns the form ID. */
  onSelect: (formId: string, formName: string) => void;
  /** Currently selected form ID (for highlighting). */
  selectedFormId?: string;
}

const PAGE_SIZE = 20;

/**
 * Returns badge variant for form status.
 */
function getStatusVariant(status: FormStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * FormPickerDialog provides a searchable list of existing forms to pick from
 * when configuring a form module node in the pipeline builder.
 */
export function FormPickerDialog({
  open,
  onOpenChange,
  onSelect,
  selectedFormId,
}: FormPickerDialogProps): ReactNode {
  const { t } = useTranslation();

  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [highlightedId, setHighlightedId] = useState<string | undefined>(selectedFormId);

  // Fetch forms whenever search/filter changes
  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        search?: string;
        status?: FormStatus;
        sortBy: 'updatedAt';
        sortOrder: 'desc';
      } = {
        page: 1,
        pageSize: PAGE_SIZE,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await FormsService.list(params);
      setForms(response?.data ?? []);
    } catch {
      toastError(t('forms.picker.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, t]);

  useEffect(() => {
    if (open) {
      fetchForms();
    }
  }, [open, fetchForms]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchInput('');
      setSearchQuery('');
      setStatusFilter('all');
      setHighlightedId(selectedFormId);
    }
  }, [open, selectedFormId]);

  // Debounced search
  const debouncedSetSearch = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        setSearchQuery(args[0] as string);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel?.();
    };
  }, [debouncedSetSearch]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as FormStatus | 'all');
  };

  const handleSelect = (form: Form) => {
    onSelect(form.id, form.name);
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    // Navigate to form creation – open in new tab to avoid losing pipeline state
    window.open('/admin/forms/new', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('forms.picker.title')}</DialogTitle>
          <DialogDescription>{t('forms.picker.description')}</DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            type="search"
            placeholder={t('forms.picker.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('forms.list.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('forms.status.all')}</SelectItem>
              <SelectItem value="draft">{t('forms.status.draft')}</SelectItem>
              <SelectItem value="published">{t('forms.status.published')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Form list */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12">
              <LoadingSpinner className="h-6 w-6" />
            </div>
          ) : forms.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('forms.picker.noResults')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {forms.map((form) => {
                const fieldCount = form.schema?.fields?.length ?? 0;
                const isSelected = highlightedId === form.id;
                return (
                  <button
                    key={form.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setHighlightedId(form.id)}
                    onDoubleClick={() => handleSelect(form)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {form.name}
                          </span>
                          <Badge variant={getStatusVariant(form.status)}>
                            {t(`forms.status.${form.status}`)}
                          </Badge>
                          {form.schema?.version != null && (
                            <Badge variant="secondary" className="text-xs">
                              v{form.schema.version}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {t('forms.picker.fieldCount', { count: fieldCount })}
                          </span>
                          <span>·</span>
                          <span>
                            {t('forms.picker.lastEdited', {
                              date: formatDate(form.updatedAt),
                            })}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(form);
                          }}
                        >
                          {t('forms.picker.selectButton')}
                        </Button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="outline" onClick={handleCreateNew}>
            {t('forms.picker.createNew')}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
