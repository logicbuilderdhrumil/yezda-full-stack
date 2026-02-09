import type { IMockRepository } from '../../domain/ports/IMockRepository.js';
import type { MockStatus, MockFixture } from '../../domain/entities/mock.entity.js';
export class InMemoryMockRepository implements IMockRepository {
  getStatus(): MockStatus { return { enabled: process.env.MOCK_MODE === 'true', fixtures: ['users', 'candidates', 'organizations'] }; }
  getFixture(name: string): MockFixture | undefined { return { name, data: { mock: true } }; }
  listFixtures(): string[] { return ['users', 'candidates', 'organizations']; }
}
