/**
 * Form Builder Controller
 *
 * Thin HTTP adapter — delegates to use cases via constructor-injected dependencies.
 */
import type { Request, Response } from 'express';
import type { CreateFormUseCase } from '../../application/use-cases/CreateFormUseCase.js';
import type { UpdateFormUseCase } from '../../application/use-cases/UpdateFormUseCase.js';
import type { GetFormUseCase } from '../../application/use-cases/GetFormUseCase.js';
import type { ListFormsUseCase } from '../../application/use-cases/ListFormsUseCase.js';
import type { DeleteFormUseCase } from '../../application/use-cases/DeleteFormUseCase.js';
import type { CheckFormBuilderSLOsUseCase } from '../../application/use-cases/CheckFormBuilderSLOsUseCase.js';
import type { FormContext, CreateFormDto, UpdateFormDto, ListFormsQuery } from '../../domain/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    type: 'user' | 'candidate';
    tenantId?: string;
    roles?: string[];
  };
}

function buildContext(req: AuthenticatedRequest): FormContext {
  if (!req.user?.tenantId) {
    throw new Error('Tenant context required');
  }
  return {
    actorId: req.user.sub,
    actorType: req.user.type,
    actorRoles: req.user.roles ?? [],
    tenantId: req.user.tenantId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

export class FormBuilderController {
  constructor(
    private readonly createFormUC: CreateFormUseCase,
    private readonly updateFormUC: UpdateFormUseCase,
    private readonly getFormUC: GetFormUseCase,
    private readonly listFormsUC: ListFormsUseCase,
    private readonly deleteFormUC: DeleteFormUseCase,
    private readonly checkSlosUC: CheckFormBuilderSLOsUseCase,
  ) {}

  listForms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: FormContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const query = req.query as unknown as ListFormsQuery;
    const result = await this.listFormsUC.execute(ctx, query);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  createForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: FormContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const dto = req.body as CreateFormDto;
    const result = await this.createFormUC.execute(ctx, dto);
    if (!result.success) {
      const status = result.errorCode === 'DUPLICATE_FIELD_IDS' || result.errorCode === 'INVALID_CONDITIONAL_REFS' ? 400 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(201).json(result.data);
  };

  getForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: FormContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { formId } = req.params;
    const result = await this.getFormUC.execute(ctx, formId);
    if (!result.success) {
      const status = result.errorCode === 'FORM_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json(result.data);
  };

  updateForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: FormContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { formId } = req.params;
    const dto = req.body as UpdateFormDto;
    const result = await this.updateFormUC.execute(ctx, formId, dto);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'FORM_NOT_FOUND') status = 404;
      else if (result.errorCode === 'DUPLICATE_FIELD_IDS' || result.errorCode === 'INVALID_CONDITIONAL_REFS') status = 400;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  deleteForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: FormContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { formId } = req.params;
    const result = await this.deleteFormUC.execute(ctx, formId);
    if (!result.success) {
      const status = result.errorCode === 'FORM_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(204).send();
  };

  getHealth = (_req: Request, res: Response): void => {
    const result = this.checkSlosUC.execute();
    const slo = result.data!;
    res.status(slo.met ? 200 : 503).json({
      status: slo.met ? 'healthy' : 'degraded',
      slosViolated: slo.violations,
      timestamp: new Date().toISOString(),
    });
  };
}
