/**
 * Pipeline create view with stages editor.
 */
import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Checkbox,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { PipelineService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreatePipelineDto } from '@/@types/pipeline';

/**
 * Generates a temporary ID for new stages.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface StageFormData {
  tempId: string;
  formDefinitionId: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  estimatedDurationMinutes: number | undefined;
}

/**
 * PipelineCreateView renders the form to create a new screening pipeline.
 */
export function PipelineCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<StageFormData[]>([
    {
      tempId: generateTempId(),
      formDefinitionId: '',
      name: '',
      description: '',
      order: 0,
      isRequired: true,
      estimatedDurationMinutes: undefined,
    },
  ]);

  const [errors, setErrors] = useState<{ name?: string; stages?: string }>({});

  const handleAddStage = () => {
    setStages((prev) => [
      ...prev,
      {
        tempId: generateTempId(),
        formDefinitionId: '',
        name: '',
        description: '',
        order: prev.length,
        isRequired: true,
        estimatedDurationMinutes: undefined,
      },
    ]);
  };

  const handleRemoveStage = (tempId: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.tempId !== tempId);
      return filtered.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const handleStageChange = (tempId: string, field: keyof StageFormData, value: unknown) => {
    setStages((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  const handleMoveStage = (tempId: string, direction: 'up' | 'down') => {
    setStages((prev) => {
      const idx = prev.findIndex((s) => s.tempId === tempId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const newStages = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = newStages[idx];
      newStages[idx] = newStages[swapIdx]!;
      newStages[swapIdx] = temp!;

      return newStages.map((s, i) => ({ ...s, order: i }));
    });
  };

  const validate = useCallback((): boolean => {
    const newErrors: { name?: string; stages?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('pipelines.validation.nameRequired', 'Pipeline name is required');
    }

    if (stages.length === 0) {
      newErrors.stages = t('pipelines.validation.stagesRequired', 'At least one stage is required');
    } else {
      const invalidStages = stages.filter((s) => !s.name.trim());
      if (invalidStages.length > 0) {
        newErrors.stages = t('pipelines.validation.stageNameRequired', 'All stages must have a name');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, stages, t]);

  const handleSave = async (activate: boolean = false) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreatePipelineDto = {
        name: name.trim(),
        stages: stages.map((s) => {
          const stage: {
            formDefinitionId: string;
            name: string;
            order: number;
            isRequired?: boolean;
            description?: string;
            estimatedDurationMinutes?: number;
          } = {
            formDefinitionId: s.formDefinitionId || '00000000-0000-0000-0000-000000000000',
            name: s.name.trim(),
            order: s.order,
            isRequired: s.isRequired,
          };
          const desc = s.description?.trim();
          if (desc) {
            stage.description = desc;
          }
          if (s.estimatedDurationMinutes !== undefined) {
            stage.estimatedDurationMinutes = s.estimatedDurationMinutes;
          }
          return stage;
        }),
      };
      const descTrimmed = description.trim();
      if (descTrimmed) {
        payload.description = descTrimmed;
      }

      const created = await PipelineService.create(payload);

      if (activate) {
        await PipelineService.activate(created.id);
        toastSuccess(t('pipelines.create.successActivated', 'Pipeline created and activated'));
      } else {
        toastSuccess(t('pipelines.create.success', 'Pipeline created successfully'));
      }

      navigate(`/admin/pipelines/${created.id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('pipelines.create.error', 'Failed to create pipeline'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/pipelines');
  };

  return (
    <PageContainer
      title={t('pipelines.create.title', 'Create Pipeline')}
      description={t('pipelines.create.description', 'Define a new screening pipeline with stages')}
    >
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancel}>
            ← {t('common.back', 'Back')}
          </Button>
        </div>

        {/* Pipeline info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pipelines.create.infoTitle', 'Pipeline Information')}</CardTitle>
            <CardDescription>
              {t('pipelines.create.infoDescription', 'Basic details about the pipeline')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">{t('pipelines.fields.name', 'Name')} *</Label>
              <Input
                id="pipeline-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('pipelines.fields.namePlaceholder', 'Enter pipeline name')}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline-description">{t('pipelines.fields.description', 'Description')}</Label>
              <Input
                id="pipeline-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('pipelines.fields.descriptionPlaceholder', 'Enter pipeline description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('pipelines.create.stagesTitle', 'Pipeline Stages')}</CardTitle>
                <CardDescription>
                  {t('pipelines.create.stagesDescription', 'Define the stages of the screening process')}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleAddStage}>
                {t('pipelines.actions.addStage', 'Add Stage')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.stages && <p className="text-sm text-red-500">{errors.stages}</p>}

            {stages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t('pipelines.create.noStages', 'No stages added yet. Click "Add Stage" to begin.')}
              </p>
            ) : (
              stages.map((stage, index) => (
                <Card key={stage.tempId} className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-gray-500">
                          {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStage(stage.tempId, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStage(stage.tempId, 'down')}
                          disabled={index === stages.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('pipelines.stage.name', 'Stage Name')} *</Label>
                          <Input
                            value={stage.name}
                            onChange={(e) => handleStageChange(stage.tempId, 'name', e.target.value)}
                            placeholder={t('pipelines.stage.namePlaceholder', 'Enter stage name')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('pipelines.stage.description', 'Description')}</Label>
                          <Input
                            value={stage.description || ''}
                            onChange={(e) => handleStageChange(stage.tempId, 'description', e.target.value)}
                            placeholder={t('pipelines.stage.descriptionPlaceholder', 'Optional description')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('pipelines.stage.formId', 'Form (placeholder)')}</Label>
                          <Input
                            value={stage.formDefinitionId}
                            onChange={(e) =>
                              handleStageChange(stage.tempId, 'formDefinitionId', e.target.value)
                            }
                            placeholder={t('pipelines.stage.formIdPlaceholder', 'Form ID')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('pipelines.stage.duration', 'Est. Duration (mins)')}</Label>
                          <Input
                            type="number"
                            value={stage.estimatedDurationMinutes ?? ''}
                            onChange={(e) =>
                              handleStageChange(
                                stage.tempId,
                                'estimatedDurationMinutes',
                                e.target.value ? parseInt(e.target.value, 10) : undefined
                              )
                            }
                            placeholder="15"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`required-${stage.tempId}`}
                            checked={stage.isRequired}
                            onCheckedChange={(checked) =>
                              handleStageChange(stage.tempId, 'isRequired', checked)
                            }
                          />
                          <Label htmlFor={`required-${stage.tempId}`}>
                            {t('pipelines.stage.required', 'Required')}
                          </Label>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStage(stage.tempId)}
                        className="text-red-500 hover:text-red-600"
                      >
                        {t('common.remove', 'Remove')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSubmitting}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('pipelines.create.saveDraft', 'Save as Draft')}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSubmitting}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('pipelines.create.saveActivate', 'Save & Activate')}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
