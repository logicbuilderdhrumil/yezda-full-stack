import type { Request, Response } from 'express';
import type { GetMockStatusUseCase, GetMockFixtureUseCase, ListFixturesUseCase } from '../../application/use-cases/mock-use-cases.js';
export class MockController {
  constructor(private readonly getStatus: GetMockStatusUseCase, private readonly getFixture: GetMockFixtureUseCase, private readonly listFixtures: ListFixturesUseCase) {}
  status = (_req: Request, res: Response) => { res.json(this.getStatus.execute()); };
  fixture = (req: Request, res: Response) => { const f = this.getFixture.execute(req.params.name); if (!f) { res.status(404).json({ error: 'Fixture not found' }); return; } res.json(f); };
  list = (_req: Request, res: Response) => { res.json(this.listFixtures.execute()); };
}
