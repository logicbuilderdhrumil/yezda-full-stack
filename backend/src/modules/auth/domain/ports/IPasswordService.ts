/**
 * Password service port — defines contract for hashing and strength validation
 */
export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  validateStrength(password: string): { valid: boolean; errors: string[] };
}
