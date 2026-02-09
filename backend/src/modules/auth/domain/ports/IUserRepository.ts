/**
 * User repository port — defines persistence contract for users and candidates
 */
import type { User, Candidate } from '../entities/index.js';
import type { ITransactionClient } from './ITransactionManager.js';

export interface IUserRepository {
  createUser(user: User): Promise<void>;
  findUserById(id: string): Promise<User | undefined>;
  findUserByEmail(email: string): Promise<User | undefined>;
  updateUser(user: User): Promise<void>;
  emailExistsForUser(email: string): Promise<boolean>;

  createCandidate(candidate: Candidate): Promise<void>;
  findCandidateById(id: string): Promise<Candidate | undefined>;
  findCandidateByEmail(email: string): Promise<Candidate | undefined>;
  updateCandidate(candidate: Candidate): Promise<void>;
  emailExistsForCandidate(email: string): Promise<boolean>;

  findEntityByEmail(email: string, userType: 'user' | 'candidate'): Promise<User | Candidate | undefined>;
  findEntityById(id: string, userType: 'user' | 'candidate'): Promise<User | Candidate | undefined>;
  updateEntity(entity: User | Candidate, userType: 'user' | 'candidate'): Promise<void>;
  emailExists(email: string, userType: 'user' | 'candidate'): Promise<boolean>;

  /** Reset password within an existing transaction */
  resetPasswordInTransaction(
    client: ITransactionClient,
    userId: string,
    userType: 'user' | 'candidate',
    passwordHash: string,
  ): Promise<void>;
}
