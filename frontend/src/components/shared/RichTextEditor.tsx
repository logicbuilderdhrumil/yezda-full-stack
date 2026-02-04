/**
 * RichTextEditor component - Wrapper for rich text editing.
 * Uses a thin adapter pattern for future third-party library integration.
 */
import {
  type ReactNode,
  type HTMLAttributes,
  useState,
  useCallback,
  useRef,
} from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

export type TextFormat = 'bold' | 'italic' | 'underline' | 'strikethrough';
export type HeadingLevel = 1 | 2 | 3;
export type ListType = 'bullet' | 'numbered';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface ToolbarAction {
  type: 'format' | 'heading' | 'list' | 'align' | 'link' | 'image' | 'custom';
  format?: TextFormat;
  headingLevel?: HeadingLevel;
  listType?: ListType;
  align?: TextAlign;
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
}

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current HTML content. */
  value?: string;
  /** Change handler. */
  onChange?: (value: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Toolbar actions to show. */
  toolbar?: ToolbarAction[];
  /** Minimum height. */
  minHeight?: number | string;
  /** Maximum height (enables scroll). */
  maxHeight?: number | string;
  /** Read-only mode. */
  readOnly?: boolean;
  /** Disabled state. */
  disabled?: boolean;
}

// ============================================================================
// DEFAULT TOOLBAR
// ============================================================================

const DEFAULT_TOOLBAR: ToolbarAction[] = [
  { type: 'format', format: 'bold', label: 'Bold' },
  { type: 'format', format: 'italic', label: 'Italic' },
  { type: 'format', format: 'underline', label: 'Underline' },
  { type: 'heading', headingLevel: 1, label: 'H1' },
  { type: 'heading', headingLevel: 2, label: 'H2' },
  { type: 'list', listType: 'bullet', label: 'Bullet List' },
  { type: 'list', listType: 'numbered', label: 'Numbered List' },
  { type: 'link', label: 'Link' },
];

// ============================================================================
// TOOLBAR ICONS
// ============================================================================

function getToolbarIcon(action: ToolbarAction): ReactNode {
  if (action.icon) return action.icon;

  switch (action.type) {
    case 'format':
      switch (action.format) {
        case 'bold':
          return <span className="font-bold">B</span>;
        case 'italic':
          return <span className="italic">I</span>;
        case 'underline':
          return <span className="underline">U</span>;
        case 'strikethrough':
          return <span className="line-through">S</span>;
      }
      break;
    case 'heading':
      return <span className="font-bold">H{action.headingLevel}</span>;
    case 'list':
      if (action.listType === 'bullet') {
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      }
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'align':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      );
  }

  return action.label ?? '?';
}

// ============================================================================
// RICHTEXTEDITOR COMPONENT
// ============================================================================

/**
 * Rich text editor with toolbar.
 * Currently implements a basic contentEditable wrapper.
 * Replace internals with a proper rich text library (e.g., TipTap, Slate) for production.
 */
export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  toolbar = DEFAULT_TOOLBAR,
  minHeight = 150,
  maxHeight,
  readOnly = false,
  disabled = false,
  className,
  ...props
}: RichTextEditorProps): ReactNode {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const maxHeightStyle = maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined;

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    if (action.onClick) {
      action.onClick();
      return;
    }

    switch (action.type) {
      case 'format':
        if (action.format === 'bold') execCommand('bold');
        else if (action.format === 'italic') execCommand('italic');
        else if (action.format === 'underline') execCommand('underline');
        else if (action.format === 'strikethrough') execCommand('strikeThrough');
        break;
      case 'heading':
        execCommand('formatBlock', `h${action.headingLevel}`);
        break;
      case 'list':
        if (action.listType === 'bullet') execCommand('insertUnorderedList');
        else execCommand('insertOrderedList');
        break;
      case 'align':
        if (action.align === 'left') execCommand('justifyLeft');
        else if (action.align === 'center') execCommand('justifyCenter');
        else if (action.align === 'right') execCommand('justifyRight');
        else if (action.align === 'justify') execCommand('justifyFull');
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) execCommand('createLink', url);
        break;
    }
  }, [execCommand]);

  return (
    <div
      className={cn(
        'border rounded-md overflow-hidden',
        'border-gray-200 dark:border-gray-700',
        isFocused && 'ring-2 ring-primary-500 border-primary-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {toolbar.map((action, idx) => (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction(action)}
              disabled={disabled}
              title={action.label}
            >
              {getToolbarIcon(action)}
            </Button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly && !disabled}
        suppressContentEditableWarning
        className={cn(
          'p-3 outline-none prose prose-sm dark:prose-invert max-w-none',
          'bg-white dark:bg-gray-900',
          maxHeightStyle && 'overflow-y-auto'
        )}
        style={{
          minHeight: minHeightStyle,
          maxHeight: maxHeightStyle,
        }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

// ============================================================================
// RICH TEXT VIEWER
// ============================================================================

export interface RichTextViewerProps extends HTMLAttributes<HTMLDivElement> {
  /** HTML content to render. */
  content: string;
}

/**
 * Read-only rich text viewer.
 */
export function RichTextViewer({
  content,
  className,
  ...props
}: RichTextViewerProps): ReactNode {
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: content }}
      {...props}
    />
  );
}
