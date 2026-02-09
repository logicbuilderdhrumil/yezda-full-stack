/**
 * Form Builder Interface Layer — barrel export
 */
export { FormBuilderController } from './controllers/form-builder.controller.js';
export { createFormBuilderRoutes } from './routes/form-builder.routes.js';
export {
  createFormRequestSchema,
  updateFormRequestSchema,
  listFormsQuerySchema,
  formIdParamSchema,
} from './validators/form-builder.validators.js';
