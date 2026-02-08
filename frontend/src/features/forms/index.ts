/**
 * Forms Feature Module
 *
 * Encapsulates form builder pages, components, and services.
 */

// Pages
export { FormsListView } from './pages/FormsListView';
export { FormCreateView } from './pages/FormCreateView';
export { FormEditView } from './pages/FormEditView';
export { FormDetailsView } from './pages/FormDetailsView';
export { FormBuilderCanvas, type FormBuilderCanvasProps } from './pages/FormBuilderCanvas';
export { FormMetadataForm, type FormMetadataFormProps } from './pages/FormMetadataForm';
export { FieldPalette, type FieldPaletteProps } from './pages/FieldPalette';
export { FieldConfigPanel, type FieldConfigPanelProps } from './pages/FieldConfigPanel';
export { FormPreview, type FormPreviewProps } from './pages/FormPreview';

// Services
export { FormsService } from './services/FormsService';
export { FormService, type CreateFormRequest, type UpdateFormRequest } from './services/FormService';
