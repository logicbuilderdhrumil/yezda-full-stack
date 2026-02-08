import { InMemoryGlobalCandidateIdentityRepository } from './infrastructure/index.js';
import {
  LookupByEmail,
  GetGlobalIdentity,
  GetOrganizations,
  RequestConsent,
  GrantConsent,
  DenyConsent,
  RevokeConsent,
  CheckDataReuse,
} from './application/index.js';
import { GlobalCandidateIdentityController, createGlobalCandidateIdentityRoutes } from './interface/index.js';

export function createGlobalCandidateIdentityModule() {
  const repo = new InMemoryGlobalCandidateIdentityRepository();
  const controller = new GlobalCandidateIdentityController(
    new LookupByEmail(repo),
    new GetGlobalIdentity(repo),
    new GetOrganizations(repo),
    new RequestConsent(repo),
    new GrantConsent(repo),
    new DenyConsent(repo),
    new RevokeConsent(repo),
    new CheckDataReuse(repo),
  );
  return { router: createGlobalCandidateIdentityRoutes(controller) };
}
