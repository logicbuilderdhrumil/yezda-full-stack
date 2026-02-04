/**
 * RichTextEditor and RichTextViewer component tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTextEditor, RichTextViewer } from '../RichTextEditor';

describe('RichTextEditor', () => {
  it('renders editor with placeholder', () => {
    render(<RichTextEditor placeholder="Enter content here" />);
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-placeholder', 'Enter content here');
  });

  it('renders default toolbar buttons with aria-labels', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'H1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'H2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
  });

  it('hides toolbar in readOnly mode', () => {
    render(<RichTextEditor readOnly />);
    expect(screen.queryByRole('button', { name: 'Bold' })).not.toBeInTheDocument();
  });

  it('disables toolbar buttons when disabled', () => {
    render(<RichTextEditor disabled />);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it('renders with initial value', () => {
    render(<RichTextEditor value="<p>Initial content</p>" />);
    expect(screen.getByText('Initial content')).toBeInTheDocument();
  });

  it('sanitizes HTML content to prevent XSS', () => {
    const maliciousContent = '<p>Safe</p><script>alert("xss")</script>';
    render(<RichTextEditor value={maliciousContent} />);
    const editor = screen.getByRole('textbox');
    expect(editor.innerHTML).toContain('Safe');
    expect(editor.innerHTML).not.toContain('script');
    expect(editor.innerHTML).not.toContain('alert');
  });

  it('opens link dialog when Link button is clicked', () => {
    render(<RichTextEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(screen.getByText('Insert Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });

  it('closes link dialog on cancel', () => {
    render(<RichTextEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(screen.getByText('Insert Link')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Insert Link')).not.toBeInTheDocument();
  });

  it('applies custom minHeight and maxHeight styles', () => {
    render(<RichTextEditor minHeight={200} maxHeight={400} />);
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveStyle({ minHeight: '200px', maxHeight: '400px' });
  });

  it('calls onChange when content is edited', () => {
    const handleChange = vi.fn();
    render(<RichTextEditor onChange={handleChange} />);
    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { innerHTML: '<p>New content</p>' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with custom toolbar', () => {
    const customToolbar = [
      { type: 'format' as const, format: 'bold' as const, label: 'Make Bold' },
    ];
    render(<RichTextEditor toolbar={customToolbar} />);
    expect(screen.getByRole('button', { name: 'Make Bold' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Italic' })).not.toBeInTheDocument();
  });
});

describe('RichTextViewer', () => {
  it('renders content', () => {
    render(<RichTextViewer content="<p>Hello World</p>" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('sanitizes HTML content to prevent XSS', () => {
    const maliciousContent = '<p>Safe</p><script>alert("xss")</script><img onerror="alert(1)" src="x">';
    render(<RichTextViewer content={maliciousContent} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
    const container = screen.getByText('Safe').closest('div');
    expect(container?.innerHTML).not.toContain('script');
    expect(container?.innerHTML).not.toContain('onerror');
  });

  it('applies custom className', () => {
    render(<RichTextViewer content="<p>Test</p>" className="custom-class" />);
    const viewer = screen.getByText('Test').closest('div');
    expect(viewer).toHaveClass('custom-class');
  });

  it('renders allowed HTML tags', () => {
    const content = '<h1>Title</h1><p><strong>Bold</strong> and <em>italic</em></p><ul><li>Item</li></ul>';
    render(<RichTextViewer content={content} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renders links without dangerous attributes', () => {
    const content = '<a href="https://example.com" onclick="alert(1)">Safe Link</a>';
    render(<RichTextViewer content={content} />);
    const link = screen.getByText('Safe Link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).not.toHaveAttribute('onclick');
  });
});
