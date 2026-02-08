import type { IMockRepository } from '../../domain/ports/IMockRepository.js';
import type { MockStatus, MockFixture } from '../../domain/entities/mock.entity.js';
export class GetMockStatusUseCase { constructor(private readonly repo: IMockRepository) {} execute(): MockStatus { return this.repo.getStatus(); } }
export class GetMockFixtureUseCase { constructor(private readonly repo: IMockRepository) {} execute(name: string): MockFixture | undefined { return this.repo.getFixture(name); } }
export class ListFixturesUseCase { constructor(private readonly repo: IMockRepository) {} execute(): string[] { return this.repo.listFixtures(); } }
