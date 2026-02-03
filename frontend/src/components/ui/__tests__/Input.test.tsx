import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input, Textarea, InputGroup } from '../Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Input placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveClass('border-gray-300');
  });

  it('applies error variant', () => {
    render(<Input variant="error" placeholder="error" />);
    expect(screen.getByPlaceholderText('error')).toHaveClass('border-red-500');
  });

  it('applies size classes', () => {
    render(<Input inputSize="sm" placeholder="small" />);
    expect(screen.getByPlaceholderText('small')).toHaveClass('h-8');
  });

  it('accepts type prop', () => {
    render(<Input type="email" placeholder="email" />);
    expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled();
  });
});

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('applies minRows', () => {
    render(<Textarea minRows={5} placeholder="rows" />);
    expect(screen.getByPlaceholderText('rows')).toHaveAttribute('rows', '5');
  });

  it('applies error variant', () => {
    render(<Textarea variant="error" placeholder="error" />);
    expect(screen.getByPlaceholderText('error')).toHaveClass('border-red-500');
  });
});

describe('InputGroup', () => {
  it('renders children', () => {
    render(
      <InputGroup>
        <Input placeholder="test" />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('test')).toBeInTheDocument();
  });

  it('renders left addon', () => {
    render(
      <InputGroup leftAddon="https://">
        <Input placeholder="url" />
      </InputGroup>
    );
    expect(screen.getByText('https://')).toBeInTheDocument();
  });

  it('renders right addon', () => {
    render(
      <InputGroup rightAddon=".com">
        <Input placeholder="domain" />
      </InputGroup>
    );
    expect(screen.getByText('.com')).toBeInTheDocument();
  });

  it('renders left element', () => {
    render(
      <InputGroup leftElement={<span data-testid="icon">🔍</span>}>
        <Input placeholder="search" />
      </InputGroup>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
