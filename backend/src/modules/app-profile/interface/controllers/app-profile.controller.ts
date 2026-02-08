/**
 * App Profile Controller (Clean Architecture)
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../middleware/auth.middleware.js';
import type { AppProfileUseCases } from '../../application/use-cases/app-profile-use-cases.js';

export class AppProfileController {
  constructor(private readonly useCases: AppProfileUseCases) {}

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.type !== 'candidate') {
      res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
      return;
    }

    const profile = await this.useCases.getProfile(req.user.sub);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({ profile });
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.type !== 'candidate') {
      res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
      return;
    }

    const { firstName, lastName, phone, address } = req.body;

    const profile = await this.useCases.updateProfile(req.user.sub, { firstName, lastName, phone, address });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({ profile });
  };
}
