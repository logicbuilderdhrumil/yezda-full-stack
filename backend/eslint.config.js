// @ts-check

/**
 * ESLint flat config — Clean Architecture dependency rules
 *
 * Enforces the Dependency Rule:
 *   Domain  → may import nothing outside domain
 *   Application → may import domain only
 *   Infrastructure / Interface → may import domain + application
 *
 * These rules apply only to files inside src/modules/.
 */

/** @type {import('eslint').Linter.Config[]} */
export default [
  /* ── Ignore build output ─────────────────────────────────── */
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  /* ── Domain layer: no imports from outer layers ──────────── */
  {
    files: ['src/modules/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**'],
              message:
                'Domain layer must NOT import from the application layer.',
            },
            {
              group: ['**/infrastructure/**'],
              message:
                'Domain layer must NOT import from the infrastructure layer.',
            },
            {
              group: ['**/interface/**'],
              message:
                'Domain layer must NOT import from the interface layer.',
            },
          ],
        },
      ],
    },
  },

  /* ── Application layer: no imports from infra / interface ── */
  {
    files: ['src/modules/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'Application layer must NOT import from the infrastructure layer.',
            },
            {
              group: ['**/interface/**'],
              message:
                'Application layer must NOT import from the interface layer.',
            },
          ],
        },
      ],
    },
  },
];
