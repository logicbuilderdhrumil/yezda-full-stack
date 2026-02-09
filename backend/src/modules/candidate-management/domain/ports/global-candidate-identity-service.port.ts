/**
 * Global Candidate Identity Service Port
 * Domain interface for global candidate identity resolution.
 */

export interface IGlobalCandidateIdentityService {
  resolveOrCreateGlobalIdentity(
    email: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    candidateId: string,
    actorId: string,
  ): Promise<unknown>;
}
