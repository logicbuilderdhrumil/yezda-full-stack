/**
 * Comprehensive seed-data script for local/dev environments.
 * Populates all feature tables with realistic sample data.
 *
 * Usage:
 *   npx tsx src/db/seed-data.ts
 *
 * Idempotent – uses INSERT ... ON CONFLICT DO NOTHING.
 */

import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

// ── Connection ───────────────────────────────────────────────────────────────
const DATABASE_URL =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER ?? 'yezda'}:${process.env.DB_PASSWORD ?? 'yezda'}@${process.env.DB_HOST ?? 'postgres'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? 'yezda'}`;

const pool = new Pool({ connectionString: DATABASE_URL });

// ── Constants ────────────────────────────────────────────────────────────────
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '1838bbca-5283-4c07-8514-40e4844b4249';
const EXISTING_CANDIDATE_ID = '80725e4f-571b-4c24-9ad0-ce9546de6991';

// Pre-generated UUIDs for referential integrity
const ORG_ID = 'a0a0a0a0-0001-4000-8000-000000000001';
const CANDIDATE_JANE_ID = 'c1c1c1c1-0001-4000-8000-000000000001';
const CANDIDATE_MARIA_ID = 'c1c1c1c1-0002-4000-8000-000000000002';
const CANDIDATE_ALEX_ID = 'c1c1c1c1-0003-4000-8000-000000000003';
const FORM_BG_CHECK_ID = 'f1f1f1f1-0001-4000-8000-000000000001';
const FORM_EMP_VERIFY_ID = 'f1f1f1f1-0002-4000-8000-000000000002';
const PIPELINE_STANDARD_ID = 'a1a1a1a1-0001-4000-8000-000000000001';
const PIPELINE_QUICK_ID = 'a1a1a1a1-0002-4000-8000-000000000002';
const STAGE_APP_REVIEW_ID = 'b2b2b2b2-0001-4000-8000-000000000001';
const STAGE_BG_VERIFY_ID = 'b2b2b2b2-0002-4000-8000-000000000002';
const STAGE_FINAL_REVIEW_ID = 'b2b2b2b2-0003-4000-8000-000000000003';
const STAGE_EMP_INTAKE_ID = 'b2b2b2b2-0004-4000-8000-000000000004';
const STAGE_EMP_VERIFY_ID = 'b2b2b2b2-0005-4000-8000-000000000005';
const ASSIGNMENT_1_ID = 'a2a2a2a2-0001-4000-8000-000000000001';
const ASSIGNMENT_2_ID = 'a2a2a2a2-0002-4000-8000-000000000002';
const APP_PENDING_ID = 'b1b1b1b1-0001-4000-8000-000000000001';
const APP_IN_PROGRESS_ID = 'b1b1b1b1-0002-4000-8000-000000000002';
const CONVERSATION_ID = 'd1d1d1d1-0001-4000-8000-000000000001';
const PROFILE_ID = 'e1e1e1e1-0001-4000-8000-000000000001';

function uuid(): string {
  return crypto.randomUUID();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function run(label: string, sql: string, params?: unknown[]): Promise<void> {
  try {
    await pool.query(sql, params);
    console.log(`  ✓ ${label}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${label}: ${msg}`);
  }
}

// ── Seed functions ───────────────────────────────────────────────────────────

async function seedOrganization(): Promise<void> {
  console.log('\n📦 Organizations');
  await run('Yezda Screening Services', `
    INSERT INTO organizations (id, name, slug, description, status, plan,
      primary_contact_email, primary_contact_name, created_by, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (slug) DO NOTHING
  `, [
    ORG_ID,
    'Yezda Screening Services',
    'yezda',
    'Full-service background screening and employment verification provider',
    'active',
    'professional',
    'admin@yezda.com',
    'Yezda Admin',
    ADMIN_USER_ID,
    JSON.stringify({ industry: 'screening', employeeCount: 15 }),
  ]);
}

async function seedCandidates(): Promise<void> {
  console.log('\n👤 Candidates');

  // Update existing candidate with management columns
  await run('Update existing candidate (Test Candidate)', `
    UPDATE candidates
    SET first_name = 'Test', last_name = 'Candidate', status = 'active',
        tenant_id = $2, updated_at = NOW()
    WHERE id = $1
  `, [EXISTING_CANDIDATE_ID, TENANT_ID]);

  // Jane Smith
  await run('Jane Smith', `
    INSERT INTO candidates (id, email, password_hash, first_name, last_name, phone, status,
      tenant_id, created_by, application_date, mfa_enabled, failed_attempts)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, NOW(), false, 0)
    ON CONFLICT (id) DO NOTHING
  `, [
    CANDIDATE_JANE_ID,
    'john.doe@example.com',
    'Jane',
    'Smith',
    '+1-555-0101',
    'active',
    TENANT_ID,
    ADMIN_USER_ID,
  ]);

  // Maria Garcia
  await run('Maria Garcia', `
    INSERT INTO candidates (id, email, password_hash, first_name, last_name, phone, status,
      tenant_id, created_by, application_date, mfa_enabled, failed_attempts)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, NOW(), false, 0)
    ON CONFLICT (id) DO NOTHING
  `, [
    CANDIDATE_MARIA_ID,
    'maria.garcia@example.com',
    'Maria',
    'Garcia',
    '+1-555-0102',
    'pending',
    TENANT_ID,
    ADMIN_USER_ID,
  ]);

  // Alex Johnson
  await run('Alex Johnson', `
    INSERT INTO candidates (id, email, password_hash, first_name, last_name, phone, status,
      tenant_id, created_by, application_date, mfa_enabled, failed_attempts)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, NOW(), false, 0)
    ON CONFLICT (id) DO NOTHING
  `, [
    CANDIDATE_ALEX_ID,
    'alex.johnson@example.com',
    'Alex',
    'Johnson',
    '+1-555-0103',
    'in_review',
    TENANT_ID,
    ADMIN_USER_ID,
  ]);
}

async function seedFormDefinitions(): Promise<void> {
  console.log('\n📋 Form Definitions');

  const bgCheckSchema = {
    fields: [
      { id: 'full_name', type: 'text', label: 'Full Legal Name', required: true },
      { id: 'dob', type: 'date', label: 'Date of Birth', required: true },
      { id: 'ssn_last4', type: 'text', label: 'Last 4 of SSN', required: true, maxLength: 4 },
      { id: 'address', type: 'text', label: 'Current Address', required: true },
      { id: 'consent_criminal', type: 'checkbox', label: 'I consent to a criminal background check', required: true },
      { id: 'consent_credit', type: 'checkbox', label: 'I consent to a credit check', required: false },
      { id: 'additional_info', type: 'textarea', label: 'Additional Information', required: false },
    ],
  };

  const empVerifySchema = {
    fields: [
      { id: 'employer_name', type: 'text', label: 'Employer Name', required: true },
      { id: 'job_title', type: 'text', label: 'Job Title', required: true },
      { id: 'start_date', type: 'date', label: 'Employment Start Date', required: true },
      { id: 'end_date', type: 'date', label: 'Employment End Date', required: false },
      { id: 'is_current', type: 'checkbox', label: 'Currently Employed Here', required: false },
      { id: 'supervisor_name', type: 'text', label: 'Supervisor Name', required: false },
      { id: 'supervisor_phone', type: 'text', label: 'Supervisor Phone', required: false },
    ],
  };

  await run('Background Check Form', `
    INSERT INTO form_definitions (id, tenant_id, name, description, schema, version, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    FORM_BG_CHECK_ID,
    TENANT_ID,
    'Background Check Form',
    'Standard form for initiating a background check on a candidate',
    JSON.stringify(bgCheckSchema),
    1,
    'published',
    ADMIN_USER_ID,
  ]);

  await run('Employment Verification Form', `
    INSERT INTO form_definitions (id, tenant_id, name, description, schema, version, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    FORM_EMP_VERIFY_ID,
    TENANT_ID,
    'Employment Verification Form',
    'Form for verifying previous and current employment history',
    JSON.stringify(empVerifySchema),
    1,
    'published',
    ADMIN_USER_ID,
  ]);
}

async function seedPipelines(): Promise<void> {
  console.log('\n🔄 Screening Pipelines');

  // Standard Background Check pipeline
  await run('Standard Background Check pipeline', `
    INSERT INTO screening_pipelines (id, tenant_id, name, description, status, version, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO NOTHING
  `, [
    PIPELINE_STANDARD_ID,
    TENANT_ID,
    'Standard Background Check',
    'Full background check pipeline with application review, verification, and final review stages',
    'active',
    1,
    ADMIN_USER_ID,
  ]);

  // Quick Employment Verification pipeline
  await run('Quick Employment Verification pipeline', `
    INSERT INTO screening_pipelines (id, tenant_id, name, description, status, version, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO NOTHING
  `, [
    PIPELINE_QUICK_ID,
    TENANT_ID,
    'Quick Employment Verification',
    'Fast-track employment verification with intake and verification stages',
    'active',
    1,
    ADMIN_USER_ID,
  ]);
}

async function seedPipelineStages(): Promise<void> {
  console.log('\n📊 Pipeline Stages');

  // Standard BG Check stages
  await run('Stage: Application Review', `
    INSERT INTO pipeline_stages (id, pipeline_id, form_definition_id, name, description, "order",
      is_required, estimated_duration_minutes, module_type, module_config)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'form', $9)
    ON CONFLICT (id) DO NOTHING
  `, [
    STAGE_APP_REVIEW_ID,
    PIPELINE_STANDARD_ID,
    FORM_BG_CHECK_ID,
    'Application Review',
    'Initial review of candidate application and consent forms',
    0,
    true,
    30,
    JSON.stringify({ formDefinitionId: FORM_BG_CHECK_ID }),
  ]);

  await run('Stage: Background Verification', `
    INSERT INTO pipeline_stages (id, pipeline_id, form_definition_id, name, description, "order",
      is_required, estimated_duration_minutes, module_type, module_config)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, 'external_service', $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    STAGE_BG_VERIFY_ID,
    PIPELINE_STANDARD_ID,
    'Background Verification',
    'External background verification including criminal, credit, and education checks',
    1,
    true,
    1440,
    JSON.stringify({ provider: 'internal', checks: ['criminal', 'credit', 'education'] }),
  ]);

  await run('Stage: Final Review', `
    INSERT INTO pipeline_stages (id, pipeline_id, form_definition_id, name, description, "order",
      is_required, estimated_duration_minutes, module_type, module_config)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, 'human_review', $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    STAGE_FINAL_REVIEW_ID,
    PIPELINE_STANDARD_ID,
    'Final Review',
    'Human review and approval of all background check results',
    2,
    true,
    60,
    JSON.stringify({ assigneeRole: 'admin', requiresApproval: true }),
  ]);

  // Quick Employment Verification stages
  await run('Stage: Employment Intake', `
    INSERT INTO pipeline_stages (id, pipeline_id, form_definition_id, name, description, "order",
      is_required, estimated_duration_minutes, module_type, module_config)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'form', $9)
    ON CONFLICT (id) DO NOTHING
  `, [
    STAGE_EMP_INTAKE_ID,
    PIPELINE_QUICK_ID,
    FORM_EMP_VERIFY_ID,
    'Employment Intake',
    'Candidate provides employment history details',
    0,
    true,
    15,
    JSON.stringify({ formDefinitionId: FORM_EMP_VERIFY_ID }),
  ]);

  await run('Stage: Employment Verification', `
    INSERT INTO pipeline_stages (id, pipeline_id, form_definition_id, name, description, "order",
      is_required, estimated_duration_minutes, module_type, module_config)
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, 'external_service', $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    STAGE_EMP_VERIFY_ID,
    PIPELINE_QUICK_ID,
    'Employment Verification',
    'Automated verification of employment records with previous employers',
    1,
    true,
    720,
    JSON.stringify({ provider: 'internal', checks: ['employment'] }),
  ]);
}

async function seedPipelineAssignments(): Promise<void> {
  console.log('\n🔗 Pipeline Assignments');

  await run('Assign existing candidate → Standard BG Check', `
    INSERT INTO pipeline_assignments (id, tenant_id, pipeline_id, candidate_id, current_stage_order,
      status, stage_statuses, progress_percentage, assigned_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO NOTHING
  `, [
    ASSIGNMENT_1_ID,
    TENANT_ID,
    PIPELINE_STANDARD_ID,
    EXISTING_CANDIDATE_ID,
    0,
    'in_progress',
    JSON.stringify({ '0': 'in_progress', '1': 'pending', '2': 'pending' }),
    10,
    ADMIN_USER_ID,
  ]);

  await run('Assign Jane Smith → Quick Employment Verification', `
    INSERT INTO pipeline_assignments (id, tenant_id, pipeline_id, candidate_id, current_stage_order,
      status, stage_statuses, progress_percentage, assigned_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO NOTHING
  `, [
    ASSIGNMENT_2_ID,
    TENANT_ID,
    PIPELINE_QUICK_ID,
    CANDIDATE_JANE_ID,
    1,
    'in_progress',
    JSON.stringify({ '0': 'completed', '1': 'in_progress' }),
    50,
    ADMIN_USER_ID,
  ]);
}

async function seedApplications(): Promise<void> {
  console.log('\n📝 Applications');

  await run('Pending application', `
    INSERT INTO applications (id, candidate_id, tenant_id, form_definition_id, title, description,
      status, due_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    APP_PENDING_ID,
    EXISTING_CANDIDATE_ID,
    TENANT_ID,
    FORM_BG_CHECK_ID,
    'Background Check Application',
    'Please complete the background check consent form to continue with your screening.',
    'pending',
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  ]);

  await run('In-progress application', `
    INSERT INTO applications (id, candidate_id, tenant_id, form_definition_id, title, description,
      status, due_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    APP_IN_PROGRESS_ID,
    EXISTING_CANDIDATE_ID,
    TENANT_ID,
    FORM_EMP_VERIFY_ID,
    'Employment History Verification',
    'Please provide your employment history for the past 7 years.',
    'in_progress',
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  ]);
}

async function seedNotifications(): Promise<void> {
  console.log('\n🔔 Notifications');

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const notifications = [
    {
      type: 'SYSTEM',
      priority: 'high',
      title: 'System Maintenance Scheduled',
      body: 'The platform will undergo maintenance on Saturday from 2:00 AM to 4:00 AM UTC. Please save your work.',
      status: 'unread',
    },
    {
      type: 'APPLICATION',
      priority: 'normal',
      title: 'New Application Submitted',
      body: 'Test Candidate has submitted a background check application requiring review.',
      status: 'unread',
      actionUrl: '/admin/applications',
    },
    {
      type: 'SCREENING',
      priority: 'urgent',
      title: 'Screening Results Available',
      body: 'Background check results for Jane Smith are ready for final review.',
      status: 'unread',
      actionUrl: '/admin/screenings',
    },
    {
      type: 'SYSTEM',
      priority: 'low',
      title: 'Welcome to Yezda',
      body: 'Your admin account has been set up. Explore the dashboard to get started.',
      status: 'read',
    },
    {
      type: 'SCREENING',
      priority: 'normal',
      title: 'Pipeline Assignment Updated',
      body: 'Maria Garcia has been moved to the next stage in the Standard Background Check pipeline.',
      status: 'unread',
      actionUrl: '/admin/pipelines',
    },
  ];

  for (const n of notifications) {
    await run(`Notification: ${n.title}`, `
      INSERT INTO notifications (id, tenant_id, user_id, user_type, type, priority, title, body,
        status, action_url, expires_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      TENANT_ID,
      ADMIN_USER_ID,
      'user',
      n.type,
      n.priority,
      n.title,
      n.body,
      n.status,
      n.actionUrl ?? null,
      expiresAt,
    ]);
  }
}

async function seedLedgerEntries(): Promise<void> {
  console.log('\n💰 Ledger Entries');

  const entries = [
    {
      id: uuid(),
      entryType: 'screening_fee',
      status: 'finalized',
      description: 'Standard background check screening fee',
      quantity: 1,
      unitPrice: 4500, // $45.00 in cents
      totalAmount: 4500,
      referenceType: 'pipeline_assignment',
      referenceId: ASSIGNMENT_1_ID,
    },
    {
      id: uuid(),
      entryType: 'subscription',
      status: 'finalized',
      description: 'Professional plan monthly subscription – February 2026',
      quantity: 1,
      unitPrice: 9900, // $99.00
      totalAmount: 9900,
      referenceType: 'organization',
      referenceId: ORG_ID,
    },
    {
      id: uuid(),
      entryType: 'verification_fee',
      status: 'pending',
      description: 'Employment verification service fee',
      quantity: 2,
      unitPrice: 2500, // $25.00
      totalAmount: 5000,
      referenceType: 'pipeline_assignment',
      referenceId: ASSIGNMENT_2_ID,
    },
  ];

  for (const e of entries) {
    await run(`Ledger: ${e.entryType} (${e.description.substring(0, 40)}…)`, `
      INSERT INTO ledger_entries (id, tenant_id, organization_id, entry_type, status, description,
        quantity, unit_price, total_amount, currency, reference_id, reference_type,
        created_by, created_by_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING
    `, [
      e.id,
      TENANT_ID,
      ORG_ID,
      e.entryType,
      e.status,
      e.description,
      e.quantity,
      e.unitPrice,
      e.totalAmount,
      'USD',
      e.referenceId,
      e.referenceType,
      ADMIN_USER_ID,
      'user',
    ]);
  }
}

async function seedReviewTasks(): Promise<void> {
  console.log('\n📑 Review Tasks');

  await run('Review Task: pending', `
    INSERT INTO review_tasks (id, tenant_id, pipeline_id, assignment_id, stage_id, candidate_id,
      assignee_id, assignee_role, status, decision_options, timeout_hours,
      due_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    TENANT_ID,
    PIPELINE_STANDARD_ID,
    ASSIGNMENT_1_ID,
    STAGE_FINAL_REVIEW_ID,
    EXISTING_CANDIDATE_ID,
    ADMIN_USER_ID,
    'admin',
    'pending',
    JSON.stringify(['approve', 'reject', 'request_more_info']),
    48,
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
  ]);

  await run('Review Task: in_review', `
    INSERT INTO review_tasks (id, tenant_id, pipeline_id, assignment_id, stage_id, candidate_id,
      assignee_id, assignee_role, status, decision_options, timeout_hours,
      due_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    TENANT_ID,
    PIPELINE_QUICK_ID,
    ASSIGNMENT_2_ID,
    STAGE_EMP_VERIFY_ID,
    CANDIDATE_JANE_ID,
    ADMIN_USER_ID,
    'admin',
    'in_review',
    JSON.stringify(['approve', 'reject']),
    24,
    new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
  ]);
}

async function seedConversationsAndMessages(): Promise<void> {
  console.log('\n💬 Conversations & Messages');

  const participants = [
    { id: ADMIN_USER_ID, type: 'user', name: 'Yezda Admin' },
    { id: EXISTING_CANDIDATE_ID, type: 'candidate', name: 'Test Candidate' },
  ];

  await run('Conversation', `
    INSERT INTO conversations (id, tenant_id, title, status, participants,
      last_message_content, last_message_sender_id, last_message_sent_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (id) DO NOTHING
  `, [
    CONVERSATION_ID,
    TENANT_ID,
    'Background Check – Test Candidate',
    'active',
    JSON.stringify(participants),
    'Thank you, I will upload those documents shortly.',
    EXISTING_CANDIDATE_ID,
  ]);

  const messages = [
    {
      senderId: ADMIN_USER_ID,
      senderType: 'user',
      content: 'Hello, we need a few additional documents to proceed with your background check. Could you please upload a government-issued ID and proof of address?',
      minutesAgo: 120,
    },
    {
      senderId: EXISTING_CANDIDATE_ID,
      senderType: 'candidate',
      content: 'Sure, which types of proof of address are accepted?',
      minutesAgo: 90,
    },
    {
      senderId: ADMIN_USER_ID,
      senderType: 'user',
      content: 'A utility bill, bank statement, or lease agreement from the last 3 months would work.',
      minutesAgo: 60,
    },
  ];

  for (const m of messages) {
    const ts = new Date(Date.now() - m.minutesAgo * 60 * 1000).toISOString();
    await run(`Message from ${m.senderType}`, `
      INSERT INTO messages (id, conversation_id, tenant_id, sender_id, sender_type,
        content, content_type, status, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'text', 'sent', $6)
    `, [
      CONVERSATION_ID,
      TENANT_ID,
      m.senderId,
      m.senderType,
      m.content,
      ts,
    ]);
  }
}

async function seedUserProfile(): Promise<void> {
  console.log('\n🧑 User Profiles');

  await run('Admin user profile', `
    INSERT INTO user_profiles (id, tenant_id, user_id, user_type, display_name, phone,
      timezone, locale, bio, notifications_enabled, email_notifications_enabled)
    VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT ON CONSTRAINT uq_user_profiles_tenant_user DO NOTHING
  `, [
    PROFILE_ID,
    TENANT_ID,
    ADMIN_USER_ID,
    'user',
    'Yezda Admin',
    '+1-555-0100',
    'Europe/London',
    'en-GB',
    'Platform administrator for Yezda Screening Services.',
    true,
    true,
  ]);
}

async function seedAuditLogs(): Promise<void> {
  console.log('\n📜 Audit Logs');

  const entries = [
    {
      eventType: 'user.login',
      actorId: ADMIN_USER_ID,
      actorType: 'user',
      channel: 'web',
      success: true,
      metadata: { ip: '192.168.1.10', browser: 'Chrome 120' },
    },
    {
      eventType: 'candidate.create',
      actorId: ADMIN_USER_ID,
      actorType: 'user',
      targetId: CANDIDATE_JANE_ID,
      targetType: 'candidate',
      channel: 'web',
      success: true,
      metadata: { candidateEmail: 'john.doe@example.com' },
    },
    {
      eventType: 'pipeline.assign',
      actorId: ADMIN_USER_ID,
      actorType: 'user',
      targetId: ASSIGNMENT_1_ID,
      targetType: 'pipeline_assignment',
      channel: 'api',
      success: true,
      metadata: { pipelineName: 'Standard Background Check', candidateId: EXISTING_CANDIDATE_ID },
    },
  ];

  for (const e of entries) {
    await run(`Audit: ${e.eventType}`, `
      INSERT INTO audit_logs (id, event_type, actor_id, actor_type, target_id, target_type,
        channel, ip_address, metadata, success)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      e.eventType,
      e.actorId,
      e.actorType,
      e.targetId ?? null,
      e.targetType ?? null,
      e.channel,
      '192.168.1.10',
      JSON.stringify(e.metadata),
      e.success,
    ]);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Yezda Seed Data — starting…');
  console.log(`   DATABASE_URL: ${DATABASE_URL.replace(/:[^@]+@/, ':****@')}`);

  await seedOrganization();
  await seedCandidates();
  await seedFormDefinitions();
  await seedPipelines();
  await seedPipelineStages();
  await seedPipelineAssignments();
  await seedApplications();
  await seedNotifications();
  await seedLedgerEntries();
  await seedReviewTasks();
  await seedConversationsAndMessages();
  await seedUserProfile();
  await seedAuditLogs();

  console.log('\n✅ Seed data complete.\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
