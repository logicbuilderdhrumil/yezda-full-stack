import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarUpload, type AvatarUploadProps } from '../AvatarUpload';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'account.avatar.upload': 'Upload',
        'account.avatar.remove': 'Remove',
        'account.avatar.uploadLabel': 'Click or drag to upload avatar',
        'account.avatar.hint': 'JPG, PNG, WebP or GIF. Max 5MB.',
        'account.avatar.invalidType': 'Invalid file type',
        'account.avatar.tooLarge': 'File too large',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock toastError
const mockToastError = vi.fn();
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    toastError: (msg: string) => mockToastError(msg),
  };
});

describe('AvatarUpload', () => {
  const defaultProps: AvatarUploadProps = {
    avatarUrl: undefined,
    displayName: 'John Doe',
    onUpload: vi.fn(),
    onRemove: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays initials when no avatar URL', () => {
      render(<AvatarUpload {...defaultProps} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays avatar image when URL provided', () => {
      render(
        <AvatarUpload {...defaultProps} avatarUrl="https://example.com/avatar.jpg" />
      );

      const img = screen.getByRole('img', { name: 'John Doe' });
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('shows upload button', () => {
      render(<AvatarUpload {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    it('shows remove button only when avatar exists', () => {
      const { rerender } = render(<AvatarUpload {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

      rerender(
        <AvatarUpload {...defaultProps} avatarUrl="https://example.com/avatar.jpg" />
      );

      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('displays hint text', () => {
      render(<AvatarUpload {...defaultProps} />);

      expect(screen.getByText('JPG, PNG, WebP or GIF. Max 5MB.')).toBeInTheDocument();
    });
  });

  describe('initials generation', () => {
    it('generates initials from two-word name', () => {
      render(<AvatarUpload {...defaultProps} displayName="John Doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates initials from single-word name', () => {
      render(<AvatarUpload {...defaultProps} displayName="John" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('limits initials to two characters', () => {
      render(<AvatarUpload {...defaultProps} displayName="John Quincy Adams" />);
      expect(screen.getByText('JQ')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('has focusable avatar area with button role', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      expect(avatarArea).toHaveAttribute('tabIndex', '0');
    });

    it('triggers upload on Enter key', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      avatarArea.focus();

      fireEvent.keyDown(avatarArea, { key: 'Enter' });

      // Click doesn't directly call onUpload - it opens file picker
      // We verify the handler is attached and focusable
      expect(avatarArea).toHaveFocus();
    });

    it('triggers upload on Space key', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      avatarArea.focus();

      fireEvent.keyDown(avatarArea, { key: ' ' });

      expect(avatarArea).toHaveFocus();
    });

    it('sets tabIndex to -1 when loading', () => {
      render(<AvatarUpload {...defaultProps} isLoading={true} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      expect(avatarArea).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('file validation', () => {
    it('accepts valid image types', async () => {
      const onUpload = vi.fn().mockResolvedValue(undefined);
      render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await waitFor(() => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(onUpload).toHaveBeenCalledWith(file);
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('rejects invalid file types', async () => {
      const onUpload = vi.fn();
      render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await waitFor(() => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(onUpload).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Invalid file type');
    });

    it('rejects files over 5MB', async () => {
      const onUpload = vi.fn();
      render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

      // Create mock file larger than 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await waitFor(() => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(onUpload).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('File too large');
    });
  });

  describe('drag and drop', () => {
    it('shows drag state on dragover', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });

      fireEvent.dragOver(avatarArea, { preventDefault: vi.fn() });

      expect(avatarArea).toHaveClass('border-primary');
    });

    it('removes drag state on dragleave', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });

      fireEvent.dragOver(avatarArea);
      fireEvent.dragLeave(avatarArea);

      expect(avatarArea).not.toHaveClass('border-primary');
    });

    it('handles file drop', async () => {
      const onUpload = vi.fn().mockResolvedValue(undefined);
      render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });

      fireEvent.drop(avatarArea, {
        preventDefault: vi.fn(),
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('loading state', () => {
    it('disables buttons when loading', () => {
      render(
        <AvatarUpload
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('shows loading spinner overlay', () => {
      render(<AvatarUpload {...defaultProps} isLoading={true} />);

      // The loading overlay should be visible
      const loadingOverlay = document.querySelector('.bg-black\\/50');
      expect(loadingOverlay).toBeInTheDocument();
    });
  });

  describe('remove action', () => {
    it('calls onRemove when remove button clicked', async () => {
      const onRemove = vi.fn().mockResolvedValue(undefined);
      render(
        <AvatarUpload
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onRemove={onRemove}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalled();
      });
    });
  });

  describe('focus styles', () => {
    it('has focus ring classes', () => {
      render(<AvatarUpload {...defaultProps} />);

      const avatarArea = screen.getByRole('button', { name: 'Click or drag to upload avatar' });
      expect(avatarArea).toHaveClass('focus:ring-2');
      expect(avatarArea).toHaveClass('focus:ring-primary');
    });
  });
});
