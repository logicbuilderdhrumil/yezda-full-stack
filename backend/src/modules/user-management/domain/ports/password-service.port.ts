/**
 * Password Service Port (User Management)
 */
export interface IPasswordService {
  hash(password: string): Promise<string>;
}
