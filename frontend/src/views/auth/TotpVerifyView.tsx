import { useState, useRef, type ReactNode, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage, LoadingOverlay } from '@/components/ui';

const CODE_LENGTH = 6;

/**
 * TOTP verification page for MFA challenge.
 */
export function TotpVerifyView(): ReactNode {
  const navigate = useNavigate();
  const { verifyTotp, isLoading, error, clearError, mfaPending } = useAuth();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no MFA pending
  if (!mfaPending) {
    navigate('/sign-in');
    return null;
  }

  const handleChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    const newCode = [...code];
    // Handle paste of full code
    if (value.length === CODE_LENGTH) {
      for (let i = 0; i < CODE_LENGTH; i++) {
        newCode[i] = value[i] ?? '';
      }
      setCode(newCode);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      return;
    }

    // Single digit input
    newCode[index] = value[0] ?? '';
    setCode(newCode);

    // Move to next input
    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (error) clearError();
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newCode = [...code];
      if (code[index]) {
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pastedData.length === CODE_LENGTH) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const totpCode = code.join('');

    if (totpCode.length !== CODE_LENGTH) {
      return;
    }

    const success = await verifyTotp(totpCode);
    if (success) {
      navigate('/');
    } else {
      setAttempts((prev) => prev + 1);
      // Clear code on failure
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <LoadingOverlay isLoading={isLoading} message="Verifying code...">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ErrorMessage error={error} onDismiss={clearError} className="mb-4" />

          {attempts >= 3 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              Multiple failed attempts. Make sure your authenticator app is synced and showing the
              current code.
            </div>
          )}

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={CODE_LENGTH}
                value={digit}
                onChange={handleChange(index)}
                onKeyDown={handleKeyDown(index)}
                className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-14 sm:w-12"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verify code
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Can't access your authenticator?{' '}
              <Link
                to="/sign-in"
                className="font-medium text-primary hover:text-primary/80"
                onClick={() => {
                  // Clear MFA state when going back
                }}
              >
                Try another method
              </Link>
            </p>
          </div>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
