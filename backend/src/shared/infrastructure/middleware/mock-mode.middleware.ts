/**
 * Mock Mode Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/mock-mode.middleware.ts`.
 */

export {
  requireMockMode,
  requireMockModeToggleAccess,
  logMockFixtureAccess,
  logMockEndpointCall,
  addMockModeHeader,
} from '../../../middleware/mock-mode.middleware.js';
