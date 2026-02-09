/**
 * ModuleSidebar — draggable module type cards for the pipeline builder.
 */
import { type DragEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULE_TYPES, type ModuleType } from './types';

interface ModuleSidebarProps {
  onModuleSelect?: (type: ModuleType) => void;
}

/**
 * Renders a sidebar with draggable module type cards.
 * Users can drag modules onto the pipeline canvas.
 */
export function ModuleSidebar({ onModuleSelect }: ModuleSidebarProps): ReactNode {
  const { t } = useTranslation();

  const onDragStart = (event: DragEvent<HTMLDivElement>, moduleType: ModuleType) => {
    event.dataTransfer.setData('application/pipeline-module', moduleType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-r border-border bg-muted p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        {t('pipelines.builder.modules', 'Modules')}
      </h3>
      <div className="space-y-2">
        {MODULE_TYPES.map((mod) => (
          <div
            key={mod.type}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white dark:bg-gray-800 cursor-grab hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, mod.type)}
            onClick={() => onModuleSelect?.(mod.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onModuleSelect?.(mod.type);
              }
            }}
          >
            <span
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-lg"
              style={{ backgroundColor: `${mod.color}20`, color: mod.color }}
            >
              {mod.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t(`pipelines.module.${mod.type}`, mod.label)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mod.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
