# Yezda Full-Stack Release Checklist

**Version:** Post-Wave 5 Integration Release  
**Date:** 2026-02-04

---

## 1. Pre-Release Checklist

### 1.1 Code Verification
- [ ] All wave implementations complete (Waves 1-4)
- [ ] All integration alignments complete (Wave 5)
- [ ] All reviews passed (backend, frontend, app)
- [ ] No critical or high-severity open issues
- [ ] Feature branches merged to main

### 1.2 Test Validation
```powershell
# Backend tests
cd backend; npm test -- --reporter=basic

# Frontend tests  
cd frontend; npm test -- --run

# App tests
cd app; npm test
```
- [ ] Backend unit/integration tests pass
- [ ] Frontend unit/component tests pass
- [ ] App unit tests pass
- [ ] No regressions in existing functionality

### 1.3 Static Analysis
```powershell
# Type checking
cd backend; npm run typecheck
cd frontend; npm run lint
cd app; npm run typecheck

# Linting
cd backend; npm run lint
cd frontend; npm run lint
cd app; npm run lint
```
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] No new security warnings

### 1.4 Build Verification
```powershell
# Backend build
cd backend; npm run build

# Frontend production build
cd frontend; npm run build

# Verify build outputs exist
Test-Path backend/dist/index.js
Test-Path frontend/dist/index.html
```
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Build artifacts are correct size (no missing chunks)

### 1.5 Environment Configuration Audit

#### Backend Required Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_ACCESS_SECRET` | Yes | Min 32 chars, cryptographically random |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars, cryptographically random |
| `MFA_ENCRYPTION_KEY` | Yes | Min 32 chars, cryptographically random |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Yes | Min 32 chars, cryptographically random |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (default: 5432) |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `REDIS_HOST` | Yes | Redis host |
| `REDIS_PORT` | Yes | Redis port (default: 6379) |
| `REDIS_PASSWORD` | Recommended | Redis password |

#### Optional OAuth Providers (if used)
| Variable | Purpose |
|----------|---------|
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `OAUTH_MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID |
| `OAUTH_MICROSOFT_CLIENT_SECRET` | Microsoft OAuth secret |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth secret |
| `OAUTH_SLACK_CLIENT_ID` | Slack OAuth client ID |
| `OAUTH_SLACK_CLIENT_SECRET` | Slack OAuth secret |

#### Firebase Configuration (if push notifications enabled)
| Variable | Required | Purpose |
|----------|----------|---------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key |
| `FIREBASE_DATABASE_URL` | Optional | Realtime database URL |
| `FIREBASE_STORAGE_BUCKET` | Optional | Cloud storage bucket |

#### File Storage Configuration
| Variable | Required | Purpose |
|----------|----------|---------|
| `FILE_STORAGE_ADAPTER` | Yes | `local` or `s3` |
| `FILE_STORAGE_S3_BUCKET` | If S3 | S3 bucket name |
| `FILE_STORAGE_S3_REGION` | If S3 | AWS region |
| `FILE_STORAGE_S3_ACCESS_KEY` | If S3 | AWS access key |
| `FILE_STORAGE_S3_SECRET_KEY` | If S3 | AWS secret key |

- [ ] All required variables configured
- [ ] No dev/default secrets in production
- [ ] Secrets stored securely (not in code)

### 1.6 Database Readiness
- [ ] Database backup completed before migration
- [ ] Migration scripts reviewed for breaking changes
- [ ] Rollback scripts prepared (if applicable)

---

## 2. Deployment Steps

### 2.1 Pre-Deploy Database Migration
```powershell
# Run migrations (idempotent)
cd backend
node dist/db/migrate.js
```
- [ ] Migrations run successfully
- [ ] Verify `_migrations` table shows all migrations applied

### 2.2 Backend Deployment

#### Staged Rollout (Recommended)
1. **Canary (5% traffic)**
   - [ ] Deploy to canary instance
   - [ ] Monitor logs for 15 minutes
   - [ ] Verify API health endpoints respond

2. **Gradual increase (25% → 50% → 100%)**
   - [ ] Increase traffic incrementally
   - [ ] Monitor error rates between stages
   - [ ] Proceed only if error rate < baseline + 1%

#### Health Check Endpoints
```bash
# API health check
curl https://api.yezda.com/api/v1/health

# Expected response: { "status": "ok", "timestamp": "..." }
```

### 2.3 Frontend Deployment
```powershell
# Build and deploy static assets
cd frontend
npm run build

# Deploy dist/ to CDN/static hosting
```
- [ ] Assets uploaded to CDN
- [ ] Cache headers configured (immutable for hashed assets)
- [ ] Index.html cache-control: no-cache

### 2.4 Mobile App Deployment (Expo)
```powershell
cd app

# For OTA updates
npx expo publish

# For store releases
npx eas build --platform all
```
- [ ] App builds submitted to stores (if applicable)
- [ ] OTA update published (if applicable)

---

## 3. Post-Deploy Validation

### 3.1 Smoke Tests
- [ ] Homepage loads correctly
- [ ] User login/logout works
- [ ] API authentication functional
- [ ] WebSocket connections establish
- [ ] Database queries return data

### 3.2 Critical Path Verification
- [ ] User registration flow
- [ ] Candidate creation
- [ ] Form builder operations
- [ ] File upload/download
- [ ] Real-time notifications
- [ ] Dashboard loads with data

### 3.3 Integration Checks
- [ ] Frontend ↔ Backend API calls succeed
- [ ] App ↔ Backend API calls succeed
- [ ] Socket.IO real-time events work
- [ ] Firebase push notifications deliver

---

## 4. Monitoring & Alerting

### 4.1 Key Metrics to Watch (First 24 Hours)
| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Error rate | > 1% | Investigate immediately |
| API latency p99 | > 2000ms | Review slow queries |
| 5xx responses | > 0.5% | Check logs, consider rollback |
| Database connections | > 80% pool | Scale or optimize |
| Redis memory | > 80% | Check key expiry, eviction |
| CPU utilization | > 80% sustained | Scale horizontally |

### 4.2 Log Monitoring Commands
```powershell
# Watch for errors (example for PM2/systemd)
pm2 logs backend --err --lines 100

# Check for authentication failures
grep -i "auth.*fail\|unauthorized" /var/log/yezda/backend.log

# Monitor rate limiting
grep -i "rate.*limit" /var/log/yezda/backend.log
```

### 4.3 Alert Configuration
- [ ] Error rate alerts configured
- [ ] Latency alerts configured  
- [ ] On-call rotation notified
- [ ] Incident response channel ready

---

## 5. Rollback Plan

### 5.1 Rollback Triggers
Initiate rollback if ANY of these occur:
- [ ] Error rate > 5% for 5+ minutes
- [ ] Critical user-facing functionality broken
- [ ] Data corruption detected
- [ ] Security vulnerability discovered

### 5.2 Rollback Procedure

#### Step 1: Traffic Diversion
```bash
# Immediately route traffic to previous version
# (Specific commands depend on infrastructure)
```

#### Step 2: Backend Rollback
```powershell
# Option A: Container/image rollback
docker pull yezda/backend:previous-tag
docker-compose up -d backend

# Option B: Process manager rollback
pm2 deploy production revert
```

#### Step 3: Frontend Rollback
```powershell
# Restore previous static assets
# CDN cache invalidation if needed
```

#### Step 4: Database Rollback (If Needed)
> ⚠️ **WARNING**: Database rollback may cause data loss. Only proceed if migrations caused issues.

```sql
-- Check current migration state
SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 5;

-- Manual rollback steps (schema-specific)
-- Document any manual SQL needed
```

**Migration Rollback Considerations:**
| Migration | One-Way? | Rollback Notes |
|-----------|----------|----------------|
| 001-006 | No | Standard tables, can drop |
| 007+ | Verify | Check for data dependencies |

#### Step 5: Verification After Rollback
- [ ] Previous version serving traffic
- [ ] Health checks passing
- [ ] Critical paths working
- [ ] Error rate normalized

### 5.3 Communication
- [ ] Notify stakeholders of rollback
- [ ] Update status page (if applicable)
- [ ] Document incident details

---

## 6. Post-Release Tasks

### 6.1 Immediate (Day 1)
- [ ] Monitor metrics for 24 hours
- [ ] Review logs for unexpected errors
- [ ] Collect initial user feedback

### 6.2 Short-term (Week 1)
- [ ] Performance baseline comparison
- [ ] Database query analysis
- [ ] Document any production issues
- [ ] Update runbooks if needed

### 6.3 Documentation Updates
- [ ] Update API documentation
- [ ] Update environment variable docs
- [ ] Archive release notes

---

## 7. Emergency Contacts

| Role | Contact |
|------|---------|
| On-call Engineer | (Configure in PagerDuty/Opsgenie) |
| Backend Lead | (Configure) |
| Frontend Lead | (Configure) |
| DevOps/SRE | (Configure) |

---

## Appendix A: Quick Reference Commands

### Start Services (Development)
```powershell
# Backend
cd backend; npm run dev

# Frontend  
cd frontend; npm run dev

# App
cd app; npm start
```

### Start Services (Production)
```powershell
# Backend
cd backend; npm run build && npm start

# Frontend (serve built assets)
cd frontend; npm run build && npm run preview
```

### Database Commands
```powershell
# Run migrations
cd backend; npx tsx src/db/migrate.ts

# Connect to PostgreSQL
psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME
```

### Health Checks
```bash
# Backend health
curl http://localhost:6312/api/v1/health

# Frontend (dev server)
curl http://localhost:6313
```
