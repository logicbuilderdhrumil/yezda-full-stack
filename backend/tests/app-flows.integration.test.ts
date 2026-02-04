/**
 * Integration tests for app-backend app flows.
 * Tests consent reuse and application intake endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import consentRoutes from '../src/routes/consent.routes.js';
import applicationRoutes from '../src/routes/application.routes.js';

describe('App-Backend App Flows Integration', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Mock auth middleware to inject test user
    app.use((req, _res, next) => {
      (req as any).user = { id: 'test-candidate-001' };
      next();
    });
    app.use('/api/v1/consent', consentRoutes);
    app.use('/api/v1/applications', applicationRoutes);
  });

  describe('Consent Reuse Endpoints', () => {
    describe('GET /api/v1/consent/prompt/:applicationId', () => {
      it('returns consent prompt with workflow state for valid application', async () => {
        const response = await request(app)
          .get('/api/v1/consent/prompt/app-001')
          .expect(200);

        expect(response.body).toMatchObject({
          applicationId: 'app-001',
          sourceApplicationId: expect.any(String),
          availableScopes: expect.any(Array),
          sourceOrganization: expect.any(String),
          targetOrganization: expect.any(String),
          sourceDate: expect.any(String),
          workflowState: expect.any(String),
        });
      });

      it('returns 404 for application without reusable data', async () => {
        const response = await request(app)
          .get('/api/v1/consent/prompt/nonexistent-app')
          .expect(404);

        expect(response.body).toMatchObject({
          code: 'CONSENT_NOT_FOUND',
          message: expect.any(String),
        });
      });
    });

    describe('POST /api/v1/consent', () => {
      it('accepts consent with valid scopes', async () => {
        const response = await request(app)
          .post('/api/v1/consent')
          .send({
            applicationId: 'app-001',
            sourceApplicationId: 'prev-app-123',
            acceptedScopes: ['personal_info', 'addresses'],
            accepted: true,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          consent: {
            id: expect.any(String),
            status: 'granted',
            workflowState: 'accepted',
            scopes: ['personal_info', 'addresses'],
          },
          workflowState: 'accepted',
        });
      });

      it('declines consent', async () => {
        const response = await request(app)
          .post('/api/v1/consent')
          .send({
            applicationId: 'app-001',
            sourceApplicationId: 'prev-app-123',
            acceptedScopes: [],
            accepted: false,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          consent: {
            status: 'denied',
            workflowState: 'declined',
            scopes: [],
          },
          workflowState: 'declined',
        });
      });

      it('returns validation error for missing fields', async () => {
        const response = await request(app)
          .post('/api/v1/consent')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        });
      });

      it('returns error for invalid scopes', async () => {
        const response = await request(app)
          .post('/api/v1/consent')
          .send({
            applicationId: 'app-001',
            sourceApplicationId: 'prev-app-123',
            acceptedScopes: ['invalid_scope'],
            accepted: true,
          })
          .expect(400);

        expect(response.body).toMatchObject({
          code: 'INVALID_CONSENT_SCOPE',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'acceptedScopes',
              code: 'INVALID_SCOPE',
            }),
          ]),
        });
      });
    });

    describe('GET /api/v1/consent', () => {
      it('returns consent status list', async () => {
        const response = await request(app)
          .get('/api/v1/consent')
          .expect(200);

        expect(response.body).toHaveProperty('consents');
        expect(Array.isArray(response.body.consents)).toBe(true);
      });
    });
  });

  describe('Application Intake Endpoints', () => {
    describe('GET /api/v1/applications', () => {
      it('returns application list with lifecycle states', async () => {
        const response = await request(app)
          .get('/api/v1/applications')
          .expect(200);

        expect(response.body).toHaveProperty('applications');
        expect(Array.isArray(response.body.applications)).toBe(true);
        if (response.body.applications.length > 0) {
          expect(response.body.applications[0]).toMatchObject({
            id: expect.any(String),
            title: expect.any(String),
            status: expect.any(String),
            lifecycleState: expect.any(String),
          });
        }
      });
    });

    describe('GET /api/v1/applications/:applicationId', () => {
      it('returns application detail with form schema', async () => {
        const response = await request(app)
          .get('/api/v1/applications/app-001')
          .expect(200);

        expect(response.body).toMatchObject({
          application: {
            id: 'app-001',
            title: expect.any(String),
            status: expect.any(String),
            lifecycleState: expect.any(String),
            sections: expect.any(Array),
          },
        });

        const appData = response.body.application;
        if (appData.sections.length > 0) {
          expect(appData.sections[0]).toMatchObject({
            id: expect.any(String),
            title: expect.any(String),
            fields: expect.any(Array),
          });
        }
      });

      it('returns 404 for unknown application', async () => {
        const response = await request(app)
          .get('/api/v1/applications/nonexistent')
          .expect(404);

        expect(response.body).toMatchObject({
          code: 'APPLICATION_NOT_FOUND',
        });
      });
    });

    describe('PUT /api/v1/applications/:applicationId/draft', () => {
      it('saves draft and returns lifecycle state', async () => {
        const response = await request(app)
          .put('/api/v1/applications/app-001/draft')
          .send({
            values: {
              firstName: 'John',
              lastName: 'Doe',
            },
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          savedAt: expect.any(Number),
          lifecycleState: 'draft',
        });
      });

      it('returns validation error for invalid body', async () => {
        const response = await request(app)
          .put('/api/v1/applications/app-001/draft')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'values',
              code: 'REQUIRED',
            }),
          ]),
        });
      });
    });

    describe('POST /api/v1/applications/:applicationId/submit', () => {
      it('submits application with valid data', async () => {
        const response = await request(app)
          .post('/api/v1/applications/app-002/submit')
          .send({
            values: {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: '555-123-4567',
            },
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          submittedAt: expect.any(String),
          lifecycleState: 'submitted',
        });
      });

      it('returns field-level validation errors', async () => {
        const response = await request(app)
          .post('/api/v1/applications/app-001/submit')
          .send({
            values: {
              firstName: '',
              lastName: '',
            },
          })
          .expect(400);

        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        });
      });
    });
  });

  describe('Authentication Requirements', () => {
    let unauthenticatedApp: Express;

    beforeAll(() => {
      unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      // No auth middleware - requests should fail with 401
      unauthenticatedApp.use('/api/v1/consent', consentRoutes);
      unauthenticatedApp.use('/api/v1/applications', applicationRoutes);
    });

    it('returns 401 for applications list without auth', async () => {
      const response = await request(unauthenticatedApp)
        .get('/api/v1/applications')
        .expect(401);

      expect(response.body).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    it('returns 401 for consent prompt without auth', async () => {
      const response = await request(unauthenticatedApp)
        .get('/api/v1/consent/prompt/app-001')
        .expect(401);

      expect(response.body).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });
  });
});
