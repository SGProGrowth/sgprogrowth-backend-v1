# SG Pro Growth LMS — API

NestJS REST API for the SG Pro Growth learning platform.

**Full setup and verification:** see the [root README](../README.md).

**Endpoint reference:** [docs/API.md](../docs/API.md)  
**Interactive docs (dev):** `http://localhost:3000/docs`  
**Architecture:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Stack

- NestJS 11, TypeScript, Prisma 6, PostgreSQL 16
- Redis 7 — cache, rate limiting, BullMQ job queues
- MinIO / S3 — media, certificates, assignment uploads
- Argon2 + JWT (access + refresh tokens)
- Nodemailer — transactional & notification email

## Quick start

```bash
# From repo root — start Postgres, Redis, MinIO
docker compose up -d

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/api/v1` | API base |
| `http://localhost:3000/docs` | Swagger UI (development only) |
| `http://localhost:3000/api/v1/health/ready` | Readiness probe |

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Dev server with watch |
| `npm run start` | Production build + run |
| `npm run build` | Compile TypeScript |
| `npm run test:verify` | Full API smoke + E2E (`scripts/verify-backend.mjs`) |
| `npm test` | Jest unit tests |
| `npm run db:seed` | Seed demo users, courses, workspace data |
| `npm run prisma:migrate` | Create migration (dev) |
| `npm run prisma:migrate:deploy` | Apply migrations (prod/CI) |
| `npm run prisma:studio` | Database GUI |

## Environment

Copy `backend/.env.example` → `backend/.env`. Required at minimum:

- `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

Production additionally requires: `REDIS_URL`, `CORS_ORIGIN`, strong JWT secrets (32+ chars), `E2E_TEST_MODE=false`.

See [root README — Environment variables](../README.md#environment-variables) for the full table.

## Modules

```
backend/src/modules/
├── auth/          Registration, login, tokens, password reset
├── students/      Student workspace + profile
├── instructors/   Instructor workspace + profile
├── categories/    Course categories
├── courses/       Catalog, curriculum, publishing
├── enrollments/   Student enrollments
├── progress/      Lesson & course completion
├── assignments/   Assignments, submissions, grading
├── questions/     Question bank, import/export
├── quizzes/       Quizzes, attempts, auto-grading
├── batches/       Cohorts, bulk student import
├── certificates/  Issue, download, public verify
├── analytics/     Dashboards, heatmaps, reports
├── media/         Uploads, signed URLs
├── mail/          SMTP, templates, notifications
└── health/        Liveness, readiness, detailed probes
```

Background workers (BullMQ): mail, certificates, batch-import, analytics, notifications, cleanup — see [ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Seed data

Password: **`Password123!`**

| Email | Role |
|-------|------|
| neha.sharma@example.com | student |
| cloud.lead@example.com | instructor |

Full list in [root README](../README.md#seed-accounts).

## Verification

With API running on port 3000:

```bash
npm run test:verify
```

From repo root: `npm run verify:backend`

Optional: `API_URL=http://localhost:3000/api/v1`

## Frontend integration

Set in repo root `.env`:

```
VITE_API_URL=http://localhost:3000/api/v1
```

API client: `src/lib/api/client.ts` — handles token refresh, friendly errors, and `credentials: include` for cross-origin requests.

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-workspace.ts
│   └── migrations/
├── src/
│   ├── config/       Env validation
│   ├── common/       DTOs, guards, filters, middleware
│   ├── cache/        Redis cache service
│   ├── queue/        BullMQ queues & processors
│   └── modules/      Feature modules (see above)
├── Dockerfile
└── .env.example
```
