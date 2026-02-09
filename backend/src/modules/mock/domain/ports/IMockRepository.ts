import type { MockStatus, MockFixture } from '../entities/mock.entity.js';
export interface IMockRepository {
  getStatus(): MockStatus;
  getFixture(name: string): MockFixture | undefined;
  listFixtures(): string[];
}
