# Production Readiness Checklist

Final reference before deploying SG Pro Growth LMS to production.

**Last updated:** 2026-07-07  
**Engineering readiness:** 94%  
**Production launch readiness:** 80% (blocked on company assets + infrastructure)

---

## Completed items

### Security
- [x] JWT access + refresh secrets validated at startup (min 32 chars in production)
- [x] `APP_SECRET` required — used as HMAC pepper for refresh and email tokens
- [x] Production rejects placeholder secrets, Ethereal SMTP, and `E2E_TEST_MODE`
- [x] Production requires `REDIS_URL`, `CORS_ORIGIN`, and SMTP when mail enabled
- [x] Production validates S3 credentials when `STORAGE_PROVIDER=s3`
- [x] Argon2 password hashing
- [x] JWT re-validates user status and role on every request
- [x] Refresh token rotation with hashed storage
- [x] Global rate limiting (Redis-backed when configured)
- [x] Per-endpoint rate limits configurable via `THROTTLE_*` env vars
- [x] Helmet security headers + CORP fix for cross-origin API (Safari)
- [x] File upload MIME, extension, and size validation
- [x] Filename sanitization and path traversal protection on storage
- [x] Import uploads limited to 10 MB with CSV/XLSX validation
- [x] Swagger disabled in production
- [x] Generic 500 error messages (no stack trace leakage)
- [x] XSS mitigations (no `dangerouslySetInnerHTML` on user content)
- [x] Frontend session cleared on refresh failure; safe redirect validation

### Code quality
- [x] Mock workspace removed — dashboards load from API only
- [x] Dead code and unused components removed (~7,500 lines net reduction)
- [x] No `TODO` / `FIXME` / `console.log` in application source (`src/`)
- [x] Dev-only auth token helper gated by `import.meta.env.DEV` + `E2E_TEST_MODE`

### Performance
- [x] Code splitting (React/router vendor chunks; lazy routes)
- [x] Workspace stale-while-revalidate cache
- [x] 60s Redis cache on `/students/me` and `/instructors/me`
- [x] Prisma query optimization (counts, caps, N+1 fixes)
- [x] DB performance indexes migration applied

### Testing & verification
- [x] Backend unit tests (7/7)
- [x] API verification suite (`npm run verify:backend` — 132+ checks)
- [x] Frontend smoke tests (`npm run verify:frontend`)
- [x] Cross-browser (Chrome + Safari) — `npm run verify:cross-browser`
- [x] Responsive (desktop/tablet/mobile) — `npm run verify:responsive`
- [x] CI pipeline (build, test, verify, Docker build)

### Documentation
- [x] Root `README.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`
- [x] Complete `backend/.env.example` with all variables documented
- [x] Frontend `.env.example`

### Operations
- [x] Health probes: `/health/live`, `/health/ready`, `/health/detailed`
- [x] Structured logging (nestjs-pino, request IDs)
- [x] Docker production compose + multi-stage Dockerfile
- [x] BullMQ workers (mail, certificates, imports, analytics, cleanup)

---

## Remaining company-dependent items

| Item | Owner | Notes |
|------|-------|-------|
| **SMTP credentials** | Company | `SMTP_HOST` / `SMTP_URL`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| **Branding** | Company | Logo, favicon, colors, marketing copy approval |
| **Production domains** | Company | Frontend URL + API URL for `CORS_ORIGIN` and `VITE_API_URL` |
| **Legal pages** | Company | Privacy policy and terms of service URLs |
| **Course media** | Company | Real thumbnails, partner logos, testimonial approval |
| **Contact email** | Company | Confirm or replace `contact@sgprogrowth.com` mailto links |
| **Analytics** | Company | GTM container ID (optional) |
| **Feature prioritization** | Company | Messages, Downloads, Coaching, Earnings (currently Coming Soon) |

---

## Remaining deployment tasks

| Task | Notes |
|------|-------|
| Provision hosting | VPS, Kubernetes, or PaaS for API + static frontend |
| TLS certificates | Reverse proxy (nginx, Caddy, ALB) with HTTPS |
| Production PostgreSQL | Managed DB with automated backups |
| Production Redis | Required for rate limits, cache, and job queues |
| Production S3 bucket | Replace MinIO; set `STORAGE_PROVIDER=s3` |
| DNS configuration | Route app and API subdomains |
| Deploy pipeline | Build images, run migrations, health-check gate |
| Secrets management | Inject JWT/APP/S3/SMTP secrets (never commit) |
| Monitoring & alerting | Sentry, Datadog, or equivalent |
| WAF / CDN | Edge rate limiting and static asset delivery |
| Backup & DR test | Restore PostgreSQL from backup; verify RTO/RPO |
| Load testing | Validate rate limits and workspace cache under load |
| `xlsx` migration | Replace unmaintained `xlsx@0.18.5` with `exceljs` (see Security) |

---

## Security checklist

### Pre-deploy
- [ ] Generate **new** secrets for production (`openssl rand -base64 48` for each):
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `APP_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Set `E2E_TEST_MODE=false` (or omit)
- [ ] Set `SMTP_USE_ETHEREAL=false`
- [ ] Configure real SMTP and send a test verification email
- [ ] Set `CORS_ORIGIN` to exact production frontend origin(s)
- [ ] Set production S3 credentials (not MinIO dev keys)
- [ ] Confirm `REQUIRE_EMAIL_VERIFICATION=true`
- [ ] Review rate limits (see recommended defaults below)
- [ ] Run `npm audit` and acknowledge `xlsx` risk or migrate

### Post-deploy
- [ ] Verify `/health/ready` returns 200
- [ ] Confirm Swagger is **not** accessible at `/docs`
- [ ] Confirm `/auth/test/token` returns 403
- [ ] Test login, registration, and password reset flows
- [ ] Verify file upload rejects invalid MIME types
- [ ] Confirm certificate public verify is rate-limited

### Recommended production rate limits (per 60s)

| Variable | Recommended | Endpoint |
|----------|-------------|----------|
| `THROTTLE_LOGIN_LIMIT` | 10 | POST `/auth/login` |
| `THROTTLE_REGISTER_LIMIT` | 10 | POST `/auth/register` |
| `THROTTLE_FORGOT_PASSWORD_LIMIT` | 5 | POST `/auth/forgot-password` |
| `THROTTLE_RESET_PASSWORD_LIMIT` | 10 | POST `/auth/reset-password` |
| `THROTTLE_VERIFY_EMAIL_LIMIT` | 20 | GET `/auth/verify-email` |
| `THROTTLE_RESEND_VERIFICATION_LIMIT` | 5 | POST `/auth/resend-verification` |
| `THROTTLE_UPLOAD_LIMIT` | 30 | All file upload endpoints |
| `THROTTLE_CERTIFICATE_VERIFY_LIMIT` | 30 | GET `/certificates/verify/:id` |
| `THROTTLE_PUBLIC_LIMIT` | 60 | Catalog, categories, course detail |
| `THROTTLE_DEFAULT_LIMIT` | 120 | All other authenticated routes |
| `THROTTLE_AUTH_LIMIT` | 20 | Auth bucket (refresh/logout/change-password) |

Enable `THROTTLE_USE_REDIS=true` for multi-instance deployments.

---

## Performance checklist

- [ ] Enable Redis for cache, throttler, and BullMQ
- [ ] Set `MAIL_QUEUE_ENABLED=true` for async email
- [ ] Serve frontend static assets via CDN
- [ ] Confirm DB indexes applied (`prisma migrate deploy`)
- [ ] Monitor `/health/detailed` for slow queries and memory
- [ ] Consider read replica for analytics at scale
- [ ] Consider dedicated worker containers for high email volume

---

## Testing checklist

Run before each release:

```bash
docker compose up -d
cd backend && cp .env.example .env   # first time only; set APP_SECRET
cd backend && npx prisma migrate deploy && npm run db:seed
cd backend && npm run start:dev      # terminal 1
npm run dev                          # terminal 2

cd backend && npm test
npm run verify:backend               # wait 60s before browser tests
npm run verify:frontend
npm run verify:cross-browser
npm run verify:responsive
npm run build && cd backend && npm run build
```

---

## Pre-launch checklist

- [ ] All verification suites pass
- [ ] Production secrets rotated (not copied from `.env.example`)
- [ ] SMTP sending verified with real inbox
- [ ] SSL/TLS active on all public URLs
- [ ] Database seeded with production org (not dev seed in prod)
- [ ] Error monitoring connected
- [ ] Backup schedule configured
- [ ] Runbook documented for on-call
- [ ] Legal/compliance review complete

---

## Post-deployment checklist

- [ ] Smoke test: register → verify → login → enroll → complete lesson
- [ ] Smoke test: instructor create course → publish → assign quiz
- [ ] Monitor error rates for 24 hours
- [ ] Verify email deliverability (not spam folder)
- [ ] Check Redis memory and queue depth
- [ ] Check PostgreSQL connection pool and slow query log
- [ ] Confirm automated backups ran successfully
- [ ] Document production URLs and admin contacts

---

## Known remaining vulnerabilities

| Package | Severity | Mitigation | Fix |
|---------|----------|------------|-----|
| `xlsx@0.18.5` | High | Auth-gated imports; 10 MB limit; MIME validation | Migrate to `exceljs` |

Frontend: **0 vulnerabilities** (last audit 2026-07-07).
