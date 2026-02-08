import { Router } from 'express';
import { createAuthModule } from '../modules/auth/index.js';
import { createCandidateManagementModule } from '../modules/candidate-management/index.js';
import { screeningPipelineRouter } from '../modules/screening-pipeline/index.js';
import { createFormBuilderModule } from '../modules/form-builder/index.js';
import { createUserManagementModule } from '../modules/user-management/index.js';
import { createOrgManagementModule } from '../modules/org-management/index.js';
import { createChatModule } from '../modules/chat/index.js';
import { createNotificationModule } from '../modules/notification/index.js';
import { createFileManagementModule } from '../modules/file-management/index.js';
import { createBillingLedgerModule } from '../modules/billing-ledger/index.js';
import { createAssetManagementModule } from '../modules/asset-management/index.js';
import { createClientPortalModule } from '../modules/client-portal/index.js';
import { createHomeDashboardModule } from '../modules/home-dashboard/index.js';
import { createTemplateLayoutsModule } from '../modules/template-layouts/index.js';
import { createThemeModule } from '../modules/theme/index.js';
import { createLocalizationModule } from '../modules/localization/index.js';
import { createOAuthModule } from '../modules/oauth/index.js';
import { createStateStoreModule } from '../modules/state-store/index.js';
import { createCustomComponentsModule } from '../modules/custom-components/index.js';
import appAuthRoutes from './app-auth.routes.js';
import appApplicationIntakeRoutes from './app-application-intake.routes.js';
import appConsentRoutes from './app-consent.routes.js';
import appProfileRoutes from './app-profile.routes.js';
// state-store routes replaced by Clean Architecture module
import shellRoutes from './shell.routes.js';
import firebaseRoutes from './firebase.routes.js';
// notification routes replaced by Clean Architecture module
// localization routes replaced by Clean Architecture module
// oauth routes replaced by Clean Architecture module
import mockRoutes from './mock.routes.js';
// theme routes replaced by Clean Architecture module
import uiKitRoutes from './ui-kit.routes.js';
// user-management routes replaced by Clean Architecture module
// org-management routes replaced by Clean Architecture module
import accountSettingsRoutes from './account-settings.routes.js';
import jobRoutes from './job.routes.js';
import exportRoutes from './export.routes.js';
import viewComponentsRoutes from './view-components.routes.js';
// form-builder routes replaced by Clean Architecture module
// file-management routes replaced by Clean Architecture module
// asset-management routes replaced by Clean Architecture module
// chat routes replaced by Clean Architecture module
import chartingRoutes from './charting.routes.js';
// billing-ledger routes replaced by Clean Architecture module
// home-dashboard routes replaced by Clean Architecture module
import sharedWidgetsRoutes from './shared-widgets.routes.js';
// template-layouts routes replaced by Clean Architecture module
import consentRoutes from './consent.routes.js';
import applicationRoutes from './application.routes.js';
import globalCandidateIdentityRoutes from './global-candidate-identity.routes.js';
// client-portal routes replaced by Clean Architecture module
// custom-components routes replaced by Clean Architecture module
import webhookRoutes from './webhook.routes.js';
import reviewTaskRoutes from './review-task.routes.js';

// Initialize Clean Architecture modules
const authModule = createAuthModule();
const candidateManagementModule = createCandidateManagementModule();
const formBuilderModule = createFormBuilderModule();
const userManagementModule = createUserManagementModule();
const orgManagementModule = createOrgManagementModule();
const chatModule = createChatModule();
const notificationModule = createNotificationModule();
const fileManagementModule = createFileManagementModule();
const billingLedgerModule = createBillingLedgerModule();
const assetManagementModule = createAssetManagementModule();
const clientPortalModule = createClientPortalModule();
const homeDashboardModule = createHomeDashboardModule();
const templateLayoutsModule = createTemplateLayoutsModule();
const themeModule = createThemeModule();
const localizationModule = createLocalizationModule();
const oauthModule = createOAuthModule();
const stateStoreModule = createStateStoreModule();
const customComponentsModule = createCustomComponentsModule();

const router = Router();

router.use('/auth', authModule.routes);
router.use('/app/auth', appAuthRoutes);
router.use('/app/applications', appApplicationIntakeRoutes);
router.use('/app/consent', appConsentRoutes);
router.use('/app/profile', appProfileRoutes);
router.use('/state', stateStoreModule.router);
router.use('/shell', shellRoutes);
router.use('/firebase', firebaseRoutes);
router.use('/notifications', notificationModule.routes);
router.use('/localization', localizationModule.router);
router.use('/oauth', oauthModule.router);
router.use('/mock', mockRoutes);
router.use('/theme', themeModule.router);
router.use('/ui-kit', uiKitRoutes);
router.use('/users', userManagementModule.routes);
router.use('/organizations', orgManagementModule.routes);
router.use('/account', accountSettingsRoutes);
router.use('/jobs', jobRoutes);
router.use('/exports', exportRoutes);
router.use('/view-components', viewComponentsRoutes);
router.use('/candidates', candidateManagementModule.routes);
router.use('/forms', formBuilderModule.routes);
router.use('/files', fileManagementModule.routes);
router.use('/assets', assetManagementModule.router);
router.use('/chat', chatModule.routes);
router.use('/charts', chartingRoutes);
router.use('/', billingLedgerModule.routes);
router.use('/dashboard', homeDashboardModule.router);
router.use('/widgets', sharedWidgetsRoutes);
router.use('/template-layouts', templateLayoutsModule.router);
router.use('/consent', consentRoutes);
router.use('/applications', applicationRoutes);
router.use('/screening-pipelines', screeningPipelineRouter);
router.use('/global-candidates', globalCandidateIdentityRoutes);
router.use('/client', clientPortalModule.router);
router.use('/components', customComponentsModule.router);
router.use('/webhooks', webhookRoutes);
router.use('/reviews', reviewTaskRoutes);

export default router;
