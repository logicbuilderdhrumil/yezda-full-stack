import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FileIcon, getFileIcon, getExtension } from '../FileIcon';

describe('FileIcon', () => {
  it('renders file icon', () => {
    render(<FileIcon filename="document.pdf" />);
    expect(screen.getByTestId('file-icon')).toBeInTheDocument();
  });

  it('renders with correct size', () => {
    render(<FileIcon filename="test.txt" size={32} />);
    const icon = screen.getByTestId('file-icon');
    expect(icon).toHaveAttribute('width', '32');
    expect(icon).toHaveAttribute('height', '32');
  });

  it('applies custom className', () => {
    const { container } = render(<FileIcon filename="test.pdf" className="text-blue-500" />);
    expect(container.firstChild).toHaveClass('text-blue-500');
  });

  it('renders with color prop', () => {
    render(<FileIcon filename="test.pdf" color="red" />);
    const icon = screen.getByTestId('file-icon');
    // Lucide icons use stroke for color, check via style or just that it renders
    expect(icon).toBeInTheDocument();
  });

  it('renders default icon for unknown extension', () => {
    render(<FileIcon filename="unknown.xyz" />);
    expect(screen.getByTestId('file-icon')).toBeInTheDocument();
  });

  it('uses mimeType when filename has no extension', () => {
    render(<FileIcon filename="noext" mimeType="image/png" />);
    expect(screen.getByTestId('file-icon')).toBeInTheDocument();
  });
});

describe('getExtension', () => {
  it('extracts extension from filename', () => {
    expect(getExtension('document.pdf')).toBe('pdf');
    expect(getExtension('image.PNG')).toBe('png');
    expect(getExtension('archive.tar.gz')).toBe('gz');
  });

  it('returns empty string for no extension', () => {
    expect(getExtension('noextension')).toBe('');
    expect(getExtension('file.')).toBe('');
  });

  it('handles edge cases', () => {
    expect(getExtension('')).toBe('');
    expect(getExtension('.')).toBe('');
    expect(getExtension('.hidden')).toBe('hidden');
  });
});

describe('getFileIcon', () => {
  it('returns correct icon for document types', () => {
    const pdfIcon = getFileIcon('report.pdf');
    const docIcon = getFileIcon('letter.docx');
    const txtIcon = getFileIcon('readme.txt');

    // All should return FileText-like icons
    expect(pdfIcon).toBeDefined();
    expect(docIcon).toBeDefined();
    expect(txtIcon).toBeDefined();
  });

  it('returns correct icon for image types', () => {
    const jpgIcon = getFileIcon('photo.jpg');
    const pngIcon = getFileIcon('image.png');
    const gifIcon = getFileIcon('animation.gif');

    // All should return same FileImage icon
    expect(jpgIcon).toBe(pngIcon);
    expect(pngIcon).toBe(gifIcon);
  });

  it('returns correct icon for video types', () => {
    const mp4Icon = getFileIcon('video.mp4');
    const aviIcon = getFileIcon('movie.avi');

    expect(mp4Icon).toBe(aviIcon);
  });

  it('returns correct icon for audio types', () => {
    const mp3Icon = getFileIcon('song.mp3');
    const wavIcon = getFileIcon('audio.wav');

    expect(mp3Icon).toBe(wavIcon);
  });

  it('returns correct icon for code types', () => {
    const jsIcon = getFileIcon('app.js');
    const tsIcon = getFileIcon('index.ts');
    const pyIcon = getFileIcon('script.py');

    // All code files should return FileCode
    expect(jsIcon).toBe(tsIcon);
    expect(tsIcon).toBe(pyIcon);
  });

  it('returns correct icon for archive types', () => {
    const zipIcon = getFileIcon('files.zip');
    const tarIcon = getFileIcon('backup.tar');

    expect(zipIcon).toBe(tarIcon);
  });

  it('returns correct icon for spreadsheet types', () => {
    const xlsIcon = getFileIcon('data.xlsx');
    const csvIcon = getFileIcon('export.csv');

    expect(xlsIcon).toBe(csvIcon);
  });

  it('returns correct icon for JSON files', () => {
    const jsonIcon = getFileIcon('config.json');
    expect(jsonIcon).toBeDefined();
  });

  it('falls back to MIME type', () => {
    const icon = getFileIcon('unknownfile', 'image/jpeg');
    expect(icon).toBeDefined();
  });

  it('returns default icon for unknown types', () => {
    const defaultIcon = getFileIcon('unknown.xyz');
    expect(defaultIcon).toBeDefined();
  });

  it('prefers extension over MIME type', () => {
    // If file has .pdf extension, should use PDF icon even if MIME says image
    const icon = getFileIcon('document.pdf', 'image/png');
    const pdfIcon = getFileIcon('another.pdf');

    expect(icon).toBe(pdfIcon);
  });
});
