/**
 * App Profile Use Cases
 */

import type { IAppProfileRepository } from '../domain/ports/IAppProfileRepository.js';
import type { ProfileUpdateInput } from '../domain/entities/app-profile.entity.js';

export class AppProfileUseCases {
  constructor(private readonly repo: IAppProfileRepository) {}

  async getProfile(candidateId: string) {
    return this.repo.getProfile(candidateId);
  }

  async updateProfile(candidateId: string, input: ProfileUpdateInput) {
    return this.repo.updateProfile(candidateId, input);
  }
}
