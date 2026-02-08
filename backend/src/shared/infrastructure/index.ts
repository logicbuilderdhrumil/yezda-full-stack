/**
 * Shared Infrastructure barrel export
 *
 * Cross-cutting concerns used across all modules:
 * - database: PostgreSQL and Redis connections
 * - config: Centralized configuration
 * - middleware: Express middleware (auth, rate-limit, validation, error handling)
 * - http: Express application setup
 */
export * from './database/index.js';
export * from './config/index.js';
export * from './middleware/index.js';
export * from './http/index.js';
