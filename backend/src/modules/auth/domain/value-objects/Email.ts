/**
 * Email value object with normalization
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;

  constructor(email: string) {
    const normalized = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }
}
