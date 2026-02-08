/**
 * Email value object with normalization
 */
export class Email {
  readonly value: string;

  constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  toString(): string {
    return this.value;
  }
}
