/**
 * App Profile Domain Entities
 * Candidate profile domain types
 */

export interface CandidateProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: ProfileAddress;
}
