import { Router } from 'express';
import authRoutes from './auth.routes.js';
import stateStoreRoutes from './state-store.routes.js';
import shellRoutes from './shell.routes.js';
import firebaseRoutes from './firebase.routes.js';
import notificationRoutes from './notification.routes.js';
import localizationRoutes from './localization.routes.js';
import oauthRoutes from './oauth.routes.js';
import mockRoutes from './mock.routes.js';
import themeRoutes from './theme.routes.js';
import uiKitRoutes from './ui-kit.routes.js';
import userManagementRoutes from './user-management.routes.js';
import orgManagementRoutes from './org-management.routes.js';
import accountSettingsRoutes from './account-settings.routes.js';
import candidateManagementRoutes from './candidate-management.routes.js';
import formBuilderRoutes from './form-builder.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/state', stateStoreRoutes);
router.use('/shell', shellRoutes);
router.use('/firebase', firebaseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/localization', localizationRoutes);
router.use('/oauth', oauthRoutes);
router.use('/mock', mockRoutes);
router.use('/theme', themeRoutes);
router.use('/ui-kit', uiKitRoutes);
router.use('/users', userManagementRoutes);
router.use('/organizations', orgManagementRoutes);
router.use('/account', accountSettingsRoutes);
router.use('/candidates', candidateManagementRoutes);
router.use('/forms', formBuilderRoutes);

export default router;
