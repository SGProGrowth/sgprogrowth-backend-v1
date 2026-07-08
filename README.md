# SG Pro Growth LMS

Full-stack learning platform — marketing site, **Student** portal, **Instructor** portal, and REST API. This repository contains the complete **client-side LMS** implementation. The **Admin module** is a separate integration effort; see [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md).

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ |
| Storage | S3-compatible (MinIO locally, AWS S3 in production) |
| Email | Nodemailer (SMTP / Ethereal for local dev) |
| Auth | JWT access + refresh tokens, Argon2, email verification |

---

## Features implemented

### Public
- Marketing homepage, course catalog, course detail pages
- Public certificate verification (`/verify/:credentialId`)

### Authentication
- Registration (student / instructor), email verification, login, logout
- Refresh token rotation, forgot / reset password, change password

### Student portal (`/dashboard/*`)
- Overview, courses, progress, assignments, quizzes (player + results)
- Certificates, notifications, calendar, batches, profile & settings

### Instructor portal (`/instructor/*`)
- Overview, course CRUD, curriculum editor, course preview
- Assignments (create, publish, grade), question bank (import/export)
- Quiz engine, student roster, bulk CSV import
- Batches, certificates & templates, analytics & reports
- Notifications, calendar, profile & settings

### Backend capabilities
- Workspace aggregation APIs for dashboard bootstrap
- Learning progress tracking, enrollment management
- Media uploads (avatars, course assets, lesson resources)
- SMTP transactional + notification emails
- Rate limiting, security headers, input validation

### Intentionally deferred (Coming Soon)
Messages, live coaching, downloads, earnings/payouts, announcements — see [Known limitations](#known-limitations--upcoming-features).

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| Node.js | 20+ |
| npm | 10+ (bundled with Node) |
| Docker Desktop | For PostgreSQL, Redis, MinIO |
| Playwright browsers | Optional — `npx playwright install chromium` for frontend verification |

---

## Quick start (local development)

### 1. Clone and start infrastructure

```bash
git clone <repository-url>
cd homepage
docker compose up -d
```

| Service | Port | Credentials (dev only) |
|---------|------|--------------------------|
| PostgreSQL | 5432 | User `sgpg`, password `sgpg_dev_password`, DB `sgpg_lms` |
| Redis | 6379 | No password (local) |
| MinIO API | 9000 | User `sgpg_minio`, password `sgpg_minio_dev_password` |
| MinIO Console | 9001 | Same credentials — create bucket `sgpg-lms` if not auto-created |

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/api/v1` | REST API base |
| `http://localhost:3000/docs` | Swagger UI (**development only**) |
| `http://localhost:3000/api/v1/health` | Health check |

### 3. Frontend

In a **second terminal**, from the repo root:

```bash
cp .env.example .env
npm install
npm run dev
```

App: **`http://localhost:5173`**

---

## Demo accounts

Password for **all** seeded users: **`Password123!`**

| Email | Role | Use for |
|-------|------|---------|
| `neha.sharma@example.com` | student | Primary student testing |
| `ankit.verma@example.com` | student | Secondary student / isolation tests |
| `cloud.lead@example.com` | instructor | Primary instructor testing |
| `pm.coach@example.com` | instructor | Secondary instructor |
| `data.trainer@example.com` | instructor | Course author samples |

**Example course slugs:** `aws-solutions-architect`, `it-project-management`, `data-analytics-pro`

> **Note:** No `org_admin` or `platform_admin` user is seeded. Admin-role APIs exist on the backend but require a manually created admin user — see [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md).

---

## Environment variables

### Frontend (repo root `.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000/api/v1` | REST API base URL |

Copy from [`.env.example`](.env.example).

### Backend (`backend/.env`)

Copy from [`backend/.env.example`](backend/.env.example). **Never commit real secrets.**

| Group | Key variables | Notes |
|-------|---------------|-------|
| Server | `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGIN` | `CORS_ORIGIN` must list frontend origin(s) |
| Database | `DATABASE_URL` | Matches `docker-compose.yml` in dev |
| Redis | `REDIS_URL` | Required in production |
| Secrets | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_SECRET` | Min 32 chars in production |
| JWT TTL | `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Defaults: 15m / 7d |
| Storage | `STORAGE_PROVIDER`, `S3_*`, `UPLOAD_DIR` | `s3` + MinIO locally |
| Platform | `DEFAULT_ORGANIZATION_SLUG`, `APP_URL`, `APP_NAME` | Single-tenant default org |
| Email | `MAIL_*`, `SMTP_*`, `SMTP_USE_ETHEREAL` | Ethereal for dev when SMTP unset |
| Auth policy | `REQUIRE_EMAIL_VERIFICATION`, `EMAIL_VERIFICATION_EXPIRES_HOURS` | |
| Rate limits | `THROTTLE_*` | Use `THROTTLE_USE_REDIS=true` in production |
| Dev / E2E | `E2E_TEST_MODE` | **Must be `false` in production** |

Full annotated list: [`backend/.env.example`](backend/.env.example)

Production validation: `backend/src/config/env.validation.ts`

---

## SMTP configuration

### Local development (no real mailbox)

Leave `SMTP_HOST` empty and set:

```env
SMTP_USE_ETHEREAL=true
MAIL_ENABLED=true
```

Nodemailer provisions an Ethereal test inbox; preview URLs appear in backend logs after each send.

### Production / real SMTP

```env
SMTP_USE_ETHEREAL=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailbox@example.com
SMTP_PASS=your-mailbox-password
SMTP_FROM="Your App Name <noreply@example.com>"
```

Port `587` uses **STARTTLS** (`SMTP_SECURE=false`). The mail service sets `requireTLS: true` automatically for port 587.

Optional branding in emails:

```env
APP_LOGO_URL=https://your-frontend.example.com/brand/logo.jpeg
```

---

## Media storage setup

### Local (MinIO via Docker)

`docker compose up -d` starts MinIO. Backend `.env` defaults:

```env
STORAGE_PROVIDER=s3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=sgpg_minio
S3_SECRET_KEY=sgpg_minio_dev_password
S3_BUCKET=sgpg-lms
S3_USE_SSL=false
```

MinIO console: `http://localhost:9001` — verify bucket `sgpg-lms` exists.

### Production

Replace with real S3 (or compatible) credentials. Do **not** use `sgpg_minio_dev_password` in production — env validation rejects dev placeholder secrets.

---

## Database setup

| Item | Location |
|------|----------|
| Prisma schema | `backend/prisma/schema.prisma` |
| Migrations | `backend/prisma/migrations/` |
| Seed script | `backend/prisma/seed.ts` |

```bash
cd backend
npx prisma migrate deploy    # Apply migrations (CI / prod / fresh dev)
npm run db:seed              # Demo users, courses, workspace data
npx prisma studio            # Visual DB browser (optional)
```

**Development only — reset database:**

```bash
cd backend
npx prisma migrate reset     # Drops DB, re-applies migrations, runs seed
```

Full details: [`docs/DATABASE.md`](docs/DATABASE.md)

---

## Run commands

### Backend

```bash
cd backend
npm run start:dev      # Development with hot reload
npm run build          # Compile TypeScript
npm run start:prod     # Run compiled build
npm test               # Unit tests
npm run test:verify    # Full API smoke + E2E
```

### Frontend

```bash
npm run dev            # Vite dev server (port 5173)
npm run build          # Typecheck + production build
npm run preview        # Preview production build
npm run lint           # ESLint
```

---

## Verification commands

Run with Docker services up and backend running on port 3000. Frontend scripts also need Vite on port 5173.

```bash
# Backend API (122+ smoke + E2E checks)
npm run verify:backend

# Frontend routes (Playwright — install browsers first)
npx playwright install chromium
npm run verify:frontend

# Data isolation (student/instructor cross-access)
node scripts/verify-isolation.mjs

# Cross-browser & responsive (optional)
npm run verify:cross-browser
npm run verify:responsive

# Builds
npm run build
cd backend && npm run build
```

Optional env: `API_URL=http://localhost:3000/api/v1`, `PREVIEW_URL=http://localhost:5173`

---

## Folder structure

```
homepage/
├── src/                          # React SPA
│   ├── pages/                    # Route pages (auth, dashboard, marketing)
│   ├── components/               # UI, layout, dashboard widgets
│   ├── contexts/                 # Auth, workspace providers
│   ├── lib/api/                  # API client modules (one per domain)
│   ├── data/                     # Types, nav config, marketing static copy
│   └── config/branding.ts        # Brand tokens (logo, colors)
├── backend/
│   ├── prisma/                   # Schema, migrations, seed
│   └── src/
│       ├── modules/              # NestJS feature modules
│       ├── common/               # DTOs, guards, filters
│       ├── config/               # Env validation, branding
│       └── queue/                # BullMQ workers
├── scripts/                      # Verification scripts
├── docs/                         # Architecture, API, deployment, database
├── public/brand/                 # Logo, favicon (swap logo.jpeg for rebrand)
├── docker-compose.yml            # Local Postgres, Redis, MinIO
├── INTEGRATION_GUIDE.md          # Admin developer handover (start here)
└── README.md                     # This file
```

---

## API documentation

| Resource | Location |
|----------|----------|
| Static endpoint reference | [`docs/API.md`](docs/API.md) |
| Interactive Swagger (dev) | `http://localhost:3000/docs` |
| API client (frontend) | `src/lib/api/*.ts` |
| DTOs / request shapes | `backend/src/common/dto/` |

### Testing APIs locally

1. Start backend (`npm run start:dev` in `backend/`).
2. Open Swagger at `http://localhost:3000/docs`.
3. Register or login via `POST /auth/login` to obtain `accessToken`.
4. Click **Authorize** in Swagger and paste: `Bearer <accessToken>`.
5. Or use curl:

```bash
curl -s http://localhost:3000/api/v1/health
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"neha.sharma@example.com","password":"Password123!","role":"student"}'
```

---

## Common troubleshooting

| Problem | Solution |
|---------|----------|
| `Environment validation failed` on backend start | Copy `backend/.env.example` → `.env`; ensure `APP_SECRET`, JWT secrets, and `DATABASE_URL` are set |
| `Cannot reach API` / frontend login fails | Confirm backend on port 3000; check `VITE_API_URL` matches `API_PREFIX` |
| CORS errors | Add frontend origin to `CORS_ORIGIN` in `backend/.env` |
| `docker ps` shows no containers | Run `docker compose up -d` from repo root |
| Prisma migration errors | Ensure Postgres is healthy: `docker exec sgpg-postgres pg_isready -U sgpg` |
| MinIO upload failures | Verify MinIO running; check `S3_ENDPOINT` and bucket name |
| Email not sending locally | Use `SMTP_USE_ETHEREAL=true` or configure real SMTP vars |
| Playwright verify fails | Run `npx playwright install chromium` |
| Unverified login blocked | Complete email verification or use seeded verified accounts |
| Slow register/forgot-password | Live SMTP adds latency; normal in dev with real SMTP |

---

## Production notes

- Generate unique secrets: `openssl rand -base64 48`
- Set `NODE_ENV=production`, `E2E_TEST_MODE=false`, `SMTP_USE_ETHEREAL=false`
- Set `REDIS_URL` and `THROTTLE_USE_REDIS=true` for multi-instance deploys
- Set `CORS_ORIGIN` to exact frontend origin(s)
- Use production S3 credentials (not MinIO dev keys)
- Configure real SMTP when `MAIL_ENABLED=true`
- **Do not** run `npm run db:seed` against a production database
- Restrict `/health/detailed` from public internet
- Set `trust proxy` if behind a load balancer (see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md))

Further reading:

| Document | Description |
|----------|-------------|
| [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) | **Admin module integration** |
| [`docs/API.md`](docs/API.md) | REST endpoint reference |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Prisma, migrations, seed |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module map, request flow |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production Docker compose |
| [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) | Readiness checklist |

---

## Known limitations / upcoming features

These modules are **intentionally deferred** — not bugs:

| Feature | Student route | Instructor route | Status |
|---------|---------------|------------------|--------|
| Messages | `/dashboard/messages` | `/instructor/messages` | Coming Soon page |
| Live coaching | `/dashboard/coaching` | `/instructor/coaching` | Coming Soon page |
| Downloads | `/dashboard/downloads` | — | Coming Soon page |
| Earnings / payouts | — | `/instructor/earnings` | Coming Soon page |
| Announcements | — | `/instructor/announcements` | Coming Soon page |

These routes are **hidden from sidebar navigation** but reachable by direct URL. They display a branded placeholder and do not affect core LMS functionality.

---

## License

Private — SG Pro Growth.
