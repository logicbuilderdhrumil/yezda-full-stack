import type { Request, Response } from 'express';
import type {
  LookupByEmail,
  GetGlobalIdentity,
  GetOrganizations,
  RequestConsent,
  GrantConsent,
  DenyConsent,
  RevokeConsent,
  CheckDataReuse,
} from '../../application/index.js';

export class GlobalCandidateIdentityController {
  constructor(
    private lookupUC: LookupByEmail,
    private getIdentityUC: GetGlobalIdentity,
    private getOrgsUC: GetOrganizations,
    private requestConsentUC: RequestConsent,
    private grantConsentUC: GrantConsent,
    private denyConsentUC: DenyConsent,
    private revokeConsentUC: RevokeConsent,
    private checkDataReuseUC: CheckDataReuse,
  ) {}

  lookupByEmail = async (req: Request, res: Response) => {
    const result = await this.lookupUC.execute(req.query.email as string);
    if (!result) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: result });
  };

  getGlobalIdentity = async (req: Request, res: Response) => {
    const result = await this.getIdentityUC.execute(req.params.id);
    if (!result) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: result });
  };

  getOrganizations = async (req: Request, res: Response) => {
    res.json({ success: true, data: await this.getOrgsUC.execute(req.params.id) });
  };

  requestConsent = async (req: Request, res: Response) => {
    const consent = await this.requestConsentUC.execute(req.params.id, req.body);
    res.status(201).json({ success: true, data: consent });
  };

  grantConsent = async (req: Request, res: Response) => {
    const consent = await this.grantConsentUC.execute(req.params.id);
    if (!consent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: consent });
  };

  denyConsent = async (req: Request, res: Response) => {
    const consent = await this.denyConsentUC.execute(req.params.id);
    if (!consent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: consent });
  };

  revokeConsent = async (req: Request, res: Response) => {
    const consent = await this.revokeConsentUC.execute(req.params.id);
    if (!consent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: consent });
  };

  checkDataReuse = async (req: Request, res: Response) => {
    const result = await this.checkDataReuseUC.execute(req.params.id, req.params.sourceOrgId);
    res.json({ success: true, data: result });
  };
}
