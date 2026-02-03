import { Router } from 'express';
import authRoutes from './auth.routes.js';
import stateStoreRoutes from './state-store.routes.js';
import shellRoutes from './shell.routes.js';
import firebaseRoutes from './firebase.routes.js';
import notificationRoutes from './notification.routes.js';
import localizationRoutes from './localization.routes.js';
import oauthRoutes from './oauth.routes.js';
import mockRoutes from './mock.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/state', stateStoreRoutes);
router.use('/shell', shellRoutes);
router.use('/firebase', firebaseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/localization', localizationRoutes);
router.use('/oauth', oauthRoutes);
router.use('/mock', mockRoutes);

export default router;
