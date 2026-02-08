import { Router } from 'express';
import type { MockController } from '../controllers/mock.controller.js';
export function createMockRoutes(ctrl: MockController): Router { const r = Router(); r.get('/status', ctrl.status); r.get('/fixtures', ctrl.list); r.get('/fixtures/:name', ctrl.fixture); return r; }
