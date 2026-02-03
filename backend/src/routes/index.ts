import { Router } from 'express';
import authRoutes from './auth.routes.js';
import stateStoreRoutes from './state-store.routes.js';
import shellRoutes from './shell.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/state', stateStoreRoutes);
router.use('/shell', shellRoutes);

export default router;
